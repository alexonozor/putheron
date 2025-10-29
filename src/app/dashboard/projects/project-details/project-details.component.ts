import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { ProjectService, Project } from '../../../shared/services/project.service';
import { AuthService } from '../../../shared/services/auth.service';
import { ChatService, Message } from '../../../shared/services/chat.service';
import { ReviewService } from '../../../shared/services/review.service';
import { DashboardRefreshService } from '../../../shared/services/dashboard-refresh.service';
import { SocketService } from '../../../shared/services/socket.service';
import { PaymentModalComponent, PaymentModalData, PaymentData } from '../../messages/chat/modals/payment-modal.component';
import { PaymentRequestModalComponent, PaymentRequestData, PaymentRequestModalData } from '../../messages/chat/modals/payment-request-modal.component';
import { CompletionRequestModalComponent, CompletionRequestData } from '../../messages/chat/modals/completion-request-modal.component';
import { ReviewFormComponent } from '../../../shared/components/review-form/review-form.component';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
  ],
  templateUrl: './project-details.component.html',
  styleUrl: './project-details.component.scss'
})
export class ProjectDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly authService = inject(AuthService);
  private readonly chatService = inject(ChatService);
  private readonly reviewService = inject(ReviewService);
  private readonly dashboardRefreshService = inject(DashboardRefreshService);
  private readonly socketService = inject(SocketService);
  private readonly dialog = inject(MatDialog);

  // Signals
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly project = signal<Project | null>(null);
  readonly existingChat = signal<any | null>(null);
  readonly chatUnreadCount = signal<number>(0);
  readonly loadingChat = signal(false);
  readonly paymentRequests = signal<Message[]>([]);
  readonly loadingPaymentRequests = signal(false);
  readonly canLeaveReview = signal<boolean>(false);
  readonly existingReview = signal<any>(null);

  // Computed signals
  readonly user = this.authService.user;
  readonly isClient = computed(() => {
    const project = this.project();
    const user = this.user();
    if (!project || !user) return false;
    
    const clientId = typeof project.client_id === 'string' 
      ? project.client_id 
      : project.client_id?._id;
    
    return user._id === clientId;
  });

  readonly isBusinessOwner = computed(() => {
    const project = this.project();
    const user = this.user();
    if (!project || !user) return false;
    
    const businessOwnerId = typeof project.business_owner_id === 'string' 
      ? project.business_owner_id 
      : project.business_owner_id?._id;
    
    return user._id === businessOwnerId;
  });

  readonly pendingPaymentRequests = computed(() => {
    return this.paymentRequests().filter(request => 
      request.message_type === 'payment_request' && 
      request.payment_status === 'pending'
    );
  });

  readonly approvedPaymentRequests = computed(() => {
    return this.paymentRequests().filter(request => 
      request.message_type === 'payment_request' && 
      request.payment_status === 'approved'
    );
  });

  readonly rejectedPaymentRequests = computed(() => {
    return this.paymentRequests().filter(request => 
      request.message_type === 'payment_request' && 
      request.payment_status === 'rejected'
    );
  });

  // New computed signal to check if client should see payment buttons based on project status
  readonly shouldShowPaymentButtons = computed(() => {
    const project = this.project();
    const isClient = this.isClient();
    
    if (!project || !isClient) return false;
    
    // Show payment buttons only if project status is 'payment_requested'
    // Hide them once payment is completed or any other status
    return project.status === 'payment_requested';
  });

  readonly hasPendingPaymentRequests = computed(() => {
    // Use the new project status-based approach instead of chat messages
    return this.shouldShowPaymentButtons();
  });

  readonly hasPaymentHistory = computed(() => {
    return this.paymentRequests().length > 0;
  });

  readonly hasCompletedPayments = computed(() => {
    return this.paymentRequests().some(request => 
      request.message_type === 'payment_request' && 
      (request.payment_status === 'approved' || request.payment_status === 'paid')
    );
  });

  readonly canStartProject = computed(() => {
    const project = this.project();
    if (!project || !this.isBusinessOwner()) return false;
    
    return project.status === 'payment_completed' || 
           (project.status === 'payment_requested' && this.hasCompletedPayments());
  });

  // Review computed properties
  readonly reviewButtonText = computed(() => {
    const existing = this.existingReview();
    const canLeave = this.canLeaveReview();
    
    if (existing) {
      const rating = existing.rating;
      return `View Review (${rating}⭐)`;
    }
    if (canLeave) {
      return 'Leave Review';
    }
    return '';
  });

  readonly showReviewButton = computed(() => {
    const canLeave = this.canLeaveReview();
    const existing = this.existingReview();
    const show = Boolean(canLeave || existing);
    return show;
  });

  ngOnInit() {
    if (!this.user()) {
      this.router.navigate(['/auth']);
      return;
    }

    const projectId = this.route.snapshot.params['id'];
    if (!projectId) {
      this.error.set('Project ID is required');
      this.router.navigate(['/dashboard/projects']);
      return;
    }

    this.loadProject(projectId);
    this.setupRealtimeUpdates();
  }

  private setupRealtimeUpdates() {
    // Listen for project status updates
    this.socketService.onEvent('project-status-updated').subscribe((data: any) => {
      console.log('🔥 Project status update received:', data);
      const currentProject = this.project();
      if (currentProject && data.projectId === currentProject._id) {
        console.log('🔥 Reloading project due to status update');
        this.loadProject(currentProject._id);
      }
    });

        // Listen for completion request created
    this.socketService.onEvent('completion-request-created').subscribe((data: any) => {
      console.log('🔥 Completion request created received:', data);
      const currentProject = this.project();
      if (currentProject && data.projectId === currentProject._id) {
        console.log('🔥 Reloading project due to completion request created');
        this.loadProject(currentProject._id);
      }
    });

    // Listen for payment completed
    this.socketService.onEvent('payment-completed').subscribe(async (data: any) => {
      console.log('🔥 Payment completed received:', data);
      const currentProject = this.project();
      if (currentProject && data.chatId === currentProject.chat_room_id) {
        console.log('🔥 Reloading project due to payment completion');
        // Add a small delay to ensure backend has processed the update
        setTimeout(async () => {
          await this.loadProject(currentProject._id);
          // Payment requests will be loaded automatically when project loads
        }, 500);
      }
    });

    // Listen for notifications that might affect this project
    this.socketService.onNewNotification().subscribe((notification: any) => {
      console.log('🔥 New notification received:', notification);
      const currentProject = this.project();
      if (currentProject && notification.project_id === currentProject._id) {
        console.log('🔥 Reloading project due to project notification');
        this.loadProject(currentProject._id);
      }
    });
  }

  async loadProject(projectId: string) {
    this.loading.set(true);
    this.error.set(null);

    try {
      const project = await this.projectService.getProjectAsync(projectId);
      this.project.set(project);
      
      // Check for existing chat if project status allows it
      if (['accepted', 'started', 'payment_requested', 'payment_completed', 'in_progress', 'awaiting_client_approval', 'completed'].includes(project.status)) {
        await this.checkForExistingChat(projectId);
        
        // Load payment requests from chat messages to get proper message IDs
        await this.loadPaymentRequests();
      }
      
      // Check review eligibility for completed projects
      await this.checkReviewEligibility();
    } catch (error: any) {
      console.error('Error loading project:', error);
      this.error.set('Failed to load project details');
    } finally {
      this.loading.set(false);
    }
  }

  async checkForExistingChat(projectId: string) {
    this.loadingChat.set(true);
    try {
      const chat = await this.chatService.getChatByProjectIdAsync(projectId);
      this.existingChat.set(chat);
      
      if (chat) {
        // Get unread count for this chat
        const unreadCount = await this.chatService.getChatUnreadCountAsync(chat._id);
        this.chatUnreadCount.set(unreadCount);
      }
    } catch (error: any) {
      console.error('Error checking for existing chat:', error);
      // Don't show error for this, just keep chat as null
    } finally {
      this.loadingChat.set(false);
    }
  }

  async loadPaymentRequests() {
    // Load additional payment requests from chat messages to get proper message IDs
    // We need the actual message IDs from the database for operations like approve/reject
    this.loadingPaymentRequests.set(true);
    try {
      const project = this.project();
      if (!project || !project.chat_room_id) {
        console.log('⚠️ No project or chat room found');
        this.paymentRequests.set([]);
        return;
      }

      console.log('🔄 Loading payment requests from chat messages');
      
      // Fetch chat messages to get proper message IDs
      const messages = await this.chatService.getChatMessagesAsync(project.chat_room_id);
      
      // Filter for payment request messages, excluding initial payment
      const paymentMessages = messages.filter(message => {
        if (message.message_type !== 'payment_request') return false;
        
        // Exclude initial payment messages
        const desc = message.payment_description?.toLowerCase() || '';
        return desc !== 'project payment' && desc !== 'initial project payment';
      });
      
      console.log('💳 Found additional payment request messages:', paymentMessages.map(msg => ({
        id: msg._id,
        amount: msg.payment_amount,
        status: msg.payment_status || 'undefined',
        description: msg.payment_description,
        createdAt: msg.createdAt
      })));

      console.log('➕ Additional payment requests count:', paymentMessages.length);
      
      this.paymentRequests.set(paymentMessages);
      
    } catch (error: any) {
      console.error('Error loading payment requests:', error);
      // Don't show error for this, just keep empty array
      this.paymentRequests.set([]);
    } finally {
      this.loadingPaymentRequests.set(false);
    }
  }

  async refreshPaymentRequests() {
    const project = this.project();
    if (project) {
      console.log('🔄 Manual refresh of payment requests');
      // Reload project to get updated payment requests
      await this.loadProject(project._id);
    }
  }

  goBack() {
    this.router.navigate(['/dashboard/projects']);
  }

  async acceptProject() {
    const project = this.project();
    if (!project) return;

    try {
      await this.projectService.acceptProjectAsync(project._id);
      await this.loadProject(project._id);
    } catch (error: any) {
      console.error('Error accepting project:', error);
      this.error.set('Failed to accept project');
    }
  }

  async requestPayment() {
    const project = this.project();
    if (!project) return;

    // First, create or get the chat for this project
    let chat = this.existingChat();
    if (!chat) {
      try {
        chat = await this.chatService.createOrGetChatAsync({ project_id: project._id });
        this.existingChat.set(chat);
      } catch (error: any) {
        console.error('Error creating chat:', error);
        this.error.set('Failed to create project chat');
        return;
      }
    }

    // Open payment request modal with pre-filled amount
    const modalData: PaymentRequestModalData = {
      defaultAmount: project.offered_price || 0,
      isStartPayment: true
    };

    const dialogRef = this.dialog.open(PaymentRequestModalComponent, {
      width: '500px',
      disableClose: true,
      data: modalData
    });

    dialogRef.afterClosed().subscribe(async (result: PaymentRequestData) => {
      if (result) {
        try {
          // Send payment request via chat
          await this.chatService.requestAdditionalPaymentAsync(chat!._id, result);
          
          // Update project status to 'payment_requested'
          await this.projectService.updateProjectAsync(project._id, { status: 'payment_requested' });
          
          // Reload project data (which will also reload payment requests)
          await this.loadProject(project._id);
          
          alert('Payment request sent successfully! The client will be notified to make payment.');
          
        } catch (error: any) {
          console.error('Error requesting payment:', error);
          this.error.set('Failed to request payment');
        }
      }
    });
  }

  async startProject() {
    const project = this.project();
    if (!project) return;

    try {
      // Update project status to 'in_progress'
      await this.projectService.updateProjectAsync(project._id, { status: 'in_progress' });
      
      // Reload project data
      await this.loadProject(project._id);
      
      // Trigger dashboard refresh
      this.dashboardRefreshService.triggerRefresh();
      
      alert('Project started successfully! You can now begin working on the project.');
      
    } catch (error: any) {
      console.error('Error starting project:', error);
      this.error.set('Failed to start project');
    }
  }

  async rejectProject() {
    const project = this.project();
    if (!project) return;

    const reason = prompt('Please provide a reason for rejection:');
    if (reason === null) return; // User cancelled

    try {
      await this.projectService.rejectProjectAsync(project._id, reason);
      await this.loadProject(project._id);
    } catch (error: any) {
      console.error('Error rejecting project:', error);
      this.error.set('Failed to reject project');
    }
  }



  async requestCompletion() {
    const project = this.project();
    if (!project) return;

    // Ensure chat exists
    let chat = this.existingChat();
    if (!chat) {
      try {
        chat = await this.chatService.createOrGetChatAsync({ project_id: project._id });
        this.existingChat.set(chat);
      } catch (error: any) {
        console.error('Error creating chat:', error);
        this.error.set('Failed to create project chat');
        return;
      }
    }

    // Open completion request modal
    const dialogRef = this.dialog.open(CompletionRequestModalComponent, {
      width: '500px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(async (result: CompletionRequestData) => {
      if (result) {
        try {
          // Send completion request via chat
          await this.chatService.requestCompletionAsync(chat!._id, result);
          
          // Reload project data
          await this.loadProject(project._id);
          
          // Trigger dashboard refresh
          this.dashboardRefreshService.triggerRefresh();
          
          alert('Completion request sent successfully! The client will be notified to review and approve.');
          
        } catch (error: any) {
          console.error('Error requesting completion:', error);
          this.error.set('Failed to request completion');
        }
      }
    });
  }

  async requestAdditionalPayment() {
    const project = this.project();
    if (!project) return;

    // Ensure chat exists
    let chat = this.existingChat();
    if (!chat) {
      try {
        chat = await this.chatService.createOrGetChatAsync({ project_id: project._id });
        this.existingChat.set(chat);
      } catch (error: any) {
        console.error('Error creating chat:', error);
        this.error.set('Failed to create project chat');
        return;
      }
    }

    // Open payment request modal
    const dialogRef = this.dialog.open(PaymentRequestModalComponent, {
      width: '500px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(async (result: PaymentRequestData) => {
      if (result) {
        try {
          // Send payment request via chat
          await this.chatService.requestAdditionalPaymentAsync(chat!._id, result);
          
          // Reload project to get updated payment requests
          await this.loadProject(project._id);
          
          alert('Additional payment request sent successfully!');
          
        } catch (error: any) {
          console.error('Error requesting additional payment:', error);
          this.error.set('Failed to request additional payment');
        }
      }
    });
  }

  async startChat() {
    const project = this.project();
    if (!project) return;

    try {
      const chat = await this.chatService.createOrGetChatAsync({ project_id: project._id });
      this.router.navigate(['/dashboard/messages/chat', chat._id]);
    } catch (error: any) {
      console.error('Error starting chat:', error);
      alert('Failed to start chat. Please try again.');
    }
  }

  async goToExistingChat() {
    const chat = this.existingChat();
    if (!chat) return;

    this.router.navigate(['/dashboard/messages/chat', chat._id]);
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'requested': 'bg-blue-100 text-blue-800 border-blue-200',
      'under_review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'accepted': 'bg-green-100 text-green-800 border-green-200',
      'started': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'payment_requested': 'bg-orange-100 text-orange-800 border-orange-200',
      'payment_pending': 'bg-orange-100 text-orange-800 border-orange-200',
      'payment_completed': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'in_progress': 'bg-purple-100 text-purple-800 border-purple-200',
      'awaiting_client_approval': 'bg-amber-100 text-amber-800 border-amber-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'rejected': 'bg-red-100 text-red-800 border-red-200',
      'cancelled': 'bg-gray-100 text-gray-800 border-gray-200',
      'settled': 'bg-teal-100 text-teal-800 border-teal-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pending',
      'accepted': 'Accepted',
      'in_progress': 'In Progress',
      'awaiting_client_approval': 'Awaiting Your Approval',
      'completed': 'Completed',
      'rejected': 'Rejected',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  }

  async approveCompletion() {
    const project = this.project();
    if (!project) return;

    try {
      // First approve completion via chat if chat exists
      const chat = this.existingChat();
      if (chat) {
        // Find the pending completion request message
        const messages = await this.chatService.getChatMessagesAsync(chat._id);
        const pendingCompletionMessage = messages
          .filter(m => m.message_type === 'completion_request' && m.completion_status === 'pending')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        
        if (pendingCompletionMessage) {
          await this.chatService.respondToCompletionRequestAsync(chat._id, pendingCompletionMessage._id, {
            status: 'approved'
          });
        }
      } else {
        // Fallback: directly update project status
        await this.projectService.updateProjectAsync(project._id, { status: 'completed' });
      }
      
      // Refresh project data
      await this.loadProject(project._id);
      
      // Check if user can now leave a review
      await this.checkReviewEligibility();
      
      // Trigger dashboard refresh
      this.dashboardRefreshService.triggerRefresh();
      
    } catch (error: any) {
      console.error('Error approving completion:', error);
      this.error.set('Failed to approve completion');
    }
  }

  async rejectCompletion() {
    const project = this.project();
    if (!project) return;

    const reason = prompt('Please provide a reason for rejecting the completion:');
    if (!reason) return;

    try {
      // First reject completion via chat if chat exists
      const chat = this.existingChat();
      if (chat) {
        // Find the pending completion request message
        const messages = await this.chatService.getChatMessagesAsync(chat._id);
        const pendingCompletionMessage = messages
          .filter(m => m.message_type === 'completion_request' && m.completion_status === 'pending')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        
        if (pendingCompletionMessage) {
          await this.chatService.respondToCompletionRequestAsync(chat._id, pendingCompletionMessage._id, {
            status: 'rejected',
            rejection_reason: reason
          });
        }
      } else {
        // Fallback: directly update project status
        await this.projectService.updateProjectAsync(project._id, { status: 'in_progress' });
      }
      
      // Refresh project data
      await this.loadProject(project._id);
      
      // Trigger dashboard refresh
      this.dashboardRefreshService.triggerRefresh();
      
    } catch (error: any) {
      console.error('Error rejecting completion:', error);
      this.error.set('Failed to reject completion');
    }
  }

  canApproveCompletion(): boolean {
    const project = this.project();
    const user = this.user();
    if (!project || !user) return false;
    
    const clientId = typeof project.client_id === 'string' 
      ? project.client_id 
      : project.client_id?._id;
    
    return project.status === 'awaiting_client_approval' && clientId === user._id;
  }

  // Payment Request Methods
  async approvePaymentRequest(paymentRequest: Message) {
    try {
      const chat = this.existingChat();
      const project = this.project();
      if (!chat || !project) return;

      // Get business name for display
      const businessName = typeof project.business_id === 'string' 
        ? 'Business Owner' 
        : project.business_id?.name || 'Business Owner';

      // Open payment modal - this will handle approval and payment in one flow
      const dialogRef = this.dialog.open(PaymentModalComponent, {
        width: '500px',
        disableClose: true,
        data: {
          amount: paymentRequest.payment_amount?.toString() || '0',
          description: paymentRequest.payment_description || 'Additional payment',
          businessName: businessName,
          chatId: chat._id,
          messageId: paymentRequest._id
        } as PaymentModalData
      });

      dialogRef.afterClosed().subscribe(async (result: PaymentData) => {
        if (result && result.paymentIntentId) {
          try {
            // Payment was successful, reload project to show updated status and payment requests
            await this.refreshPaymentStatus();
            
            console.log('Payment approved successfully with method:', result.paymentMethod);
            console.log('Payment completed for amount:', result.amount);
            
          } catch (error: any) {
            console.error('Error approving payment request:', error);
            this.error.set('Failed to approve payment request');
          }
        }
      });
      
    } catch (error: any) {
      console.error('Error opening payment modal:', error);
      this.error.set('Failed to open payment modal');
    }
  }

  async rejectPaymentRequest(paymentRequest: Message) {
    const reason = prompt('Please provide a reason for rejecting this payment request:');
    if (!reason) return;

    try {
      const chat = this.existingChat();
      if (!chat) return;

      await this.chatService.respondToPaymentRequestAsync(chat._id, paymentRequest._id, {
        status: 'rejected',
        rejection_reason: reason
      });

      // Reload project to get updated payment requests
      const project = this.project();
      if (project) {
        await this.loadProject(project._id);
      }
      
    } catch (error: any) {
      console.error('Error rejecting payment request:', error);
      this.error.set('Failed to reject payment request');
    }
  }

  // Refresh payment status - useful for real-time updates
  async refreshPaymentStatus() {
    const project = this.project();
    
    if (project) {
      // Reload the project to get the latest status and payment requests
      await this.loadProject(project._id);
    }
  }

  // Status-based payment methods for when project status is 'payment_requested'
  async approveProjectPayment() {
    try {
      const project = this.project();
      if (!project) return;

      // Get business name for display
      const businessName = typeof project.business_id === 'string' 
        ? 'Business Owner' 
        : project.business_id?.name || 'Business Owner';

      // Open payment modal for the project amount
      const dialogRef = this.dialog.open(PaymentModalComponent, {
        width: '500px',
        disableClose: true,
        data: {
          amount: project.offered_price?.toString() || '0',
          description: `Payment for project: ${project.title}`,
          businessName: businessName,
          projectId: project._id,
          isProjectPayment: true
        } as PaymentModalData
      });

      dialogRef.afterClosed().subscribe(async (result: PaymentData) => {
        if (result && result.paymentIntentId) {
          try {
            // Just reload project to show updated status
            // The backend confirmPayment method handles status updates
            await this.loadProject(project._id);
            
            console.log('Project payment completed successfully');
            
          } catch (error: any) {
            console.error('Error reloading project after payment:', error);
            this.error.set('Payment completed but failed to reload project');
          }
        }
      });
      
    } catch (error: any) {
      console.error('Error opening project payment modal:', error);
      this.error.set('Failed to open payment modal');
    }
  }

  async declineProjectPayment() {
    const reason = prompt('Please provide a reason for declining this payment:');
    if (!reason) return;

    try {
      const project = this.project();
      if (!project) return;

      // For now, show a message that decline is not available
      // TODO: Implement proper decline functionality once backend is ready
      alert(`Thank you for your feedback. Reason: "${reason}"\n\nPlease contact the business owner directly to discuss payment terms. The decline functionality will be available soon.`);
      
    } catch (error: any) {
      console.error('Error declining project payment:', error);
      this.error.set('Failed to decline payment');
    }
  }

  getPaymentStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'approved': 'bg-green-100 text-green-800 border-green-200',
      'payment_pending': 'bg-blue-100 text-blue-800 border-blue-200',
      'paid': 'bg-green-100 text-green-800 border-green-200',
      'rejected': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  formatPaymentTime(date: string | Date): string {
    const d = new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return d.toLocaleDateString();
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'Not set';
    
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  }

  getBusinessName(project: Project): string {
    if (typeof project.business_id === 'object' && project.business_id.name) {
      return project.business_id.name;
    }
    return 'Unknown Business';
  }

  getClientName(project: Project): string {
    if (typeof project.client_id === 'object') {
      const client = project.client_id;
      return `${client.first_name} ${client.last_name}`;
    }
    return 'Unknown Client';
  }

  getServiceNames(project: Project): string[] {
    if (project.selected_services && Array.isArray(project.selected_services)) {
      return project.selected_services.map((service: any) => {
        if (typeof service === 'object' && service !== null) {
          // Handle both populated service objects and service references
          if ('name' in service && service.name) {
            return service.name;
          }
          // If it's a reference with service info
          if ('service_id' in service && typeof service.service_id === 'object' && service.service_id !== null && 'name' in service.service_id) {
            return service.service_id.name;
          }
        }
        // Handle string service IDs by showing a placeholder
        if (typeof service === 'string') {
          return 'Service Details Available'; // More descriptive placeholder
        }
        return 'Unknown Service';
      });
    }
    return [];
  }

    // Enhanced method to get service details with pricing
  getServiceDetails(project: Project): Array<{name: string, price?: number, pricing_type?: string, description?: string}> {    
    if (project.selected_services && Array.isArray(project.selected_services)) {
      return project.selected_services.map((service: any) => {
        // Handle populated service objects (when backend populates the services)
        if (typeof service === 'object' && service !== null && '_id' in service) {
          // Direct service object with all details (populated by backend)
          return {
            name: service.name || 'Unnamed Service',
            price: service.price,
            pricing_type: service.pricing_type,
            description: service.short_description || service.description
          };
        }
        // Handle string service IDs (when services are not populated)
        if (typeof service === 'string') {
          return {
            name: 'Service Details Not Available',
            price: undefined,
            pricing_type: undefined,
            description: `Service ID: ${service} - Please contact support if this persists`
          };
        }
        // Fallback for unknown structure
        return {
          name: 'Unknown Service Format',
          price: undefined,
          pricing_type: undefined,
          description: 'Service data structure not recognized'
        };
      });
    }
    return [];
  }

  // Helper method to format service pricing
  formatServicePrice(price?: number, pricingType?: string): string {
    if (!price) return 'Price not specified';
    
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);

    if (!pricingType) return formattedPrice;

    switch (pricingType.toLowerCase()) {
      case 'fixed':
        return `${formattedPrice} (Fixed)`;
      case 'hourly':
        return `${formattedPrice}/hour`;
      case 'daily':
        return `${formattedPrice}/day`;
      case 'weekly':
        return `${formattedPrice}/week`;
      case 'monthly':
        return `${formattedPrice}/month`;
      case 'per_project':
        return `${formattedPrice} (Per Project)`;
      default:
        return `${formattedPrice} (${pricingType})`;
    }
  }

  // Navigation method for business profile
  navigateToBusinessProfile(businessSlug: string): void {
    if (businessSlug) {
      this.router.navigate(['/business/profile', businessSlug]);
    }
  }

  // Helper methods for type-safe access to populated fields
  getBusinessInfo(project: Project): { name: string; logo_url?: string; id: string } | null {
    if (typeof project.business_id === 'object' && project.business_id) {
      return {
        name: project.business_id.name || 'Unknown Business',
        logo_url: project.business_id.logo_url,
        id: project.business_id._id
      };
    }
    return null;
  }

  getClientInfo(project: Project): { first_name: string; last_name: string; email: string } | null {
    if (typeof project.client_id === 'object' && project.client_id) {
      return {
        first_name: project.client_id.first_name || 'Unknown',
        last_name: project.client_id.last_name || 'Client',
        email: project.client_id.email
      };
    }
    return null;
  }

  // File helper methods
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(type: string): string {
    if (type.startsWith('image/')) return 'image';
    if (type.includes('pdf')) return 'picture_as_pdf';
    if (type.includes('word') || type.includes('document')) return 'description';
    if (type.includes('sheet') || type.includes('excel')) return 'table_chart';
    if (type.includes('presentation') || type.includes('powerpoint')) return 'slideshow';
    if (type.includes('text')) return 'text_snippet';
    return 'attach_file';
  }

  // Navigate to chat for this project
  async navigateToChat(): Promise<void> {
    const project = this.project();
    if (!project) return;

    try {
      let chat = this.existingChat();
      
      // If no existing chat, try to create one
      if (!chat) {
        chat = await this.chatService.createOrGetChatAsync({
          project_id: project._id
        });
        this.existingChat.set(chat);
      }
      
      // Navigate to the chat room
      if (chat) {
        this.router.navigate(['/dashboard/messages/chat', chat._id]);
      }
    } catch (error) {
      console.error('Error navigating to chat:', error);
      this.error.set('Failed to open chat. Please try again.');
    }
  }

  // Review Methods
  async checkReviewEligibility() {
    const user = this.user();
    const project = this.project();
    
    if (!user || !project) {
      this.canLeaveReview.set(false);
      this.existingReview.set(null);
      return;
    }

    // User can interact with reviews if:
    // 1. They are the project owner (client)
    // 2. The project is completed
    const clientId = typeof project.client_id === 'string' 
      ? project.client_id 
      : project.client_id?._id;
    
    const isProjectOwner = user._id === clientId;
    const isProjectCompleted = project.status === 'completed';
    
    if (!isProjectOwner || !isProjectCompleted) {
      this.canLeaveReview.set(false);
      this.existingReview.set(null);
      return;
    }

    try {
      // Get business ID (not business owner ID)
      const businessId = typeof project.business_id === 'string' 
        ? project.business_id 
        : project.business_id._id;

      // Check if user has already left a review for this business and project
      const existingReviews = await this.reviewService.getBusinessReviewsAsync(businessId);
      const existingReview = existingReviews.find(
        review => review.project_id._id === project._id && review.user_id._id === user._id
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
      console.error('Error checking review eligibility:', error);
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
    const project = this.project();
    if (!project) return;

    // Get business ID and name
    const businessId = typeof project.business_id === 'string' 
      ? project.business_id 
      : project.business_id._id;
    
    const businessName = typeof project.business_id === 'object' && project.business_id.name
      ? project.business_id.name
      : 'Business';

    const dialogRef = this.dialog.open(ReviewFormComponent, {
      width: '600px',
      data: {
        businessId: businessId,
        projectId: project._id,
        businessName: businessName,
        projectTitle: project.title
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

  // Debug method - can be called from browser console
  async testReviewEligibility() {
    console.log('=== Manual Review Eligibility Test ===');
    await this.checkReviewEligibility();
    console.log('Current state after test:', {
      canLeaveReview: this.canLeaveReview(),
      existingReview: this.existingReview(),
      showReviewButton: this.showReviewButton()
    });
  }
}
