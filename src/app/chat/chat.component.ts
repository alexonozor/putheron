import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { HeaderComponent } from '../shared/components/header/header.component';
import { ProjectChatService, ChatConversation as ServiceChatConversation, ChatMessage as ServiceChatMessage } from '../shared/services/project-chat.service';
import { AuthService } from '../shared/services/auth.service';
import { Tables } from '../shared/types/database.types';

interface ChatMessage extends Tables<'chat_messages'> {}
interface ChatConversation extends ServiceChatConversation {}

@Component({
  selector: 'app-chat',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    HeaderComponent
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      <app-header></app-header>
      
      <div class="container mx-auto px-4 py-8">
        <div class="max-w-4xl mx-auto">
          @if (loading()) {
            <div class="flex justify-center items-center h-64">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          } @else if (error()) {
            <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <mat-icon class="text-red-500 text-4xl mb-2">error</mat-icon>
              <h3 class="text-lg font-medium text-red-900 mb-2">Error Loading Chat</h3>
              <p class="text-red-700 mb-4">{{ error() }}</p>
              <button mat-button color="primary" (click)="goToDashboard()">
                Go to Dashboard
              </button>
            </div>
          } @else if (conversation()) {
            <div class="bg-white rounded-lg shadow-sm border overflow-hidden">
              <!-- Chat Header -->
              <div class="bg-blue-600 text-white p-4">
                <div class="flex items-center space-x-3">
                  @if (conversation()?.business?.logo_url) {
                    <img 
                      [src]="conversation()!.business!.logo_url" 
                      [alt]="conversation()!.business!.name"
                      class="w-10 h-10 rounded-full object-cover">
                  } @else {
                    <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <mat-icon class="text-white">business</mat-icon>
                    </div>
                  }
                  <div>
                    <h2 class="font-semibold">{{ conversation()?.business?.name }}</h2>
                    <p class="text-blue-100 text-sm">{{ conversation()?.project?.title }}</p>
                  </div>
                </div>
              </div>

              <!-- Messages Area -->
              <div class="h-96 overflow-y-auto p-4 space-y-4" #messagesContainer>
                @if (messages().length === 0) {
                  <div class="text-center py-8">
                    <mat-icon class="text-gray-400 text-4xl mb-2">chat</mat-icon>
                    <p class="text-gray-500">No messages yet. Start the conversation!</p>
                  </div>
                } @else {
                  @for (message of messages(); track message.id) {
                    <div class="flex" [class.justify-end]="isMyMessage(message)">
                      <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg"
                           [class.bg-blue-600]="isMyMessage(message)"
                           [class.text-white]="isMyMessage(message)"
                           [class.bg-gray-200]="!isMyMessage(message)"
                           [class.text-gray-900]="!isMyMessage(message)">
                        <p class="text-sm">{{ message.message }}</p>
                        <p class="text-xs mt-1 opacity-75">
                          {{ formatMessageTime(message.created_at) }}
                        </p>
                      </div>
                    </div>
                  }
                }
              </div>

              <!-- Message Input -->
              <div class="border-t p-4">
                <form [formGroup]="messageForm" (ngSubmit)="sendMessage()" class="flex space-x-2">
                  <mat-form-field appearance="outline" class="flex-1">
                    <input 
                      matInput 
                      formControlName="message" 
                      placeholder="Type your message..."
                      (keydown.enter)="sendMessage()">
                  </mat-form-field>
                  <button 
                    mat-fab 
                    color="primary" 
                    type="submit"
                    [disabled]="messageForm.invalid || sending()"
                    class="!w-12 !h-12">
                    <mat-icon>send</mat-icon>
                  </button>
                </form>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                mat-stroked-button 
                color="primary"
                (click)="goToDashboard()"
                class="flex items-center justify-center space-x-2">
                <mat-icon>dashboard</mat-icon>
                <span>Dashboard</span>
              </button>
              <button 
                mat-stroked-button 
                color="accent"
                (click)="viewBusiness()"
                class="flex items-center justify-center space-x-2">
                <mat-icon>business</mat-icon>
                <span>View Business</span>
              </button>
              <button 
                mat-stroked-button 
                (click)="completeProject()"
                class="flex items-center justify-center space-x-2">
                <mat-icon>check_circle</mat-icon>
                <span>Mark Complete</span>
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mat-mdc-form-field {
      width: 100%;
    }
  `]
})
export class ChatComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private projectChatService = inject(ProjectChatService);
  private authService = inject(AuthService);

  // Signals
  public conversation = signal<ChatConversation | null>(null);
  public messages = signal<ChatMessage[]>([]);
  public loading = signal(false);
  public sending = signal(false);
  public error = signal<string | null>(null);
  public conversationId = signal<string | null>(null);

  // Form
  public messageForm: FormGroup;

  constructor() {
    this.messageForm = this.fb.group({
      message: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['conversationId'];
      
      if (id) {
        this.conversationId.set(id);
        this.loadConversation(id);
      }
    });
  }

  async loadConversation(conversationId: string) {
    try {
      this.loading.set(true);
      this.error.set(null);

      // Load conversation details
      const conversation = await this.projectChatService.getConversation(conversationId);
      this.conversation.set(conversation);

      // Load messages
      const messages = await this.projectChatService.getConversationMessages(conversationId);
      this.messages.set(messages);

    } catch (err) {
      console.error('Error loading conversation:', err);
      this.error.set('Failed to load conversation. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async sendMessage() {
    if (this.messageForm.invalid || !this.conversationId() || !this.authService.currentUser) return;

    try {
      this.sending.set(true);
      
      const messageText = this.messageForm.get('message')?.value;
      
      await this.projectChatService.sendMessage(
        this.conversationId()!,
        this.authService.currentUser.id,
        messageText
      );

      // Clear form
      this.messageForm.reset();

      // Reload messages
      const messages = await this.projectChatService.getConversationMessages(this.conversationId()!);
      this.messages.set(messages);

    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      this.sending.set(false);
    }
  }

  isMyMessage(message: ChatMessage): boolean {
    return message.sender_id === this.authService.currentUser?.id;
  }

  formatMessageTime(timestamp: string | null): string {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  viewBusiness() {
    const conversation = this.conversation();
    if (conversation?.business_id) {
      this.router.navigate(['/business', conversation.business_id]);
    }
  }

  async completeProject() {
    // TODO: Implement project completion
    console.log('Mark project as complete');
  }
}
