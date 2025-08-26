import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AdminTransactionsService, Transaction, TransactionEvent, Refund } from '../admin-transactions.service';

@Component({
  selector: 'app-admin-transaction-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatMenuModule,
    MatDividerModule
  ],
  template: `
    <div class="admin-transaction-details">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <button mat-icon-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="header-info">
            <h1>Transaction Details</h1>
            <div class="transaction-id" *ngIf="transaction()">
              ID: {{ transaction()!._id }}
            </div>
          </div>
        </div>
        
        <div class="header-actions" *ngIf="transaction()">
          <button mat-stroked-button [matMenuTriggerFor]="actionMenu">
            <mat-icon>more_vert</mat-icon>
            Actions
          </button>
          <mat-menu #actionMenu="matMenu">
            <button mat-menu-item (click)="editTransaction()" *ngIf="canEdit()">
              <mat-icon>edit</mat-icon>
              <span>Edit Transaction</span>
            </button>
            <button mat-menu-item (click)="processRefund()" *ngIf="canRefund()">
              <mat-icon>undo</mat-icon>
              <span>Process Refund</span>
            </button>
            <button mat-menu-item (click)="retryTransaction()" *ngIf="canRetry()">
              <mat-icon>refresh</mat-icon>
              <span>Retry Transaction</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="deleteTransaction()" class="delete-action">
              <mat-icon color="warn">delete</mat-icon>
              <span>Delete Transaction</span>
            </button>
          </mat-menu>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading-container" *ngIf="loading()">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading transaction details...</p>
      </div>

      <!-- Error -->
      <mat-card class="error-card" *ngIf="error()">
        <mat-card-content>
          <mat-icon color="warn">error</mat-icon>
          <span>{{ error() }}</span>
        </mat-card-content>
      </mat-card>

      <!-- Transaction Details -->
      <div class="transaction-content" *ngIf="!loading() && !error() && transaction()">
        <mat-tab-group>
          <!-- Overview Tab -->
          <mat-tab label="Overview">
            <div class="tab-content">
              <!-- Status and Basic Info -->
              <mat-card class="overview-card">
                <mat-card-header>
                  <mat-card-title>Transaction Overview</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="overview-grid">
                    <div class="info-item">
                      <label>Status</label>
                      <mat-chip-set>
                        <mat-chip [class]="'status-' + transaction()!.status">
                          {{ transaction()!.status | titlecase }}
                        </mat-chip>
                      </mat-chip-set>
                    </div>
                    
                    <div class="info-item">
                      <label>Type</label>
                      <mat-chip-set>
                        <mat-chip [class]="'type-' + transaction()!.type">
                          {{ transaction()!.type | titlecase }}
                        </mat-chip>
                      </mat-chip-set>
                    </div>
                    
                    <div class="info-item">
                      <label>Amount</label>
                      <div class="amount-display">
                        <span class="amount">{{ transaction()!.amount | currency:'USD' }}</span>
                        <span class="currency">{{ transaction()!.currency }}</span>
                      </div>
                    </div>
                    
                    <div class="info-item">
                      <label>Fee</label>
                      <div class="fee-display">
                        {{ transaction()!.fee | currency:'USD' }}
                      </div>
                    </div>
                    
                    <div class="info-item">
                      <label>Net Amount</label>
                      <div class="net-amount">
                        {{ netAmount() | currency:'USD' }}
                      </div>
                    </div>
                    
                    <div class="info-item">
                      <label>Created</label>
                      <div class="date-display">
                        <div>{{ transaction()!.createdAt | date:'fullDate' }}</div>
                        <div class="time">{{ transaction()!.createdAt | date:'shortTime' }}</div>
                      </div>
                    </div>
                    
                    <div class="info-item" *ngIf="transaction()!.completedAt">
                      <div class="label">Completed At</div>
                      <div class="value">
                        <div>{{ transaction()!.completedAt | date:'fullDate' }}</div>
                        <div class="time">{{ transaction()!.completedAt | date:'shortTime' }}</div>
                      </div>
                    </div>                    <div class="info-item" *ngIf="transaction()!.description">
                      <label>Description</label>
                      <div class="description">{{ transaction()!.description }}</div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- User Information -->
              <mat-card class="user-card" *ngIf="transaction()!.user">
                <mat-card-header>
                  <mat-card-title>User Information</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="user-info">
                    <div class="info-item">
                      <label>Name</label>
                      <div>{{ transaction()!.user!.firstName }} {{ transaction()!.user!.lastName }}</div>
                    </div>
                    
                    <div class="info-item">
                      <label>Email</label>
                      <div>{{ transaction()!.user!.email }}</div>
                    </div>
                    
                    <div class="info-item" *ngIf="transaction()!.user!.phone">
                      <label>Phone</label>
                      <div>{{ transaction()!.user!.phone }}</div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Payment Information -->
              <mat-card class="payment-card" *ngIf="transaction()!.paymentDetails">
                <mat-card-header>
                  <mat-card-title>Payment Details</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="payment-info">
                    <div class="info-item" *ngIf="transaction()!.paymentDetails!.method">
                      <label>Payment Method</label>
                      <div>{{ transaction()!.paymentDetails!.method | titlecase }}</div>
                    </div>
                    
                    <div class="info-item" *ngIf="transaction()!.paymentDetails!.last4">
                      <label>Card Last 4</label>
                      <div>****{{ transaction()!.paymentDetails!.last4 }}</div>
                    </div>
                    
                    <div class="info-item" *ngIf="transaction()!.paymentDetails!.brand">
                      <label>Card Brand</label>
                      <div>{{ transaction()!.paymentDetails!.brand | titlecase }}</div>
                    </div>
                    
                    <div class="info-item" *ngIf="transaction()!.paymentDetails!.gateway">
                      <label>Payment Gateway</label>
                      <div>{{ transaction()!.paymentDetails!.gateway | titlecase }}</div>
                    </div>
                    
                    <div class="info-item" *ngIf="transaction()!.paymentDetails!.transactionId">
                      <label>Gateway Transaction ID</label>
                      <div class="transaction-id">{{ transaction()!.paymentDetails!.transactionId }}</div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Events Tab -->
          <mat-tab label="Events">
            <div class="tab-content">
              <mat-card class="events-card">
                <mat-card-header>
                  <mat-card-title>Transaction Events</mat-card-title>
                  <mat-card-subtitle>Timeline of all transaction-related events</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="events-timeline" *ngIf="events().length > 0">
                    <div class="event-item" *ngFor="let event of events()">
                      <div class="event-indicator" [class]="'event-' + event.type"></div>
                      <div class="event-content">
                        <div class="event-header">
                          <span class="event-type">{{ event.type | titlecase }}</span>
                          <span class="event-date">{{ event.createdAt | date:'short' }}</span>
                        </div>
                        <div class="event-message" *ngIf="event.message">
                          {{ event.message }}
                        </div>
                        <div class="event-data" *ngIf="event.data">
                          <pre>{{ event.data | json }}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="no-events" *ngIf="events().length === 0">
                    <mat-icon>event_note</mat-icon>
                    <p>No events recorded for this transaction.</p>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Refunds Tab -->
          <mat-tab label="Refunds" *ngIf="refunds().length > 0">
            <div class="tab-content">
              <mat-card class="refunds-card">
                <mat-card-header>
                  <mat-card-title>Refunds</mat-card-title>
                  <mat-card-subtitle>All refunds associated with this transaction</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="refunds-list">
                    <div class="refund-item" *ngFor="let refund of refunds()">
                      <div class="refund-header">
                        <div class="refund-amount">{{ refund.amount | currency:'USD' }}</div>
                        <mat-chip-set>
                          <mat-chip [class]="'status-' + refund.status">
                            {{ refund.status | titlecase }}
                          </mat-chip>
                        </mat-chip-set>
                      </div>
                      <div class="refund-details">
                        <div class="refund-info">
                          <span class="label">Refund ID:</span>
                          <span class="value">{{ refund.id }}</span>
                        </div>
                        <div class="refund-info" *ngIf="refund.reason">
                          <span class="label">Reason:</span>
                          <span class="value">{{ refund.reason }}</span>
                        </div>
                        <div class="refund-info">
                          <span class="label">Created:</span>
                          <span class="value">{{ refund.createdAt | date:'short' }}</span>
                        </div>
                        <div class="refund-info" *ngIf="refund.processedAt">
                          <span class="label">Processed:</span>
                          <span class="value">{{ refund.processedAt | date:'short' }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Raw Data Tab -->
          <mat-tab label="Raw Data">
            <div class="tab-content">
              <mat-card class="raw-data-card">
                <mat-card-header>
                  <mat-card-title>Raw Transaction Data</mat-card-title>
                  <mat-card-subtitle>Complete transaction object for debugging</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <pre class="raw-data">{{ transaction() | json }}</pre>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styleUrl: './admin-transaction-details.component.scss'
})
export class AdminTransactionDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private adminTransactionsService = inject(AdminTransactionsService);
  
  // Signals
  loading = signal(true);
  error = signal<string | null>(null);
  transaction = signal<Transaction | null>(null);
  events = signal<TransactionEvent[]>([]);
  refunds = signal<Refund[]>([]);
  
  // Computed values
  netAmount = computed(() => {
    const txn = this.transaction();
    if (!txn) return 0;
    return txn.amount - (txn.fee || 0);
  });
  
  canEdit = computed(() => {
    const txn = this.transaction();
    return txn && txn.status === 'pending';
  });
  
  canRefund = computed(() => {
    const txn = this.transaction();
    return txn && txn.status === 'completed' && txn.type === 'payment';
  });
  
  canRetry = computed(() => {
    const txn = this.transaction();
    return txn && txn.status === 'failed';
  });

  ngOnInit() {
    const transactionId = this.route.snapshot.paramMap.get('id');
    if (transactionId) {
      this.loadTransactionDetails(transactionId);
    } else {
      this.error.set('Transaction ID not provided');
      this.loading.set(false);
    }
  }

  private async loadTransactionDetails(transactionId: string) {
    try {
      this.loading.set(true);
      this.error.set(null);

      const [transaction, events, refunds] = await Promise.all([
        this.adminTransactionsService.getTransactionAsync(transactionId),
        this.adminTransactionsService.getTransactionEventsAsync(transactionId),
        this.adminTransactionsService.getTransactionRefundsAsync(transactionId)
      ]);

      this.transaction.set(transaction);
      this.events.set(events);
      this.refunds.set(refunds);
    } catch (err: any) {
      console.error('Error loading transaction details:', err);
      this.error.set('Failed to load transaction details. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/admin/transactions']);
  }

  editTransaction() {
    // TODO: Implement edit transaction dialog
    console.log('Edit transaction:', this.transaction()?.id);
  }

  async processRefund() {
    const transaction = this.transaction();
    if (!transaction) return;

    // TODO: Implement refund dialog
    const confirmed = confirm(`Process refund for transaction ${transaction.id}?`);
    if (!confirmed) return;

    try {
      this.loading.set(true);
      await this.adminTransactionsService.processRefundAsync(transaction._id, transaction.amount, 'Admin initiated refund');
      
      // Reload transaction details
      await this.loadTransactionDetails(transaction._id);
    } catch (err: any) {
      console.error('Error processing refund:', err);
      this.error.set('Failed to process refund. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async retryTransaction() {
    const transaction = this.transaction();
    if (!transaction) return;

    const confirmed = confirm(`Retry transaction ${transaction.id}?`);
    if (!confirmed) return;

    try {
      this.loading.set(true);
      await this.adminTransactionsService.retryTransactionAsync(transaction._id);
      
      // Reload transaction details
      await this.loadTransactionDetails(transaction._id);
    } catch (err: any) {
      console.error('Error retrying transaction:', err);
      this.error.set('Failed to retry transaction. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async deleteTransaction() {
    const transaction = this.transaction();
    if (!transaction) return;

    const confirmed = confirm(`Are you sure you want to delete transaction ${transaction.id}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      this.loading.set(true);
      await this.adminTransactionsService.deleteTransactionAsync(transaction._id);
      
      // Navigate back to list
      this.router.navigate(['/admin/transactions']);
    } catch (err: any) {
      console.error('Error deleting transaction:', err);
      this.error.set('Failed to delete transaction. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
