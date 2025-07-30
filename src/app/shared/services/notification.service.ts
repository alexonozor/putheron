import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { ConfigService } from './config.service';

export interface Notification {
  _id: string;
  recipient_id: string;
  sender_id?: {
    _id: string;
    email: string;
    first_name?: string;
    last_name: string;
  };
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  is_read: boolean;
  is_seen: boolean;
  project_id?: {
    _id: string;
    title: string;
    description: string;
    status: string;
  };
  business_id?: {
    _id: string;
    name: string;
    logo_url?: string;
  };
  metadata?: Record<string, any>;
  read_at?: Date;
  seen_at?: Date;
  expires_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum NotificationType {
  PROJECT_CREATED = 'project_created',
  PROJECT_ACCEPTED = 'project_accepted',
  PROJECT_REJECTED = 'project_rejected',
  PROJECT_STARTED = 'project_started',
  PROJECT_COMPLETED = 'project_completed',
  PAYMENT_REQUEST = 'payment_request',
  PAYMENT_APPROVED = 'payment_approved',
  PAYMENT_REJECTED = 'payment_rejected',
  COMPLETION_REQUEST = 'completion_request',
  COMPLETION_APPROVED = 'completion_approved',
  COMPLETION_REJECTED = 'completion_rejected',
  PROMOTION = 'promotion',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  MESSAGE_RECEIVED = 'message_received',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface NotificationQuery {
  type?: NotificationType;
  is_read?: boolean;
  is_seen?: boolean;
  page?: number;
  limit?: number;
}

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  // Signals for reactive state management
  readonly notifications = signal<Notification[]>([]);
  readonly unreadCount = signal<number>(0);
  readonly isLoading = signal<boolean>(false);

  // Audio for notification sound
  private notificationAudio?: HTMLAudioElement;

  constructor() {
    this.initializeNotificationSound();
  }

  private initializeNotificationSound() {
    // Create notification sound (you can replace with a custom sound file)
    this.notificationAudio = new Audio();
    this.notificationAudio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+T5u20e';
    this.notificationAudio.volume = 0.5;
  }

  private getApiUrl(endpoint: string): string {
    return this.config.getApiUrl(`notifications${endpoint}`);
  }

  async getNotifications(query: NotificationQuery = {}): Promise<NotificationResponse> {
    this.isLoading.set(true);
    try {
      const params = new URLSearchParams();
      if (query.type) params.append('type', query.type);
      if (query.is_read !== undefined) params.append('is_read', query.is_read.toString());
      if (query.is_seen !== undefined) params.append('is_seen', query.is_seen.toString());
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());

      const url = this.getApiUrl(`?${params.toString()}`);
      const response = await firstValueFrom(this.http.get<any>(url));

      if (response.success) {
        this.notifications.set(response.data);
        this.unreadCount.set(response.meta.unreadCount);
        return {
          notifications: response.data,
          total: response.meta.total,
          unreadCount: response.meta.unreadCount,
          page: response.meta.page,
          limit: response.meta.limit,
        };
      }
      throw new Error(response.message || 'Failed to fetch notifications');
    } finally {
      this.isLoading.set(false);
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await firstValueFrom(this.http.get<any>(this.getApiUrl('/unread-count')));
      if (response.success) {
        this.unreadCount.set(response.data.count);
        return response.data.count;
      }
      throw new Error(response.message || 'Failed to fetch unread count');
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await firstValueFrom(
      this.http.patch<any>(this.getApiUrl(`/${notificationId}/read`), {})
    );
    
    if (response.success) {
      // Update local state
      const notifications = this.notifications();
      const updatedNotifications = notifications.map(n => 
        n._id === notificationId ? { ...n, is_read: true, read_at: new Date() } : n
      );
      this.notifications.set(updatedNotifications);
      
      // Update unread count
      const currentCount = this.unreadCount();
      this.unreadCount.set(Math.max(0, currentCount - 1));
      
      return response.data;
    }
    throw new Error(response.message || 'Failed to mark notification as read');
  }

  async markAsSeen(notificationId: string): Promise<Notification> {
    const response = await firstValueFrom(
      this.http.patch<any>(this.getApiUrl(`/${notificationId}/seen`), {})
    );
    
    if (response.success) {
      // Update local state
      const notifications = this.notifications();
      const updatedNotifications = notifications.map(n => 
        n._id === notificationId ? { ...n, is_seen: true, seen_at: new Date() } : n
      );
      this.notifications.set(updatedNotifications);
      
      return response.data;
    }
    throw new Error(response.message || 'Failed to mark notification as seen');
  }

  async markAllAsRead(): Promise<void> {
    const response = await firstValueFrom(
      this.http.patch<any>(this.getApiUrl('/mark-all-read'), {})
    );
    
    if (response.success) {
      // Update local state
      const notifications = this.notifications();
      const updatedNotifications = notifications.map(n => ({ ...n, is_read: true, read_at: new Date() }));
      this.notifications.set(updatedNotifications);
      this.unreadCount.set(0);
    } else {
      throw new Error(response.message || 'Failed to mark all notifications as read');
    }
  }

  async markAllAsSeen(): Promise<void> {
    const response = await firstValueFrom(
      this.http.patch<any>(this.getApiUrl('/mark-all-seen'), {})
    );
    
    if (response.success) {
      // Update local state
      const notifications = this.notifications();
      const updatedNotifications = notifications.map(n => ({ ...n, is_seen: true, seen_at: new Date() }));
      this.notifications.set(updatedNotifications);
    } else {
      throw new Error(response.message || 'Failed to mark all notifications as seen');
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.delete<any>(this.getApiUrl(`/${notificationId}`))
    );
    
    if (response.success) {
      // Update local state
      const notifications = this.notifications();
      const updatedNotifications = notifications.filter(n => n._id !== notificationId);
      this.notifications.set(updatedNotifications);
      
      // Update unread count if the deleted notification was unread
      const deletedNotification = notifications.find(n => n._id === notificationId);
      if (deletedNotification && !deletedNotification.is_read) {
        const currentCount = this.unreadCount();
        this.unreadCount.set(Math.max(0, currentCount - 1));
      }
    } else {
      throw new Error(response.message || 'Failed to delete notification');
    }
  }

  // Method to handle new notification from socket
  handleNewNotification(notification: Notification) {
    // Add to beginning of notifications array
    const currentNotifications = this.notifications();
    this.notifications.set([notification, ...currentNotifications]);
    
    // Update unread count
    if (!notification.is_read) {
      const currentCount = this.unreadCount();
      this.unreadCount.set(currentCount + 1);
    }

    // Play notification sound
    this.playNotificationSound();

    // Update page title to show notification
    this.updatePageTitle();

    // Show browser notification if supported
    this.showBrowserNotification(notification);
  }

  // Method to handle unread count update from socket
  handleUnreadCountUpdate(count: number) {
    this.unreadCount.set(count);
  }

  private playNotificationSound() {
    if (this.notificationAudio) {
      this.notificationAudio.currentTime = 0;
      this.notificationAudio.play().catch(error => {
        console.warn('Could not play notification sound:', error);
      });
    }
  }

  private updatePageTitle() {
    const count = this.unreadCount();
    const originalTitle = document.title.replace(/^\(\d+\)\s/, '');
    
    if (count > 0) {
      document.title = `(${count}) ${originalTitle}`;
    } else {
      document.title = originalTitle;
    }
  }

  private showBrowserNotification(notification: Notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }
  }

