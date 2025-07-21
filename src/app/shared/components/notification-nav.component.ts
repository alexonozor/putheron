import { Component, inject, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificationService, Notification, NotificationType, NotificationPriority } from '../services/notification.service';
import { SocketService } from '../services/socket.service';

@Component({
  selector: 'app-notification-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="relative">
      <!-- Notification Bell Icon -->
      <button
        (click)="toggleDropdown()"
        class="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-colors duration-200"
        [class.text-blue-600]="hasUnreadNotifications()"
      >
        <!-- Bell Icon -->
        <svg 
          class="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          [class.animate-pulse]="hasUnreadNotifications()"
        >
          <path 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M15 17h5l-5.5-7V7a5 5 0 00-4.5-4.5A5 5 0 005.5 7v3L0 17h5m5 0v1a3 3 0 01-6 0v-1m6 0v1a3 3 0 006 0v-1"
          />
        </svg>
        
        <!-- Unread Badge -->
        @if (unreadCount() > 0) {
          <span class="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[1.25rem] h-5">
            {{ unreadCount() > 99 ? '99+' : unreadCount() }}
          </span>
        }
      </button>

      <!-- Dropdown Menu -->
      @if (isDropdownOpen) {
        <div class="absolute right-0 z-50 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-hidden">
          <!-- Header -->
          <div class="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-gray-900">Notifications</h3>
              <div class="flex items-center space-x-2">
                @if (unreadCount() > 0) {
                  <button
                    (click)="markAllAsRead()"
                    class="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    [disabled]="isMarkingAllRead"
                  >
                    {{ isMarkingAllRead ? 'Marking...' : 'Mark all read' }}
                  </button>
                }
                <a 
                  routerLink="/dashboard/notifications" 
                  class="text-xs text-gray-600 hover:text-gray-800 font-medium"
                  (click)="closeDropdown()"
                >
                  View all
                </a>
              </div>
            </div>
          </div>

          <!-- Notifications List -->
          <div class="max-h-64 overflow-y-auto">
            @if (isLoading()) {
              <div class="flex items-center justify-center py-8">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            } @else if (recentNotifications().length === 0) {
              <div class="text-center py-8 text-gray-500">
                <svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5.5-7V7a5 5 0 00-4.5-4.5A5 5 0 005.5 7v3L0 17h5m5 0v1a3 3 0 01-6 0v-1m6 0v1a3 3 0 006 0v-1"/>
                </svg>
                <p class="text-sm">No notifications yet</p>
              </div>
            } @else {
              @for (notification of recentNotifications(); track notification._id) {
                <div 
                  class="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                  [class]="getNotificationStyles(notification)"
                  (click)="handleNotificationClick(notification)"
                  role="button"
                  tabindex="0"
                  (keydown.enter)="handleNotificationClick(notification)"
                  (keydown.space)="handleNotificationClick(notification)"
                >
                  <div class="flex items-start space-x-3">
                    <!-- Icon -->
                    <div class="flex-shrink-0 mt-1">
                      <span class="text-lg">{{ getNotificationIcon(notification.type) }}</span>
                    </div>
                    
                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <p class="text-sm font-medium text-gray-900 truncate hover:text-blue-600 transition-colors">
                            {{ notification.title }}
                          </p>
                          <p class="text-xs text-gray-600 mt-1 line-clamp-2">
                            {{ notification.message }}
                          </p>
                          <p class="text-xs text-gray-400 mt-1">
                            {{ formatTimeAgo(notification.createdAt) }}
                          </p>
                        </div>
                        
                        <!-- Unread indicator -->
                        @if (!notification.is_read) {
                          <div class="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1 flex-shrink-0"></div>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              }
            }
          </div>
        </div>
      }

      <!-- Backdrop -->
      @if (isDropdownOpen) {
        <div 
          class="fixed inset-0 z-40" 
          (click)="closeDropdown()"
        ></div>
      }
    </div>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
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
