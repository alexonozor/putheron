import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { ChatService, Chat } from '../../../shared/services/chat.service';
import { AuthService } from '../../../shared/services/auth.service';
import { ProjectService } from '../../../shared/services/project.service';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
  ],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss'
})
export class ChatListComponent implements OnInit {
  private readonly chatService = inject(ChatService);
  private readonly authService = inject(AuthService);
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

  // Signals
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly chats = signal<Chat[]>([]);
  readonly unreadCount = signal(0);

  // Computed signals
  readonly user = this.authService.user;
  readonly hasChats = computed(() => this.chats().length > 0);

  ngOnInit() {
    if (!this.user()) {
      this.router.navigate(['/auth']);
      return;
    }
    
    this.loadChats();
    this.loadUnreadCount();
  }

  async loadChats() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const chats = await this.chatService.getUserChatsAsync();
      this.chats.set(chats);
    } catch (error: any) {
      console.error('Error loading chats:', error);
      this.error.set('Failed to load chats');
    } finally {
      this.loading.set(false);
    }
  }

  async loadUnreadCount() {
    try {
      const count = await this.chatService.getUnreadMessageCountAsync();
      this.unreadCount.set(count);
    } catch (error: any) {
      console.error('Error loading unread count:', error);
    }
  }

  openChat(chat: Chat) {
    this.router.navigate(['../chat', chat._id], {relativeTo: this.route});
  }

  viewProject(projectId: string, event: Event) {
    event.stopPropagation();
    if (projectId) {
      this.router.navigate(['/dashboard/projects', projectId]);
    }
  }

  getOtherParticipant(chat: Chat): any {
    const currentUserId = this.user()?._id;
    if (!chat.project_id) {
      return { last_name: 'Unknown User', email: '' };
    }
    if (chat.project_id.client_id._id === currentUserId) {
      return chat.project_id.business_owner_id;
    }
    return chat.project_id.client_id;
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

  formatDate(date: string | Date): string {
    const d = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString();
    }
  }

  async refreshChats() {
    await this.loadChats();
    await this.loadUnreadCount();
  }

  navigateBack() {
    this.router.navigate(['/dashboard']);
  }

  navigateToProjects() {
    this.router.navigate(['/dashboard/projects']);
  }
}