  // Request browser notification permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission;
    }
    return 'denied';
  }

  // Utility methods for notification types
  getNotificationIcon(type: NotificationType): string {
    const icons = {
      [NotificationType.PROJECT_CREATED]: '📋',
      [NotificationType.PROJECT_ACCEPTED]: '✅',
      [NotificationType.PROJECT_REJECTED]: '❌',
      [NotificationType.PROJECT_STARTED]: '🚀',
      [NotificationType.PROJECT_COMPLETED]: '🎉',
      [NotificationType.PAYMENT_REQUEST]: '💳',
      [NotificationType.PAYMENT_APPROVED]: '✅',
      [NotificationType.PAYMENT_REJECTED]: '❌',
      [NotificationType.COMPLETION_REQUEST]: '📝',
      [NotificationType.COMPLETION_APPROVED]: '✅',
      [NotificationType.COMPLETION_REJECTED]: '❌',
      [NotificationType.PROMOTION]: '🎊',
      [NotificationType.SYSTEM_ANNOUNCEMENT]: '📢',
      [NotificationType.MESSAGE_RECEIVED]: '💬',
    };
    return icons[type] || '🔔';
  }

  getNotificationColor(priority: NotificationPriority): string {
    const colors = {
      [NotificationPriority.LOW]: 'bg-gray-100 border-gray-300',
      [NotificationPriority.MEDIUM]: 'bg-blue-50 border-blue-300',
      [NotificationPriority.HIGH]: 'bg-orange-50 border-orange-300',
      [NotificationPriority.URGENT]: 'bg-red-50 border-red-300',
    };
    return colors[priority] || colors[NotificationPriority.MEDIUM];
  }

  formatTimeAgo(date: Date | string): string {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return notificationDate.toLocaleDateString();
  }
}
