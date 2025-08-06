import { Component, OnInit, OnDestroy, inject, signal, computed, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ChatService, Chat, Message } from '../../../shared/services/chat.service';
import { AuthService } from '../../../shared/services/auth.service';
import { ProjectService } from '../../../shared/services/project.service';
import { ReviewService } from '../../../shared/services/review.service';
import { SocketService, TypingUser } from '../../../shared/services/socket.service';
import { Subscription } from 'rxjs';
import { PaymentRequestModalComponent, PaymentRequestData } from './modals/payment-request-modal.component';
import { CompletionRequestModalComponent, CompletionRequestData } from './modals/completion-request-modal.component';
import { PaymentModalComponent, PaymentData, PaymentModalData } from './modals/payment-modal.component';
import { ReviewFormComponent } from '../../../shared/components/review-form/review-form.component';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatDialogModule,
  ],
  templateUrl: './chat-room.component.html',
  styleUrl: './chat-room.component.scss'
})
export class ChatRoomComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;

  private readonly chatService = inject(ChatService);
  private readonly authService = inject(AuthService);
  private readonly projectService = inject(ProjectService);
  private readonly reviewService = inject(ReviewService);
  private readonly socketService = inject(SocketService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly dialog = inject(MatDialog);

  // Signals
  readonly loading = signal(false);
  readonly messagesLoading = signal(false);
  readonly sendingMessage = signal(false);
  readonly uploadingFiles = signal(false);
  readonly error = signal<string | null>(null);
  readonly chat = signal<Chat | null>(null);
  readonly messages = signal<Message[]>([]);
  readonly typingUsers = signal<TypingUser[]>([]);
  readonly isConnected = signal<boolean>(false);
  readonly isMobile = signal<boolean>(false);
  readonly selectedFiles = signal<File[]>([]);
  readonly canLeaveReview = signal<boolean>(false);
  readonly existingReview = signal<any>(null);

  // Computed properties for review button
  readonly reviewButtonText = computed(() => {
    if (this.existingReview()) {
      const rating = this.existingReview().rating;
      return `View Review (${rating}⭐)`;
    }
    if (this.canLeaveReview()) {
      return 'Leave Review';
    }
    return '';
  });

  readonly showReviewButton = computed(() => {
    return Boolean(this.canLeaveReview() || this.existingReview());
  });

  // Form
  messageForm: FormGroup;

  // Computed signals
  readonly user = this.authService.user;
  readonly hasMessages = computed(() => this.messages().length > 0);
  readonly otherParticipant = computed(() => {
    const currentChat = this.chat();
    const currentUserId = this.user()?._id;
    if (!currentChat || !currentUserId) return null;
    
    if (currentChat.project_id.client_id._id === currentUserId) {
      return currentChat.project_id.business_owner_id;
    }
    return currentChat.project_id.client_id;
  });

  private chatId: string | null = null;
  private shouldScrollToBottom = false;
  private refreshInterval: any;
  private subscriptions: Subscription[] = [];
  private typingTimeout: any;

  constructor() {
    this.messageForm = this.formBuilder.group({
      content: ['', [Validators.required, Validators.maxLength(1000)]]
    });
  }

  ngOnInit() {
    if (!this.user()) {
      this.router.navigate(['/auth']);
      return;
    }

    // Request notification permission
    this.requestNotificationPermission();

    // Set up mobile detection
    this.setupMobileDetection();

    // Set up socket subscriptions
    this.setupSocketSubscriptions();

    this.route.params.subscribe(params => {
      this.chatId = params['chatId'];
      if (this.chatId) {
        this.loadChat();
        this.checkReviewEligibility();
        this.loadMessages();
        this.markMessagesAsRead();
        this.joinSocketRoom();
        
        // No auto-refresh needed since we have real-time socket updates
      }
    });
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Leave socket room and cleanup subscriptions
    if (this.chatId) {
      this.socketService.leaveChat(this.chatId);
    }
    
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private setupMobileDetection() {
    const mobileSub = this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.Small])
      .subscribe(result => {
        this.isMobile.set(result.matches);
      });

    this.subscriptions.push(mobileSub);
  }

  private setupSocketSubscriptions() {
    // Subscribe to socket connection status
    const connectionSub = this.socketService.isConnected$.subscribe(isConnected => {
      this.isConnected.set(isConnected);
    });

    // Subscribe to new messages
    const newMessageSub = this.socketService.onNewMessage().subscribe(response => {
      if (response.success && response.data) {
        const currentMessages = this.messages();
        // Check if message already exists to prevent duplicates
        const existingMessage = currentMessages.find(m => m._id === response.data._id);
        
        if (existingMessage) {
          console.log('Message already exists, skipping duplicate:', response.data._id);
          return;
        }

        this.messages.set([...currentMessages, response.data]);
        this.shouldScrollToBottom = true;
        
        // If it's a payment request message, trigger a notification
        if (response.data.message_type === 'payment_request') {
          this.handlePaymentRequestNotification(response.data);
        }
      }
    });

    // Subscribe to message errors
    const errorSub = this.socketService.onMessageError().subscribe(error => {
      console.error('Socket message error:', error);
      this.error.set(error.error || 'Message failed to send');
    });

    // Subscribe to typing indicators
    const typingSub = this.socketService.getTypingUsersForChat().subscribe(typingUsers => {
      const currentUserId = this.user()?._id;
      // Filter out current user from typing list
      const otherUsersTyping = typingUsers.filter(user => user.userId !== currentUserId);
      this.typingUsers.set(otherUsersTyping);
    });

    // Subscribe to file upload events
    const fileUploadSub = this.socketService.onEvent('files-uploaded').subscribe((data: any) => {
      if (data.chatId === this.chatId) {
        console.log('Files uploaded in this chat, refreshing messages');
        this.loadMessages(false);
        this.shouldScrollToBottom = true;
      }
    });

    // Subscribe to payment request events
    const paymentRequestSub = this.socketService.onEvent('payment-request-created').subscribe((data: any) => {
      if (data.chatId === this.chatId) {
        console.log('Payment request created in this chat, refreshing messages');
        this.loadMessages(false);
        this.shouldScrollToBottom = true;
      }
    });

    // Subscribe to payment approval/rejection events
    const paymentApprovedSub = this.socketService.onEvent('payment-approved').subscribe((data: any) => {
      if (data.chatId === this.chatId) {
        console.log('Payment approved in this chat, refreshing messages');
        this.loadMessages(false);
        this.shouldScrollToBottom = true;
      }
    });

    const paymentRejectedSub = this.socketService.onEvent('payment-rejected').subscribe((data: any) => {
      if (data.chatId === this.chatId) {
        console.log('Payment rejected in this chat, refreshing messages');
        this.loadMessages(false);
        this.shouldScrollToBottom = true;
      }
    });

    // Subscribe to completion request events
    const completionRequestSub = this.socketService.onEvent('completion-request-created').subscribe((data: any) => {
      if (data.chatId === this.chatId) {
        console.log('Completion request created in this chat, refreshing messages');
        this.loadMessages(false);
        this.shouldScrollToBottom = true;
      }
    });

    const completionApprovedSub = this.socketService.onEvent('completion-approved').subscribe((data: any) => {
      if (data.chatId === this.chatId) {
        console.log('Completion approved in this chat, refreshing messages');
        this.loadChat(); // Reload chat to update project status
        this.loadMessages(false);
        this.checkReviewEligibility(); // Check if user can now leave a review
        this.shouldScrollToBottom = true;
      }
    });

    const completionRejectedSub = this.socketService.onEvent('completion-rejected').subscribe((data: any) => {
      if (data.chatId === this.chatId) {
        console.log('Completion rejected in this chat, refreshing messages');
        this.loadChat(); // Reload chat to update project status
        this.loadMessages(false);
        this.shouldScrollToBottom = true;
      }
    });

    // Subscribe to project status update events
    const projectStatusUpdatedSub = this.socketService.onEvent('project-status-updated').subscribe((data: any) => {
      console.log('Project status updated:', data);
      
      // Check if this event affects our current chat
      const currentChat = this.chat();
      if (currentChat && currentChat.project_id._id === data.projectId) {
        console.log('Project status updated for current chat, refreshing chat data');
        this.loadChat(); // Reload chat to get updated project status
        this.loadMessages(false); // Reload messages to get the status update message
        this.checkReviewEligibility(); // Check if user can now leave a review
        this.shouldScrollToBottom = true;
      }
    });

    // Subscribe to system message events (for project status updates)
    const systemMessageSub = this.socketService.onEvent('system-message').subscribe((data: any) => {
      console.log('System message received:', data);
      
      // Check if this message is for our current chat
      if (data.chatId === this.chatId) {
        console.log('System message for current chat, refreshing messages');
        this.loadMessages(false); // Reload messages to show the system message
        this.shouldScrollToBottom = true;
      }
    });

    this.subscriptions.push(
      connectionSub, 
      newMessageSub, 
      errorSub, 
      typingSub,
      fileUploadSub,
      paymentRequestSub,
      paymentApprovedSub,
      paymentRejectedSub,
      completionRequestSub,
      completionApprovedSub,
      completionRejectedSub,
      projectStatusUpdatedSub,
      systemMessageSub
    );
  }

  private async joinSocketRoom() {
    if (!this.chatId) return;
    
    try {
      await this.socketService.joinChat(this.chatId);
      console.log('Joined socket room for chat:', this.chatId);
    } catch (error) {
      console.error('Failed to join socket room:', error);
    }
  }

  async loadChat() {
    if (!this.chatId) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const chat = await this.chatService.getChatByIdAsync(this.chatId);
      this.chat.set(chat);
    } catch (error: any) {
      console.error('Error loading chat:', error);
      this.error.set('Failed to load chat');
    } finally {
      this.loading.set(false);
    }
  }

  async loadMessages(showLoading = true) {
    if (!this.chatId) return;

    if (showLoading) {
      this.messagesLoading.set(true);
    }

    try {
      const messages = await this.chatService.getChatMessagesAsync(this.chatId);
      // Reverse to show oldest first
      this.messages.set(messages.reverse());
      this.shouldScrollToBottom = true;
    } catch (error: any) {
      console.error('Error loading messages:', error);
      if (showLoading) {
        this.error.set('Failed to load messages');
      }
    } finally {
      if (showLoading) {
        this.messagesLoading.set(false);
      }
    }
  }

  async sendMessage() {
    const content = this.messageForm.get('content')?.value?.trim();
    
    if (!content || !this.chatId || this.sendingMessage()) {
      console.log('Cannot send message:', { content, chatId: this.chatId, sending: this.sendingMessage() });
      return;
    }

    this.sendingMessage.set(true);
    this.error.set(null);

    try {
      console.log('Sending message via socket:', { chatId: this.chatId, content });
      
      // Stop typing indicator
      this.socketService.stopTyping(this.chatId);
      
      // Send message via socket for real-time delivery
      const response = await this.socketService.sendMessage(this.chatId, content);
      
      if (response.success && response.data) {
        // Add the message to local state since sender won't receive new-message event
        const currentMessages = this.messages();
        // Check if message already exists to prevent duplicates
        const existingMessage = currentMessages.find(m => m._id === response.data._id);
        
        if (!existingMessage) {
          this.messages.set([...currentMessages, response.data]);
          this.shouldScrollToBottom = true;
        }
        
        // Clear form
        this.messageForm.reset();
        console.log('Message sent successfully via socket');
      } else {
        throw new Error(response.error || 'Failed to send message');
      }
      
    } catch (error: any) {
      console.error('Error sending message via socket:', error);
      
      // Fallback to HTTP if socket fails
      try {
        console.log('Falling back to HTTP message sending');
        await this.chatService.sendMessageAsync(this.chatId, {
          content,
          message_type: 'text'
        });
        
        // Clear form and reload messages
        this.messageForm.reset();
        await this.loadMessages(false);
        this.shouldScrollToBottom = true;
        
        console.log('Message sent successfully via HTTP fallback');
      } catch (httpError: any) {
        console.error('HTTP fallback also failed:', httpError);
        this.error.set('Failed to send message. Please try again.');
      }
    } finally {
      this.sendingMessage.set(false);
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      this.selectedFiles.set(files);
      // Auto-upload the files
      this.uploadFiles(files);
    }
  }

  async uploadFiles(files: File[]): Promise<void> {
    if (!this.chatId || files.length === 0) {
      return;
    }

    this.uploadingFiles.set(true);
    this.error.set(null);

    try {
      const response = await this.chatService.uploadChatFilesAsync(this.chatId, files);
      
      // Trigger socket event to notify all participants of new file messages
      try {
        this.socketService.emit('files-uploaded', {
          chatId: this.chatId,
          fileCount: files.length,
          userId: this.user()?._id
        });
      } catch (socketError) {
        console.warn('Failed to send real-time file upload notification:', socketError);
      }
      
      // Force reload messages to ensure they appear
      await this.loadMessages(false);
      this.shouldScrollToBottom = true;
      
      // Clear selected files
      this.selectedFiles.set([]);
      
      console.log('Files uploaded successfully:', response);
    } catch (error: any) {
      console.error('Error uploading files:', error);
      this.error.set('Failed to upload files. Please try again.');
    } finally {
      this.uploadingFiles.set(false);
    }
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  removeSelectedFile(index: number): void {
    const current = this.selectedFiles();
    const updated = current.filter((_, i) => i !== index);
    this.selectedFiles.set(updated);
  }

  getFileIcon(file: File): string {
    const type = file.type;
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'videocam';
    if (type.startsWith('audio/')) return 'audiotrack';
    if (type.includes('pdf')) return 'picture_as_pdf';
    if (type.includes('word') || type.includes('document')) return 'description';
    if (type.includes('excel') || type.includes('spreadsheet')) return 'table_chart';
    if (type.includes('powerpoint') || type.includes('presentation')) return 'slideshow';
    return 'attach_file';
  }

  formatFileSize(bytes: number | undefined): string {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  isImageFile(message: Message): boolean {
    return message.message_type === 'image' && !!message.file_url;
  }

  isFileMessage(message: Message): boolean {
    return message.message_type === 'file' && !!message.file_url;
  }

  downloadFile(fileUrl: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async markMessagesAsRead() {
    if (!this.chatId) return;

    try {
      await this.chatService.markMessagesAsReadAsync(this.chatId);
    } catch (error: any) {
      console.error('Error marking messages as read:', error);
    }
  }

  isMyMessage(message: Message): boolean {
    return message.sender_id._id === this.user()?._id;
  }

  formatMessageTime(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatMessageDate(date: string | Date): string {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString();
    }
  }

  shouldShowDateDivider(index: number): boolean {
    if (index === 0) return true;
    
    const currentMessage = this.messages()[index];
    const previousMessage = this.messages()[index - 1];
    
    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();
    
    return currentDate !== previousDate;
  }

  // Typing indicator methods
  onTextareaInput() {
    if (!this.chatId) return;
    
    // Start typing indicator
    this.socketService.startTyping(this.chatId);
    
    // Clear previous timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    // Stop typing indicator after 3 seconds of inactivity
    this.typingTimeout = setTimeout(() => {
      this.socketService.stopTyping(this.chatId!);
    }, 3000);
  }

  onTextareaKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  getTypingText(): string {
    const typing = this.typingUsers();
    if (typing.length === 0) return '';
    
    if (typing.length === 1) {
      return `${typing[0].userName || 'Someone'} is typing...`;
    } else if (typing.length === 2) {
      return `${typing[0].userName || 'Someone'} and ${typing[1].userName || 'someone else'} are typing...`;
    } else {
      return 'Several people are typing...';
    }
  }

  getProjectStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'accepted': 'bg-blue-100 text-blue-800 border-blue-200',
      'in_progress': 'bg-purple-100 text-purple-800 border-purple-200',
      'awaiting_client_approval': 'bg-orange-100 text-orange-800 border-orange-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'rejected': 'bg-red-100 text-red-800 border-red-200',
      'cancelled': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || colors['pending'];
  }

  goToProjectDetails() {
    const chat = this.chat();
    if (chat) {
      this.router.navigate(['/dashboard/projects', chat.project_id._id]);
    }
  }

  async handleProjectAction(action: 'accept' | 'reject' | 'start' | 'complete' | 'request_completion' | 'approve_completion') {
    const chat = this.chat();
    if (!chat) return;

    try {
      const projectId = chat.project_id._id;
      
      switch (action) {
        case 'accept':
          await this.projectService.updateProjectAsync(projectId, { status: 'accepted' });
          break;
        case 'reject':
          const reason = prompt('Please provide a reason for rejection:');
          if (!reason) return;
          await this.projectService.updateProjectAsync(projectId, { 
            status: 'rejected',
            rejection_reason: reason 
          });
          break;
        case 'start':
          await this.projectService.updateProjectAsync(projectId, { status: 'in_progress' });
          break;
        case 'complete':
          // This is now "request completion" - business owner requesting client approval
          await this.requestCompletion();
          return; // Don't update project status here
        case 'request_completion':
          await this.requestCompletion();
          return;
        case 'approve_completion':
          await this.approveCompletion();
          return;
      }

      // Refresh chat data
      await this.loadChat();
      
      // Send a system message about the status change
      await this.chatService.sendMessageAsync(this.chatId!, {
        content: `Project status updated to: ${action === 'start' ? 'in progress' : action}${action === 'reject' ? 'd' : 'd'}`,
        message_type: 'project_update'
      });
      
      await this.loadMessages(false);
      
    } catch (error: any) {
      console.error(`Error ${action}ing project:`, error);
      this.error.set(`Failed to ${action} project`);
    }
  }

  canPerformAction(action: 'accept' | 'reject' | 'start' | 'complete' | 'request_completion' | 'approve_completion'): boolean {
    const chat = this.chat();
    const user = this.user();
    if (!chat || !user) return false;

    const isBusinessOwner = chat.project_id.business_owner_id._id === user._id;
    const isClient = chat.project_id.client_id._id === user._id;
    const status = chat.project_id.status;

    switch (action) {
      case 'accept':
      case 'reject':
        return isBusinessOwner && status === 'pending';
      case 'start':
        return isBusinessOwner && status === 'accepted';
      case 'complete':
      case 'request_completion':
        return isBusinessOwner && status === 'in_progress';
      case 'approve_completion':
        return isClient && status === 'awaiting_client_approval';
      default:
        return false;
    }
  }

  private scrollToBottom(): void {
    try {
      const element = this.messagesContainer?.nativeElement;
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  private handlePaymentRequestNotification(message: Message): void {
    const user = this.user();
    const chat = this.chat();
    
    // Only show notification to the client (recipient of payment request)
    if (user && chat && chat.project_id.client_id._id === user._id) {
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification('Payment Request Received', {
          body: `New payment request of $${message.payment_amount || 'N/A'} from ${this.getOtherParticipantName()}`,
          icon: '/favicon.ico',
          tag: 'payment-request'
        });
      }
      
      // You could also trigger a toast notification here
      console.log('Payment request notification:', message);
    }
  }

  private getOtherParticipantName(): string {
    const otherParticipant = this.otherParticipant();
    if (!otherParticipant) return 'Business Owner';
    
    const firstName = (otherParticipant as any).first_name || '';
    const lastName = otherParticipant.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Business Owner';
  }

  // Payment Request Methods
  async requestAdditionalPayment() {
    const dialogRef = this.dialog.open(PaymentRequestModalComponent, {
      width: '500px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(async (result: PaymentRequestData) => {
      if (result) {
        try {
          // Send payment request via HTTP - the backend will emit the socket event
          await this.chatService.requestAdditionalPaymentAsync(this.chatId!, result);
          
          // No need to manually emit socket event here - backend handles it
          // The socket subscription will catch the 'payment-request-created' event
          // and automatically refresh the messages
          
        } catch (error: any) {
          console.error('Error requesting payment:', error);
          this.error.set('Failed to request additional payment');
        }
      }
    });
  }

  async approvePaymentRequest(messageId: string) {
    try {
      // Find the payment request message to get details
      const paymentMessage = this.messages().find(m => m._id === messageId);
      if (!paymentMessage) {
        this.error.set('Payment request not found');
        return;
      }

      const chat = this.chat();
      if (!chat) {
        this.error.set('Chat information not available');
        return;
      }

      // Get business name for display
      const businessName = typeof chat.project_id.business_id === 'string' 
        ? 'Business Owner' 
        : chat.project_id.business_id.name;

      // Open payment modal - this will handle approval and payment in one flow
      const dialogRef = this.dialog.open(PaymentModalComponent, {
        width: '500px',
        disableClose: true,
        data: {
          amount: paymentMessage.payment_amount || '0',
          description: paymentMessage.payment_description || 'Additional payment',
          businessName: businessName,
          chatId: this.chatId!,
          messageId: messageId
        } as PaymentModalData
      });

      dialogRef.afterClosed().subscribe(async (result: PaymentData) => {
        if (result && result.paymentIntentId) {
          try {
            // Payment was successful, refresh messages to show updated status
            this.loadMessages(false);
            this.shouldScrollToBottom = true;
            
            console.log('Payment approved successfully with method:', result.paymentMethod);
            console.log('Payment completed for amount:', result.amount);
            
          } catch (error: any) {
            console.error('Error processing payment approval:', error);
            this.error.set('Failed to process payment approval');
          }
        }
      });
      
    } catch (error: any) {
      console.error('Error approving payment:', error);
      this.error.set('Failed to approve payment request');
    }
  }

  async rejectPaymentRequest(messageId: string) {
    const reason = prompt('Please provide a reason for rejecting this payment request:');
    if (!reason) return;

    try {
      await this.chatService.respondToPaymentRequestAsync(this.chatId!, messageId, {
        status: 'rejected',
        rejection_reason: reason
      });
      
      // No need to manually emit socket event - backend handles it
      console.log('Payment request rejected with reason:', reason);
      
    } catch (error: any) {
      console.error('Error rejecting payment:', error);
      this.error.set('Failed to reject payment request');
    }
  }

  // Completion Request Methods
  async requestCompletion() {
    const dialogRef = this.dialog.open(CompletionRequestModalComponent, {
      width: '500px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(async (result: CompletionRequestData) => {
      if (result) {
        try {
          await this.chatService.requestCompletionAsync(this.chatId!, result);
          
          // Trigger socket event for real-time message delivery
          try {
            this.socketService.emit('completion-request-created', {
              chatId: this.chatId,
              content: result.content,
              userId: this.user()?._id
            });
          } catch (socketError) {
            console.warn('Failed to send real-time completion request notification:', socketError);
          }
          
          await this.loadChat();
          await this.loadMessages(false);
        } catch (error: any) {
          console.error('Error requesting completion:', error);
          this.error.set('Failed to request completion approval');
        }
      }
    });
  }

  async approveCompletion() {
    try {
      // Reload messages first to ensure we have the latest data
      await this.loadMessages(false);
      
      const allMessages = this.messages();
      console.log('All messages:', allMessages.length);
      console.log('Completion messages:', allMessages.filter(m => m.message_type === 'completion_request'));
      
      // Find the most recent pending completion request
      // Check both completion_status and potentially missing status (default to pending)
      const pendingCompletionMessage = allMessages
        .filter(m => {
          const isCompletionRequest = m.message_type === 'completion_request';
          const isPending = !m.completion_status || m.completion_status === 'pending';
          console.log(`Message ${m._id}: type=${m.message_type}, status=${m.completion_status}, isPending=${isPending}`);
          return isCompletionRequest && isPending;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      if (!pendingCompletionMessage) {
        console.log('No pending completion request found');
        console.log('Available completion messages:', allMessages
          .filter(m => m.message_type === 'completion_request')
          .map(m => ({ 
            id: m._id, 
            type: m.message_type, 
            status: m.completion_status,
            createdAt: m.createdAt 
          }))
        );
        this.error.set('No pending completion request found. Please ensure a completion request has been sent first.');
        return;
      }

      console.log('Found pending completion message:', pendingCompletionMessage._id);

      await this.chatService.respondToCompletionRequestAsync(this.chatId!, pendingCompletionMessage._id, {
        status: 'approved'
      });
      
      // Trigger socket event for real-time status update
      try {
        this.socketService.emit('completion-approved', {
          chatId: this.chatId,
          messageId: pendingCompletionMessage._id,
          userId: this.user()?._id
        });
      } catch (socketError) {
        console.warn('Failed to send real-time completion approval notification:', socketError);
      }
      
      await this.loadChat();
      await this.loadMessages(false);
      await this.checkReviewEligibility(); // Check if user can now leave a review
    } catch (error: any) {
      console.error('Error approving completion:', error);
      this.error.set('Failed to approve completion');
    }
  }

  async rejectCompletion() {
    const reason = prompt('Please provide a reason for rejecting the completion:');
    if (!reason) return;

    try {
      // Reload messages first to ensure we have the latest data
      await this.loadMessages(false);
      
      const allMessages = this.messages();
      
      // Find the most recent pending completion request
      // Check both completion_status and potentially missing status (default to pending)
      const pendingCompletionMessage = allMessages
        .filter(m => {
          const isCompletionRequest = m.message_type === 'completion_request';
          const isPending = !m.completion_status || m.completion_status === 'pending';
          return isCompletionRequest && isPending;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      if (!pendingCompletionMessage) {
        console.log('Available completion messages:', allMessages
          .filter(m => m.message_type === 'completion_request')
          .map(m => ({ 
            id: m._id, 
            type: m.message_type, 
            status: m.completion_status,
            createdAt: m.createdAt 
          }))
        );
        this.error.set('No pending completion request found. Please ensure a completion request has been sent first.');
        return;
      }

      await this.chatService.respondToCompletionRequestAsync(this.chatId!, pendingCompletionMessage._id, {
        status: 'rejected',
        rejection_reason: reason
      });
      
      // Trigger socket event for real-time status update
      try {
        this.socketService.emit('completion-rejected', {
          chatId: this.chatId,
          messageId: pendingCompletionMessage._id,
          reason: reason,
          userId: this.user()?._id
        });
      } catch (socketError) {
        console.warn('Failed to send real-time completion rejection notification:', socketError);
      }
      
      await this.loadChat();
      await this.loadMessages(false);
    } catch (error: any) {
      console.error('Error rejecting completion:', error);
      this.error.set('Failed to reject completion');
    }
  }

  // Helper methods for message types
  isPaymentRequest(message: Message): boolean {
    return message.message_type === 'payment_request';
  }

  isCompletionRequest(message: Message): boolean {
    return message.message_type === 'completion_request';
  }

  canRespondToPayment(message: Message): boolean {
    const user = this.user();
    const chat = this.chat();
    if (!user || !chat) return false;
    
    // Only client can respond to payment requests
    return message.message_type === 'payment_request' && 
           message.payment_status === 'pending' && 
           chat.project_id.client_id._id === user._id;
  }

  canRespondToCompletion(message: Message): boolean {
    const user = this.user();
    const chat = this.chat();
    if (!user || !chat) return false;
    
    // Only client can respond to completion requests
    return message.message_type === 'completion_request' && 
           message.completion_status === 'pending' && 
           chat.project_id.client_id._id === user._id;
  }

  canRequestPayment(): boolean {
    const user = this.user();
    const chat = this.chat();
    if (!user || !chat) return false;
    
    // Only business owner can request payment for in-progress projects
    return chat.project_id.business_owner_id._id === user._id && 
           (chat.project_id.status === 'in_progress' || chat.project_id.status === 'awaiting_client_approval');
  }

  async checkReviewEligibility() {
    const user = this.user();
    const chat = this.chat();
    
    if (!user || !chat) {
      this.canLeaveReview.set(false);
      this.existingReview.set(null);
      return;
    }

    // User can interact with reviews if:
    // 1. They are the project owner (client)
    // 2. The project is completed
    const clientId = typeof chat.project_id.client_id === 'string' 
      ? chat.project_id.client_id 
      : chat.project_id.client_id._id;
    
    const isProjectOwner = user._id === clientId;
    const isProjectCompleted = chat.project_id.status === 'completed';
    
    if (!isProjectOwner || !isProjectCompleted) {
      this.canLeaveReview.set(false);
      this.existingReview.set(null);
      return;
    }

    try {
      // Check if user has already left a review for this business and project
      const existingReviews = await this.reviewService.getBusinessReviewsAsync(chat.project_id.business_id._id);
      const existingReview = existingReviews.find(
        review => review.project_id._id === chat.project_id._id && review.user_id._id === user._id
      );
      
      if (existingReview) {
        // User has already reviewed - show existing review
        this.canLeaveReview.set(false);
        this.existingReview.set(existingReview);
      } else {
        // User can leave a new review
        this.canLeaveReview.set(true);
        this.existingReview.set(null);
      }
    } catch (error) {
      console.error('Chat: Error checking review eligibility:', error);
      this.canLeaveReview.set(false);
      this.existingReview.set(null);
    }
  }

  handleReviewAction() {
    if (this.existingReview()) {
      this.viewExistingReview();
    } else if (this.canLeaveReview()) {
      this.openReviewDialog();
    }
  }

  async openReviewDialog() {
    const chat = this.chat();
    if (!chat) return;

    const dialogRef = this.dialog.open(ReviewFormComponent, {
      width: '600px',
      data: {
        businessId: chat.project_id.business_id._id,
        projectId: chat.project_id._id,
        businessName: chat.project_id.business_id.name,
        projectTitle: chat.project_id.title
      }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        // Review was submitted successfully
        console.log('Review submitted successfully');
        // Refresh review state to update UI
        await this.checkReviewEligibility();
      }
    });
  }

  viewExistingReview() {
    const review = this.existingReview();
    if (!review) return;

    // Create a detailed review display
    const reviewDetails = [
      `Your Review for this Project`,
      ``,
      `Overall Rating: ${review.rating}/5 ⭐`,
      ``,
      `Detailed Ratings:`,
      `• Service Quality: ${review.service_quality || 'N/A'}/5`,
      `• Communication: ${review.communication || 'N/A'}/5`,  
      `• Timeliness: ${review.timeliness || 'N/A'}/5`,
      `• Value for Money: ${review.value_for_money || 'N/A'}/5`,
      ``,
      `Comment: ${review.comment || 'No comment provided'}`,
      ``,
      `Submitted: ${new Date(review.createdAt).toLocaleDateString()}`
    ].join('\n');

    alert(reviewDetails);
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  navigateBack() {
    this.router.navigate(['dashboard', 'messages', 'chats']);
  }
}
