import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotificationService, Notification, NotificationType, NotificationPriority } from '../../shared/services/notification.service';

@Component({
  selector: 'app-list-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto p-6">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
        <p class="text-gray-600">Stay updated with your projects and messages</p>
      </div>

      <!-- Controls -->
      <div class="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <!-- Filters -->
        <div class="flex flex-wrap gap-3">
          <select 
            [(ngModel)]="selectedType" 
            (ngModelChange)="applyFilters()"
            class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            <option value="project_created">Project Created</option>
            <option value="project_accepted">Project Accepted</option>
            <option value="project_rejected">Project Rejected</option>
            <option value="project_started">Project Started</option>
            <option value="project_completed">Project Completed</option>
            <option value="message_received">Messages</option>
            <option value="promotion">Promotions</option>
            <option value="system_announcement">Announcements</option>
          </select>

          <select 
            [(ngModel)]="selectedStatus" 
            (ngModelChange)="applyFilters()"
            class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          @if (unreadCount() > 0) {
            <button
              (click)="markAllAsRead()"
              [disabled]="isMarkingAllRead"
              class="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isMarkingAllRead ? 'Marking...' : 'Mark All Read' }}
            </button>
          }
          
          <button
            (click)="refreshNotifications()"
            [disabled]="isLoading()"
            class="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-4 h-4 inline mr-1" [class.animate-spin]="isLoading()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <div class="text-2xl font-bold text-gray-900">{{ totalCount() }}</div>
          <div class="text-sm text-gray-600">Total Notifications</div>
        </div>
        
        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <div class="text-2xl font-bold text-blue-600">{{ unreadCount() }}</div>
          <div class="text-sm text-gray-600">Unread</div>
        </div>
        
        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <div class="text-2xl font-bold text-green-600">{{ readCount() }}</div>
          <div class="text-sm text-gray-600">Read</div>
        </div>
      </div>

      <!-- Notifications List -->
      <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
        @if (isLoading() && filteredNotifications().length === 0) {
          <div class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        } @else if (filteredNotifications().length === 0) {
          <div class="text-center py-12">
            <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5.5-7V7a5 5 0 00-4.5-4.5A5 5 0 005.5 7v3L0 17h5m5 0v1a3 3 0 01-6 0v-1m6 0v1a3 3 0 006 0v-1"/>
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
            <p class="text-gray-600">{{ getEmptyMessage() }}</p>
          </div>
        } @else {
          <div class="divide-y divide-gray-200">
            @for (notification of paginatedNotifications(); track notification._id) {
              <div 
                class="p-6 hover:bg-gray-50 transition-colors duration-200 cursor-pointer border-l-4 border-transparent hover:border-blue-200"
                [class]="getNotificationStyles(notification)"
                (click)="handleNotificationClick(notification)"
                role="button"
                tabindex="0"
                (keydown.enter)="handleNotificationClick(notification)"
                (keydown.space)="handleNotificationClick(notification)"
              >
                <div class="flex items-start space-x-4">
                  <!-- Icon -->
                  <div class="flex-shrink-0 mt-1">
                    <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                      {{ getNotificationIcon(notification.type) }}
                    </div>
                  </div>
                  
                  <!-- Content -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <!-- Title and Priority Badge -->
                        <div class="flex items-center gap-2 mb-2">
                          <h3 class="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
                            {{ notification.title }}
                            @if (notification.project_id) {
                              <svg class="w-4 h-4 inline ml-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                              </svg>
                            }
                          </h3>
                          
                          <!-- Priority Badge -->
                          @if (notification.priority !== 'low') {
                            <span 
                              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                              [class]="getPriorityBadgeClass(notification.priority)"
                            >
                              {{ notification.priority.toUpperCase() }}
                            </span>
                          }
                          
                          <!-- Type Badge -->
                          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {{ getTypeLabel(notification.type) }}
                          </span>
                        </div>
                        
                        <!-- Message -->
                        <p class="text-gray-700 mb-3">{{ notification.message }}</p>
                        
                        <!-- Project/Business Info -->
                        @if (notification.project_id) {
                          <div class="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div class="text-sm font-medium text-blue-900">Project: {{ notification.project_id.title }}</div>
                            <div class="text-sm text-blue-700">{{ notification.project_id.description }}</div>
                          </div>
                        }
                        
                        @if (notification.business_id) {
                          <div class="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <div class="text-sm font-medium text-green-900">Business: {{ notification.business_id.name }}</div>
                          </div>
                        }
                        
                        <!-- Sender Info -->
                        @if (notification.sender_id) {
                          <div class="text-sm text-gray-600 mb-3">
                            From: {{ notification.sender_id.first_name }} {{ notification.sender_id.last_name }} ({{ notification.sender_id.email }})
                          </div>
                        }
                        
                        <!-- Timestamps -->
                        <div class="flex items-center gap-4 text-sm text-gray-500">
                          <span>{{ formatTimeAgo(notification.createdAt) }}</span>
                          @if (notification.is_read && notification.read_at) {
                            <span>• Read {{ formatTimeAgo(notification.read_at) }}</span>
                          }
                        </div>
                      </div>
                      
                      <!-- Actions -->
                      <div class="flex items-center space-x-2 ml-4">
                        @if (!notification.is_read) {
                          <button
                            (click)="markAsRead(notification, $event)"
                            class="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            title="Mark as read"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                          </button>
                        }
                        
                        <button
                          (click)="deleteNotification(notification, $event)"
                          class="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Delete notification"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                        
                        <!-- Unread Indicator -->
                        @if (!notification.is_read) {
                          <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Pagination -->
      @if (filteredNotifications().length > itemsPerPage) {
        <div class="mt-6 flex items-center justify-between">
          <div class="text-sm text-gray-700">
            Showing {{ (currentPage() - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage() * itemsPerPage, filteredNotifications().length) }} of {{ filteredNotifications().length }} notifications
          </div>
          
          <div class="flex items-center space-x-2">
            <button
              (click)="goToPage(currentPage() - 1)"
              [disabled]="currentPage() === 1"
              class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            @for (page of visiblePages(); track page) {
              <button
                (click)="goToPage(page)"
                class="px-3 py-2 text-sm font-medium rounded-md"
                [class]="page === currentPage() ? 'text-white bg-blue-600' : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'"
              >
                {{ page }}
              </button>
            }
            
            <button
              (click)="goToPage(currentPage() + 1)"
              [disabled]="currentPage() === totalPages()"
              class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      }
    </div>
  `
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
        // For other types, no navigation
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
    const labels = {
      [NotificationType.PROJECT_CREATED]: 'Project Created',
      [NotificationType.PROJECT_ACCEPTED]: 'Project Accepted',
      [NotificationType.PROJECT_REJECTED]: 'Project Rejected',
      [NotificationType.PROJECT_STARTED]: 'Project Started',
      [NotificationType.PROJECT_COMPLETED]: 'Project Completed',
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
