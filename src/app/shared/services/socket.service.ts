import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject, fromEvent } from 'rxjs';
import { AuthService } from './auth.service';
import { ConfigService } from './config.service';
import { NotificationService, Notification } from './notification.service';

export interface SocketMessage {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

export interface TypingUser {
  userId: string;
  userName?: string;
  isTyping: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private readonly authService = inject(AuthService);
  private readonly configService = inject(ConfigService);
  private readonly notificationService = inject(NotificationService);

  private socket: Socket | null = null;
  private readonly connectionStatus = new BehaviorSubject<boolean>(false);
  private readonly typingUsers = new BehaviorSubject<TypingUser[]>([]);

  // Public observables
  readonly isConnected$ = this.connectionStatus.asObservable();
  readonly typingUsers$ = this.typingUsers.asObservable();

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    const user = this.authService.user();
    if (!user) {
      console.warn('No user found, cannot initialize socket');
      return;
    }

    const baseUrl = this.configService.apiBaseUrl;
    const socketUrl = baseUrl.replace('/api', ''); // Remove /api from the URL

    this.socket = io(socketUrl, {
      auth: {
        token: this.authService.getAuthToken(),
        userId: user._id,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.connectionStatus.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connectionStatus.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.connectionStatus.next(false);
      
      // Retry connection after 5 seconds
      setTimeout(() => {
        if (this.socket && this.socket.disconnected) {
          console.log('Attempting to reconnect...');
          this.socket.connect();
        }
      }, 5000);
    });

    // Listen for typing events
    this.socket.on('user-typing', (data: TypingUser) => {
      const currentTyping = this.typingUsers.value;
      
      if (data.isTyping) {
        // Add user to typing list if not already there
        const existingUser = currentTyping.find(u => u.userId === data.userId);
        if (!existingUser) {
          this.typingUsers.next([...currentTyping, data]);
        }
      } else {
        // Remove user from typing list
        this.typingUsers.next(currentTyping.filter(u => u.userId !== data.userId));
      }
    });

    // Listen for notification events
    this.socket.on('new-notification', (notification: Notification) => {
      console.log('New notification received:', notification);
      this.notificationService.handleNewNotification(notification);
    });

    this.socket.on('unread-count-updated', (data: { count: number }) => {
      console.log('Unread count updated:', data.count);
      this.notificationService.handleUnreadCountUpdate(data.count);
    });
  }

  // Connect to the socket if not already connected
  connect() {
    if (!this.socket || this.socket.disconnected) {
      console.log('Initializing new socket connection...');
      this.initializeSocket();
    } else if (this.socket.connected) {
      console.log('Socket already connected');
    }
  }

  // Disconnect from socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.connectionStatus.next(false);
    }
  }

  // Join a chat room
  joinChat(chatId: string): Promise<SocketMessage> {
    const user = this.authService.user();
    if (!this.socket || !user) {
      return Promise.reject(new Error('Socket not connected or user not authenticated'));
    }

    return new Promise((resolve) => {
      this.socket!.emit('join-chat', { chatId, userId: user._id }, (response: SocketMessage) => {
        console.log('Joined chat:', response);
        resolve(response);
      });
    });
  }

  // Leave a chat room
  leaveChat(chatId: string): Promise<SocketMessage> {
    const user = this.authService.user();
    if (!this.socket || !user) {
      return Promise.reject(new Error('Socket not connected or user not authenticated'));
    }

    return new Promise((resolve) => {
      this.socket!.emit('leave-chat', { chatId, userId: user._id }, (response: SocketMessage) => {
        console.log('Left chat:', response);
        resolve(response);
      });
    });
  }

  // Send a message via socket
  sendMessage(chatId: string, content: string): Promise<SocketMessage> {
    const user = this.authService.user();
    if (!this.socket || !user) {
      return Promise.reject(new Error('Socket not connected or user not authenticated'));
    }

    return new Promise((resolve) => {
      this.socket!.emit('send-message', { 
        chatId, 
        content, 
        userId: user._id 
      }, (response: SocketMessage) => {
        console.log('Message sent:', response);
        resolve(response);
      });
    });
  }

  // Listen for new messages
  onNewMessage(): Observable<SocketMessage> {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    return fromEvent(this.socket, 'new-message');
  }

  // Listen for message errors
  onMessageError(): Observable<SocketMessage> {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    return fromEvent(this.socket, 'message-error');
  }

  // Listen for user joined events
  onUserJoined(): Observable<any> {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    return fromEvent(this.socket, 'user-joined');
  }

  // Listen for user left events
  onUserLeft(): Observable<any> {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    return fromEvent(this.socket, 'user-left');
  }

  // Start typing indicator
  startTyping(chatId: string) {
    const user = this.authService.user();
    if (!this.socket || !user) return;

    this.socket.emit('typing-start', {
      chatId,
      userId: user._id,
      userName: user.last_name || user.email,
    });
  }

  // Stop typing indicator
  stopTyping(chatId: string) {
    const user = this.authService.user();
    if (!this.socket || !user) return;

    this.socket.emit('typing-stop', {
      chatId,
      userId: user._id,
    });
  }

  // Get typing users for a specific chat (filtered by current user)
  getTypingUsersForChat(): Observable<TypingUser[]> {
    return this.typingUsers$;
  }

  // Listen for new notifications
  onNewNotification(): Observable<Notification> {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    return fromEvent(this.socket, 'new-notification');
  }

  // Listen for unread count updates
  onUnreadCountUpdate(): Observable<{ count: number }> {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    return fromEvent(this.socket, 'unread-count-updated');
  }

  // Generic emit method for custom events
  emit(event: string, data?: any): void {
    if (!this.socket) {
      console.warn('Socket not connected, cannot emit event:', event);
      return;
    }
    this.socket.emit(event, data);
  }

  // Generic event listener for custom events
  onEvent(event: string): Observable<any> {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    return fromEvent(this.socket, event);
  }

  // Cleanup when service is destroyed
  ngOnDestroy() {
    this.disconnect();
  }
}
