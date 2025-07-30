import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotificationService, Notification, NotificationType, NotificationPriority } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-list-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './list-notifications.component.html',
})
export class ListNotificationsComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  // Component state
  selectedType = '';
  selectedStatus = '';
  currentPage = signal(1);
  itemsPerPage = 10;
  isMarkingAllRead = false;

  // Expose Math for template
  Math = Math;

  // Reactive state from service
  readonly notifications = this.notificationService.notifications;
  readonly unreadCount = this.notificationService.unreadCount;
  readonly isLoading = this.notificationService.isLoading;

  // Computed values
  readonly totalCount = computed(() => this.notifications().length);
  readonly readCount = computed(() => this.notifications().filter(n => n.is_read).length);

  readonly filteredNotifications = computed(() => {
    let filtered = this.notifications();

    // Filter by type
    if (this.selectedType) {
      filtered = filtered.filter(n => n.type === this.selectedType);
    }

    // Filter by status
    if (this.selectedStatus === 'read') {
      filtered = filtered.filter(n => n.is_read);
    } else if (this.selectedStatus === 'unread') {
      filtered = filtered.filter(n => !n.is_read);
    }

    return filtered;
  });

  readonly totalPages = computed(() => 
    Math.ceil(this.filteredNotifications().length / this.itemsPerPage)
  );

  readonly paginatedNotifications = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredNotifications().slice(start, end);
  });

  readonly visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1); // Ellipsis
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push(-1); // Ellipsis
        pages.push(total);
      }
    }

    return pages;
  });

  ngOnInit() {
    this.loadNotifications();
  }

  async loadNotifications() {
    try {
      await this.notificationService.getNotifications({ 
        limit: 100, // Load more for client-side filtering
        page: 1 
      });
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  async refreshNotifications() {
    await this.loadNotifications();
  }

  applyFilters() {
    this.currentPage.set(1); // Reset to first page when filtering
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
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

  async markAsRead(notification: Notification, event: Event) {
    event.stopPropagation();
    
    if (!notification.is_read) {
      try {
        await this.notificationService.markAsRead(notification._id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  }

  async deleteNotification(notification: Notification, event: Event) {
    event.stopPropagation();
    
    if (confirm('Are you sure you want to delete this notification?')) {
      try {
        await this.notificationService.deleteNotification(notification._id);
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    }
  }

  handleNotificationClick(notification: Notification) {
    // Mark as read if not already read
    if (!notification.is_read) {
      this.notificationService.markAsRead(notification._id).catch(error => {
        console.error('Error marking notification as read:', error);
      });
    }

    // Navigate based on notification content
    this.navigateFromNotification(notification);
  }

  private navigateFromNotification(notification: Notification) {
    switch (notification.type) {
      case NotificationType.PROJECT_CREATED:
      case NotificationType.PROJECT_ACCEPTED:
      case NotificationType.PROJECT_REJECTED:
      case NotificationType.PROJECT_STARTED:
      case NotificationType.PROJECT_COMPLETED:
        if (notification.project_id) {
          this.router.navigate(['/dashboard/projects', notification.project_id._id]);
        }
        break;
      
      case NotificationType.PAYMENT_REQUEST:
      case NotificationType.PAYMENT_APPROVED:
      case NotificationType.PAYMENT_REJECTED:
      case NotificationType.COMPLETION_REQUEST:
      case NotificationType.COMPLETION_APPROVED:
      case NotificationType.COMPLETION_REJECTED:
        // These should navigate to the chat or project details
        if (notification.metadata?.['chatId']) {
          this.router.navigate(['/dashboard/messages/chat', notification.metadata['chatId']]);
        } else if (notification.project_id) {
          this.router.navigate(['/dashboard/projects', notification.project_id._id]);
        }
        break;
      
      case NotificationType.MESSAGE_RECEIVED:
        if (notification.metadata?.['chatId']) {
          this.router.navigate(['/dashboard/messages/chat', notification.metadata['chatId']]);
        }
        break;
      
      default:
        // For other types, stay on notifications page
        break;
    }
  }

  getNotificationIcon(type: NotificationType): string {
    return this.notificationService.getNotificationIcon(type);
  }

  getNotificationStyles(notification: Notification): string {
    let styles = '';
    
    if (notification.priority === NotificationPriority.URGENT) {
      styles += 'border-l-4 border-red-400 bg-red-50 ';
    } else if (notification.priority === NotificationPriority.HIGH) {
      styles += 'border-l-4 border-orange-400 bg-orange-50 ';
    } else if (!notification.is_read) {
      styles += 'bg-blue-50 ';
    }
    
    return styles;
  }

  getPriorityBadgeClass(priority: NotificationPriority): string {
    const classes = {
      [NotificationPriority.LOW]: 'bg-gray-100 text-gray-800',
      [NotificationPriority.MEDIUM]: 'bg-blue-100 text-blue-800',
      [NotificationPriority.HIGH]: 'bg-orange-100 text-orange-800',
      [NotificationPriority.URGENT]: 'bg-red-100 text-red-800',
    };
    return classes[priority] || classes[NotificationPriority.MEDIUM];
  }

  getTypeLabel(type: NotificationType): string {
    const labels:any = {
      [NotificationType.PROJECT_CREATED]: 'Project Created',
      [NotificationType.PROJECT_ACCEPTED]: 'Project Accepted',
      [NotificationType.PROJECT_REJECTED]: 'Project Rejected',
      [NotificationType.PROJECT_STARTED]: 'Project Started',
      [NotificationType.PROJECT_COMPLETED]: 'Project Completed',
      [NotificationType.PAYMENT_REQUEST]: 'Payment Request',
      [NotificationType.PAYMENT_APPROVED]: 'Payment Approved',
      [NotificationType.PAYMENT_REJECTED]: 'Payment Rejected',
      [NotificationType.COMPLETION_REQUEST]: 'Completion Request',
      [NotificationType.COMPLETION_APPROVED]: 'Completion Approved',
      [NotificationType.COMPLETION_REJECTED]: 'Completion Rejected',
      [NotificationType.PROMOTION]: 'Promotion',
      [NotificationType.SYSTEM_ANNOUNCEMENT]: 'Announcement',
      [NotificationType.MESSAGE_RECEIVED]: 'Message',
    };
    return labels[type] || 'Notification';
  }

  formatTimeAgo(date: Date | string): string {
    return this.notificationService.formatTimeAgo(date);
  }

  getEmptyMessage(): string {
    if (this.selectedType && this.selectedStatus) {
      return `No ${this.selectedStatus} notifications of type "${this.getTypeLabel(this.selectedType as NotificationType)}" found.`;
    } else if (this.selectedType) {
      return `No notifications of type "${this.getTypeLabel(this.selectedType as NotificationType)}" found.`;
    } else if (this.selectedStatus) {
      return `No ${this.selectedStatus} notifications found.`;
    }
    return 'You don\'t have any notifications yet.';
  }
}
