import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from './shared/services/notification.service';

@Component({
  selector: 'app-test-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <h2 class="text-xl font-bold mb-4">Test Notifications</h2>
      <div class="space-y-2">
        <button 
          (click)="createTestProjectNotification()"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2"
        >
          Create Test Project Notification
        </button>
        
        <button 
          (click)="createTestMessageNotification()"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 mr-2"
        >
          Create Test Message Notification
        </button>
        
        <button 
          (click)="createTestSystemNotification()"
          class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Create Test System Notification
        </button>
      </div>
    </div>
  `
})
export class TestNotificationsComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);

  ngOnInit() {
    console.log('Test Notifications Component loaded');
  }

  createTestProjectNotification() {
    const testNotification = {
      _id: 'test-project-' + Date.now(),
      recipient_id: 'current-user',
      title: 'Test Project Created',
      message: 'A new project has been created for your business.',
      type: 'project_created' as any,
      priority: 'high' as any,
      is_read: false,
      is_seen: false,
      project_id: {
        _id: 'test-project-id',
        title: 'Test Project',
        description: 'This is a test project',
        status: 'pending'
      },
      business_id: {
        _id: 'test-business-id',
        name: 'Test Business',
        logo_url: ''
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.notificationService.handleNewNotification(testNotification as any);
    console.log('Test project notification created');
  }

  createTestMessageNotification() {
    const testNotification = {
      _id: 'test-message-' + Date.now(),
      recipient_id: 'current-user',
      title: 'New Message',
      message: 'You have received a new message.',
      type: 'message_received' as any,
      priority: 'medium' as any,
      is_read: false,
      is_seen: false,
      metadata: {
        chatId: 'test-chat-id'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.notificationService.handleNewNotification(testNotification as any);
    console.log('Test message notification created');
  }

  createTestSystemNotification() {
    const testNotification = {
      _id: 'test-system-' + Date.now(),
      recipient_id: 'current-user',
      title: 'System Update',
      message: 'The system has been updated with new features.',
      type: 'system_announcement' as any,
      priority: 'low' as any,
      is_read: false,
      is_seen: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.notificationService.handleNewNotification(testNotification as any);
    console.log('Test system notification created');
  }
}
