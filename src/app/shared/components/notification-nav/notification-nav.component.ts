import { Component, inject, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificationService, Notification, NotificationType, NotificationPriority } from '../../services/notification.service';
import { SocketService } from '../../services/socket.service';
import { MatIconModule } from '@angular/material/icon';
import {MatBadgeModule} from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';



@Component({
  selector: 'app-notification-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatBadgeModule],
  templateUrl: './notification-nav.component.html',
  styleUrl: './notification-nav.component.scss'
})
export class NotificationNavComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly socketService = inject(SocketService);
  private readonly router = inject(Router);

  // Component state
  isDropdownOpen = false;
  isMarkingAllRead = false;

  // Reactive state from service
  readonly notifications = this.notificationService.notifications;
  readonly unreadCount = this.notificationService.unreadCount;
  readonly isLoading = this.notificationService.isLoading;

  // Computed values
  readonly hasUnreadNotifications = computed(() => this.unreadCount() > 0);
  readonly recentNotifications = computed(() => 
    this.notifications().slice(0, 5) // Show only 5 most recent in dropdown
  );

  constructor() {
    // Update page title when unread count changes
    effect(() => {
      this.updatePageTitle();
    });
  }

  ngOnInit() {
    // Load initial notifications
    this.loadNotifications();
    
    // Request browser notification permission
    this.notificationService.requestNotificationPermission();
  }

  async loadNotifications() {
    try {
      await this.notificationService.getNotifications({ 
        limit: 20, 
        page: 1 
      });
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    
    // Mark unseen notifications as seen when dropdown is opened
    if (this.isDropdownOpen) {
      this.markUnseenAsSeen();
    }
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  async markUnseenAsSeen() {
    try {
      await this.notificationService.markAllAsSeen();
      // Note: markAllAsSeen should NOT update unreadCount - only markAllAsRead should do that
    } catch (error) {
      console.error('Error marking notifications as seen:', error);
    }
  }

  async markAllAsRead() {
    this.isMarkingAllRead = true;
    try {
      await this.notificationService.markAllAsRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      this.isMarkingAllRead = false;
    }
  }

  async handleNotificationClick(notification: Notification) {
    // Mark as read if not already read
    if (!notification.is_read) {
      try {
        await this.notificationService.markAsRead(notification._id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate based on notification type and content
    this.navigateFromNotification(notification);
    
    // Close dropdown
    this.closeDropdown();
  }

  private navigateFromNotification(notification: Notification) {
    // Implement navigation logic based on notification type
    switch (notification.type) {
      case NotificationType.PROJECT_CREATED:
      case NotificationType.PROJECT_ACCEPTED:
      case NotificationType.PROJECT_REJECTED:
      case NotificationType.PROJECT_STARTED:
      case NotificationType.PROJECT_COMPLETED:
        if (notification.project_id) {
          // Navigate to project details in dashboard
          this.router.navigate(['/dashboard/projects', notification.project_id._id]);
        }
        break;
      
      case NotificationType.MESSAGE_RECEIVED:
        if (notification.metadata?.['chatId']) {
          // Navigate to chat in dashboard
          this.router.navigate(['/dashboard/messages'], { 
            queryParams: { chat: notification.metadata['chatId'] }
          });
        }
        break;
      
      default:
        // For other types, just navigate to notifications page
        this.router.navigate(['/dashboard/notifications']);
        break;
    }
  }

  getNotificationIcon(type: NotificationType): string {
    return this.notificationService.getNotificationIcon(type);
  }

  getNotificationStyles(notification: Notification): string {
    let styles = '';
    
    // Add background color based on priority
    if (notification.priority === NotificationPriority.URGENT) {
      styles += 'bg-red-50 border-l-4 border-red-400 ';
    } else if (notification.priority === NotificationPriority.HIGH) {
      styles += 'bg-orange-50 border-l-4 border-orange-400 ';
    } else if (!notification.is_read) {
      styles += 'bg-blue-50 ';
    }
    
    return styles;
  }

  formatTimeAgo(date: Date | string): string {
    return this.notificationService.formatTimeAgo(date);
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
}