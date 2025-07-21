import { Component, OnInit, OnDestroy, inject, signal, computed, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { ChatService, Chat, Message } from '../../../shared/services/chat.service';
import { AuthService } from '../../../shared/services/auth.service';
import { ProjectService } from '../../../shared/services/project.service';
import { SocketService, TypingUser } from '../../../shared/services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
  ],
  templateUrl: './chat-room.component.html',
  styleUrl: './chat-room.component.scss'
})
export class ChatRoomComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;

  private readonly chatService = inject(ChatService);
  private readonly authService = inject(AuthService);
  private readonly projectService = inject(ProjectService);
  private readonly socketService = inject(SocketService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);

  // Signals
  readonly loading = signal(false);
  readonly messagesLoading = signal(false);
  readonly sendingMessage = signal(false);
  readonly error = signal<string | null>(null);
  readonly chat = signal<Chat | null>(null);
  readonly messages = signal<Message[]>([]);
  readonly typingUsers = signal<TypingUser[]>([]);
  readonly isConnected = signal<boolean>(false);

  // Form
  messageForm: FormGroup;

  // Computed signals
  readonly user = this.authService.user;
  readonly hasMessages = computed(() => this.messages().length > 0);
  readonly otherParticipant = computed(() => {
    const currentChat = this.chat();
    const currentUserId = this.user()?._id;
    if (!currentChat || !currentUserId) return null;
    
    if (currentChat.project_id.client_id._id === currentUserId) {
      return currentChat.project_id.business_owner_id;
    }
    return currentChat.project_id.client_id;
  });

  private chatId: string | null = null;
  private shouldScrollToBottom = false;
  private refreshInterval: any;
  private subscriptions: Subscription[] = [];
  private typingTimeout: any;

  constructor() {
    this.messageForm = this.formBuilder.group({
      content: ['', [Validators.required, Validators.maxLength(1000)]]
    });
  }

  ngOnInit() {
    if (!this.user()) {
      this.router.navigate(['/auth']);
      return;
    }

    // Set up socket subscriptions
    this.setupSocketSubscriptions();

    this.route.params.subscribe(params => {
      this.chatId = params['chatId'];
      if (this.chatId) {
        this.loadChat();
        this.loadMessages();
        this.markMessagesAsRead();
        this.joinSocketRoom();
        
        // No auto-refresh needed since we have real-time socket updates
      }
    });
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Leave socket room and cleanup subscriptions
    if (this.chatId) {
      this.socketService.leaveChat(this.chatId);
    }
    
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private setupSocketSubscriptions() {
    // Subscribe to socket connection status
    const connectionSub = this.socketService.isConnected$.subscribe(isConnected => {
      this.isConnected.set(isConnected);
    });

    // Subscribe to new messages
    const newMessageSub = this.socketService.onNewMessage().subscribe(response => {
      if (response.success && response.data) {
        const currentMessages = this.messages();
        this.messages.set([...currentMessages, response.data]);
        this.shouldScrollToBottom = true;
      }
    });

    // Subscribe to message errors
    const errorSub = this.socketService.onMessageError().subscribe(error => {
      console.error('Socket message error:', error);
      this.error.set(error.error || 'Message failed to send');
    });

    // Subscribe to typing indicators
    const typingSub = this.socketService.getTypingUsersForChat().subscribe(typingUsers => {
      const currentUserId = this.user()?._id;
      // Filter out current user from typing list
      const otherUsersTyping = typingUsers.filter(user => user.userId !== currentUserId);
      this.typingUsers.set(otherUsersTyping);
    });

    this.subscriptions.push(connectionSub, newMessageSub, errorSub, typingSub);
  }

  private async joinSocketRoom() {
    if (!this.chatId) return;
    
    try {
      await this.socketService.joinChat(this.chatId);
      console.log('Joined socket room for chat:', this.chatId);
    } catch (error) {
      console.error('Failed to join socket room:', error);
    }
  }

  async loadChat() {
    if (!this.chatId) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const chat = await this.chatService.getChatByIdAsync(this.chatId);
      this.chat.set(chat);
    } catch (error: any) {
      console.error('Error loading chat:', error);
      this.error.set('Failed to load chat');
    } finally {
      this.loading.set(false);
    }
  }

  async loadMessages(showLoading = true) {
    if (!this.chatId) return;

    if (showLoading) {
      this.messagesLoading.set(true);
    }

    try {
      const messages = await this.chatService.getChatMessagesAsync(this.chatId);
      // Reverse to show oldest first
      this.messages.set(messages.reverse());
      this.shouldScrollToBottom = true;
    } catch (error: any) {
      console.error('Error loading messages:', error);
      if (showLoading) {
        this.error.set('Failed to load messages');
      }
    } finally {
      if (showLoading) {
        this.messagesLoading.set(false);
      }
    }
  }

  async sendMessage() {
    const content = this.messageForm.get('content')?.value?.trim();
    
    if (!content || !this.chatId || this.sendingMessage()) {
      console.log('Cannot send message:', { content, chatId: this.chatId, sending: this.sendingMessage() });
      return;
    }

    this.sendingMessage.set(true);
    this.error.set(null);

    try {
      console.log('Sending message via socket:', { chatId: this.chatId, content });
      
      // Stop typing indicator
      this.socketService.stopTyping(this.chatId);
      
      // Send message via socket for real-time delivery
      const response = await this.socketService.sendMessage(this.chatId, content);
      
      if (response.success) {
        // Clear form - message will be added via socket subscription
        this.messageForm.reset();
        console.log('Message sent successfully via socket');
      } else {
        throw new Error(response.error || 'Failed to send message');
      }
      
    } catch (error: any) {
      console.error('Error sending message via socket:', error);
      
      // Fallback to HTTP if socket fails
      try {
        console.log('Falling back to HTTP message sending');
        await this.chatService.sendMessageAsync(this.chatId, {
          content,
          message_type: 'text'
        });
        
        // Clear form and reload messages
        this.messageForm.reset();
        await this.loadMessages(false);
        this.shouldScrollToBottom = true;
        
        console.log('Message sent successfully via HTTP fallback');
      } catch (httpError: any) {
        console.error('HTTP fallback also failed:', httpError);
        this.error.set('Failed to send message. Please try again.');
      }
    } finally {
      this.sendingMessage.set(false);
    }
  }

  async markMessagesAsRead() {
    if (!this.chatId) return;

    try {
      await this.chatService.markMessagesAsReadAsync(this.chatId);
    } catch (error: any) {
      console.error('Error marking messages as read:', error);
    }
  }

  isMyMessage(message: Message): boolean {
    return message.sender_id._id === this.user()?._id;
  }

  formatMessageTime(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatMessageDate(date: string | Date): string {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString();
    }
  }

  shouldShowDateDivider(index: number): boolean {
    if (index === 0) return true;
    
    const currentMessage = this.messages()[index];
    const previousMessage = this.messages()[index - 1];
    
    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();
    
    return currentDate !== previousDate;
  }

  // Typing indicator methods
  onTextareaInput() {
    if (!this.chatId) return;
    
    // Start typing indicator
    this.socketService.startTyping(this.chatId);
    
    // Clear previous timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    // Stop typing indicator after 3 seconds of inactivity
    this.typingTimeout = setTimeout(() => {
      this.socketService.stopTyping(this.chatId!);
    }, 3000);
  }

  onTextareaKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  getTypingText(): string {
    const typing = this.typingUsers();
    if (typing.length === 0) return '';
    
    if (typing.length === 1) {
      return `${typing[0].userName || 'Someone'} is typing...`;
    } else if (typing.length === 2) {
      return `${typing[0].userName || 'Someone'} and ${typing[1].userName || 'someone else'} are typing...`;
    } else {
      return 'Several people are typing...';
    }
  }

  getProjectStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'accepted': 'bg-blue-100 text-blue-800 border-blue-200',
      'in_progress': 'bg-purple-100 text-purple-800 border-purple-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'rejected': 'bg-red-100 text-red-800 border-red-200',
      'cancelled': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || colors['pending'];
  }

  goToProjectDetails() {
    const chat = this.chat();
    if (chat) {
      this.router.navigate(['/dashboard/projects', chat.project_id._id]);
    }
  }

  async handleProjectAction(action: 'accept' | 'reject' | 'start' | 'complete') {
    const chat = this.chat();
    if (!chat) return;

    try {
      const projectId = chat.project_id._id;
      
      switch (action) {
        case 'accept':
          await this.projectService.updateProjectAsync(projectId, { status: 'accepted' });
          break;
        case 'reject':
          const reason = prompt('Please provide a reason for rejection:');
          if (!reason) return;
          await this.projectService.updateProjectAsync(projectId, { 
            status: 'rejected',
            rejection_reason: reason 
          });
          break;
        case 'start':
          await this.projectService.updateProjectAsync(projectId, { status: 'in_progress' });
          break;
        case 'complete':
          await this.projectService.updateProjectAsync(projectId, { status: 'completed' });
          break;
      }

      // Refresh chat data
      await this.loadChat();
      
      // Send a system message about the status change
      await this.chatService.sendMessageAsync(this.chatId!, {
        content: `Project status updated to: ${action === 'start' ? 'in progress' : action}${action === 'reject' ? 'd' : 'd'}`,
        message_type: 'project_update'
      });
      
      await this.loadMessages(false);
      
    } catch (error: any) {
      console.error(`Error ${action}ing project:`, error);
      this.error.set(`Failed to ${action} project`);
    }
  }

  canPerformAction(action: 'accept' | 'reject' | 'start' | 'complete'): boolean {
    const chat = this.chat();
    const user = this.user();
    if (!chat || !user) return false;

    const isBusinessOwner = chat.project_id.business_owner_id._id === user._id;
    const status = chat.project_id.status;

    switch (action) {
      case 'accept':
      case 'reject':
        return isBusinessOwner && status === 'pending';
      case 'start':
        return isBusinessOwner && status === 'accepted';
      case 'complete':
        return isBusinessOwner && status === 'in_progress';
      default:
        return false;
    }
  }

  private scrollToBottom(): void {
    try {
      const element = this.messagesContainer?.nativeElement;
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  navigateBack() {
    this.router.navigate(['dashboard', 'messages', 'chats']);
  }
}
