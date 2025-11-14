import { Component, inject, OnInit, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NotificationService, Notification, NotificationType, NotificationPriority } from '../../../shared/services/notification.service';
import { DashboardSubheaderComponent } from '../../../shared/components/dashboard-subheader/dashboard-subheader.component';
import { BusinessSearchFilterComponent } from '../../../shared/components/business-search-filter/business-search-filter.component';
import { NotificationStatsComponent } from '../components/notification-stats/notification-stats.component';
import { NotificationItemComponent } from '../components/notification-item/notification-item.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-list-notifications',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatCardModule,
    DashboardSubheaderComponent,
    BusinessSearchFilterComponent,
    NotificationStatsComponent,
    NotificationItemComponent,
    EmptyStateComponent
  ],
  templateUrl: './list-notifications.component.html',
})
export class ListNotificationsComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Component state
  selectedType = signal('');
  selectedStatus = signal('');
  pageIndex = signal(0);
  pageSize = signal(10);

  // Expose Math for template
  Math = Math;

  // Reactive state from service
  readonly notifications = this.notificationService.notifications;
  readonly unreadCount = this.notificationService.unreadCount;
  readonly isLoading = this.notificationService.isLoading;

  // Filter form
  readonly filterForm: FormGroup = this.fb.group({
    type: [''],
    status: ['']
  });

  // Computed values
  readonly totalCount = computed(() => this.notifications().length);
  readonly readCount = computed(() => this.notifications().filter(n => n.is_read).length);

  readonly filteredNotifications = computed(() => {
    let filtered = this.notifications();

    // Filter by type
    const selectedType = this.selectedType();
    if (selectedType) {
      filtered = filtered.filter(n => n.type === selectedType);
    }

    // Filter by status
    const selectedStatus = this.selectedStatus();
    if (selectedStatus === 'read') {
      filtered = filtered.filter(n => n.is_read);
    } else if (selectedStatus === 'unread') {
      filtered = filtered.filter(n => !n.is_read);
    }

    return filtered;
  });

  readonly paginatedNotifications = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredNotifications().slice(start, end);
  });

  readonly hasActiveFilters = computed(() => {
    return !!(this.selectedType() || this.selectedStatus());
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
    this.pageIndex.set(0); // Reset to first page when filtering
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  async markAllAsRead() {
    try {
      await this.notificationService.markAllAsRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  onTypeChange(type: string) {
    this.selectedType.set(type);
    this.applyFilters();
  }

  onStatusChange(status: string) {
    this.selectedStatus.set(status);
    this.applyFilters();
  }

  onNotificationClick(notification: Notification) {
    // Mark as read if not already read
    if (!notification.is_read) {
      this.notificationService.markAsRead(notification._id).catch(error => {
        console.error('Error marking notification as read:', error);
      });
    }

    // Navigate based on notification content
    this.navigateFromNotification(notification);
  }

  async onMarkAsRead(notification: Notification) {
    if (!notification.is_read) {
      try {
        await this.notificationService.markAsRead(notification._id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  }

  async onDeleteNotification(notification: Notification) {
    if (confirm('Are you sure you want to delete this notification?')) {
      try {
        await this.notificationService.deleteNotification(notification._id);
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    }
  }

  private navigateFromNotification(notification: Notification) {
    // All project-related notifications should navigate to project details
    const projectNotificationTypes = [
      NotificationType.PROJECT_CREATED,
      NotificationType.PROJECT_ACCEPTED,
      NotificationType.PROJECT_REJECTED,
      NotificationType.PROJECT_STARTED,
      NotificationType.PROJECT_COMPLETED,
      NotificationType.PROJECT_COMPLETED_BY_BUSINESS,
      NotificationType.PROJECT_COMPLETION_APPROVED,
      NotificationType.PROJECT_COMPLETION_REJECTED,
      NotificationType.ADDITIONAL_PAYMENT_REQUESTED,
      NotificationType.ADDITIONAL_PAYMENT_APPROVED,
      NotificationType.ADDITIONAL_PAYMENT_REJECTED,
      NotificationType.ADDITIONAL_PAYMENT_COMPLETED,
      NotificationType.PAYMENT_REQUEST,
      NotificationType.PAYMENT_APPROVED,
      NotificationType.PAYMENT_REJECTED,
      NotificationType.COMPLETION_REQUEST,
      NotificationType.COMPLETION_APPROVED,
      NotificationType.COMPLETION_REJECTED,
    ];

    if (projectNotificationTypes.includes(notification.type)) {
      if (notification.project_id) {
        // Navigate to project details page
        const projectId = typeof notification.project_id === 'string' 
          ? notification.project_id 
          : notification.project_id._id;
        this.router.navigate(['/dashboard/projects', projectId]);
        return;
      }
    }
    
    // Handle other notification types
    switch (notification.type) {
      case NotificationType.MESSAGE_RECEIVED:
        if (notification.metadata?.['chatId']) {
          this.router.navigate(['/dashboard/messages/chat', notification.metadata['chatId']]);
        }
        break;
      
      case NotificationType.BUSINESS_APPROVED:
      case NotificationType.BUSINESS_REJECTED:
      case NotificationType.BUSINESS_SUSPENDED:
      case NotificationType.BUSINESS_REACTIVATED:
        if (notification.business_id) {
          const businessId = typeof notification.business_id === 'string' 
            ? notification.business_id 
            : notification.business_id._id;
          this.router.navigate(['/dashboard/businesses', businessId]);
        }
        break;
      
      case NotificationType.REVIEW_RECEIVED:
        if (notification.project_id) {
          const projectId = typeof notification.project_id === 'string' 
            ? notification.project_id 
            : notification.project_id._id;
          this.router.navigate(['/project-details', projectId]);
        }
        break;
      
      default:
        // For other types (system announcements, promotions), stay on notifications page
        break;
    }
  }

  handleClearFilters = () => {
    this.selectedType.set('');
    this.selectedStatus.set('');
    this.pageIndex.set(0);
    if (this.paginator) {
      this.paginator.firstPage();
    }
  };

  getEmptyMessage(): string {
    if (this.selectedType() && this.selectedStatus()) {
      return `No ${this.selectedStatus()} notifications of this type found.`;
    } else if (this.selectedType()) {
      return `No notifications of this type found.`;
    } else if (this.selectedStatus()) {
      return `No ${this.selectedStatus()} notifications found.`;
    }
    return 'You don\'t have any notifications yet.';
  }
}
