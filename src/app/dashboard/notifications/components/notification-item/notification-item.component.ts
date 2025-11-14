import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Notification, NotificationPriority, NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-notification-item',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './notification-item.component.html',
  styleUrl: './notification-item.component.scss'
})
export class NotificationItemComponent {
  @Input() notification!: Notification;
  @Output() click = new EventEmitter<Notification>();
  @Output() markAsRead = new EventEmitter<Notification>();
  @Output() delete = new EventEmitter<Notification>();

  private readonly notificationService = inject(NotificationService);

  onCardClick(): void {
    this.click.emit(this.notification);
  }

  onMarkAsRead(event: Event): void {
    event.stopPropagation();
    this.markAsRead.emit(this.notification);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit(this.notification);
  }

  getNotificationIcon(): string {
    return this.notificationService.getNotificationIcon(this.notification.type);
  }

  getPriorityBadgeClass(): string {
    const classes = {
      [NotificationPriority.LOW]: 'bg-gray-100 text-gray-800',
      [NotificationPriority.MEDIUM]: 'bg-blue-100 text-blue-800',
      [NotificationPriority.HIGH]: 'bg-orange-100 text-orange-800',
      [NotificationPriority.URGENT]: 'bg-red-100 text-red-800',
    };
    return classes[this.notification.priority] || classes[NotificationPriority.MEDIUM];
  }

  getCardClass(): string {
    let classes = '';
    
    if (this.notification.priority === NotificationPriority.URGENT) {
      classes += 'border-l-4 border-red-400 ';
    } else if (this.notification.priority === NotificationPriority.HIGH) {
      classes += 'border-l-4 border-orange-400 ';
    } else if (!this.notification.is_read) {
      classes += 'border-l-4 border-blue-400 ';
    }
    
    return classes;
  }

  getTypeLabel(): string {
    const labels: Record<string, string> = {
      'project_created': 'Project Created',
      'project_accepted': 'Project Accepted',
      'project_rejected': 'Project Rejected',
      'project_started': 'Project Started',
      'project_completed': 'Project Completed',
      'project_completed_by_business': 'Project Completed - Awaiting Approval',
      'project_completion_approved': 'Project Completion Approved',
      'project_completion_rejected': 'Project Completion Rejected',
      'additional_payment_requested': 'Payment Requested',
      'additional_payment_approved': 'Payment Approved',
      'additional_payment_rejected': 'Payment Rejected',
      'additional_payment_completed': 'Payment Received',
      'business_approved': 'Business Approved',
      'business_rejected': 'Business Rejected',
      'business_suspended': 'Business Suspended',
      'business_reactivated': 'Business Reactivated',
      'review_received': 'Review Received',
      'review_replied': 'Review Replied',
      'payment_request': 'Payment Request',
      'payment_approved': 'Payment Approved',
      'payment_rejected': 'Payment Rejected',
      'completion_request': 'Completion Request',
      'completion_approved': 'Completion Approved',
      'completion_rejected': 'Completion Rejected',
      'promotion': 'Promotion',
      'system_announcement': 'Announcement',
      'message_received': 'Message',
    };
    return labels[this.notification.type] || 'Notification';
  }

  formatTimeAgo(date: Date | string): string {
    return this.notificationService.formatTimeAgo(date);
  }
}
