import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule } from '@angular/material/paginator';

import { WithdrawalService } from '../../shared/services/withdrawal.service';
import { StripeConnectService } from '../../shared/services/stripe-connect.service';
import { 
  Withdrawal, 
  CreateWithdrawalRequest, 
  WithdrawalMethod, 
  WithdrawalStatus,
  WithdrawalStats 
} from '../../shared/models/withdrawal.model';
import { StripeAccount, StripeAccountStatus } from '../../shared/models/stripe-account.model';

@Component({
  selector: 'app-withdrawals',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatChipsModule,
    MatPaginatorModule
  ],
  template: `
    <div class="withdrawals-container">
      <div class="header">
        <h2>Withdrawals</h2>
        <p class="subtitle">Withdraw your earnings to your Stripe account</p>
      </div>

      <!-- Statistics Cards -->
      <div class="stats-grid" *ngIf="stats">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon available">account_balance_wallet</mat-icon>
              <div class="stat-info">
                <h3>{{ formatCurrency(stats.available_balance) }}</h3>
                <p>Available Balance</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon withdrawn">trending_down</mat-icon>
              <div class="stat-info">
                <h3>{{ formatCurrency(stats.total_withdrawn) }}</h3>
                <p>Total Withdrawn</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon pending">schedule</mat-icon>
              <div class="stat-info">
                <h3>{{ formatCurrency(stats.pending_amount) }}</h3>
                <p>Pending Withdrawals</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon fees">receipt</mat-icon>
              <div class="stat-info">
                <h3>{{ formatCurrency(stats.total_fees_paid) }}</h3>
                <p>Total Fees Paid</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-tab-group class="withdrawal-tabs">
        <!-- Create Withdrawal Tab -->
        <mat-tab label="New Withdrawal">
          <div class="tab-content">
            <!-- No Stripe Account Warning -->
            <div *ngIf="!stripeAccountStatus?.has_account || !stripeAccountStatus?.payouts_enabled" class="no-stripe-warning">
              <mat-icon>warning</mat-icon>
              <h3 *ngIf="!stripeAccountStatus?.has_account">No Stripe Account Connected</h3>
              <h3 *ngIf="stripeAccountStatus?.has_account && !stripeAccountStatus?.payouts_enabled">Stripe Account Setup Required</h3>
              <p *ngIf="!stripeAccountStatus?.has_account">You need to connect a Stripe account before creating withdrawals.</p>
              <p *ngIf="stripeAccountStatus?.has_account && !stripeAccountStatus?.payouts_enabled">
                Complete your Stripe account setup to enable withdrawals.
              </p>
              <button mat-raised-button color="primary" (click)="connectToStripe()">
                {{ !stripeAccountStatus?.has_account ? 'Connect Stripe Account' : 'Complete Setup' }}
              </button>
            </div>

            <!-- Withdrawal Form -->
            <mat-card *ngIf="stripeAccountStatus?.payouts_enabled" class="withdrawal-form-card">
              <mat-card-header>
                <mat-card-title>Create New Withdrawal</mat-card-title>
                <mat-card-subtitle>Withdraw your earnings to your Stripe account</mat-card-subtitle>
                <div class="card-actions">
                  <button mat-stroked-button (click)="openStripeDashboard()">
                    <mat-icon>dashboard</mat-icon>
                    Stripe Dashboard
                  </button>
                </div>
              </mat-card-header>

              <mat-card-content>
                <form [formGroup]="withdrawalForm" (ngSubmit)="createWithdrawal()">
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Withdrawal Amount</mat-label>
                      <input matInput type="number" formControlName="amount" 
                             placeholder="0.00" min="10" max="10000" step="0.01">
                      <span matSuffix>USD</span>
                      <mat-error *ngIf="withdrawalForm.get('amount')?.hasError('required')">
                        Amount is required
                      </mat-error>
                      <mat-error *ngIf="withdrawalForm.get('amount')?.hasError('min')">
                        Minimum withdrawal is $10
                      </mat-error>
                      <mat-error *ngIf="withdrawalForm.get('amount')?.hasError('max')">
                        Maximum withdrawal is $10,000
                      </mat-error>
                      <mat-error *ngIf="withdrawalForm.get('amount')?.hasError('insufficientBalance')">
                        Insufficient balance
                      </mat-error>
                    </mat-form-field>
                  </div>

                  <!-- Fee Calculation -->
                  <div class="fee-calculation" *ngIf="withdrawalForm.get('amount')?.value > 0">
                    <div class="fee-row">
                      <span>Withdrawal Amount:</span>
                      <span>{{ formatCurrency(withdrawalForm.get('amount')?.value || 0) }}</span>
                    </div>
                    <div class="fee-row">
                      <span>Platform Fee (3%):</span>
                      <span>{{ formatCurrency(calculateFee(withdrawalForm.get('amount')?.value || 0)) }}</span>
                    </div>
                    <div class="fee-row total">
                      <span><strong>You'll Receive:</strong></span>
                      <span><strong>{{ formatCurrency(calculateNetAmount(withdrawalForm.get('amount')?.value || 0)) }}</strong></span>
                    </div>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Description (Optional)</mat-label>
                      <textarea matInput formControlName="description" rows="3" 
                                placeholder="Add a note about this withdrawal"></textarea>
                    </mat-form-field>
                  </div>

                  <div class="form-actions">
                    <button mat-raised-button color="primary" type="submit" 
                            [disabled]="withdrawalForm.invalid || creating">
                      <mat-icon *ngIf="creating">sync</mat-icon>
                      <mat-icon *ngIf="!creating">send</mat-icon>
                      {{ creating ? 'Creating...' : 'Create Withdrawal' }}
                    </button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Withdrawal History Tab -->
        <mat-tab label="History">
          <div class="tab-content">
            <div class="history-header">
              <h3>Withdrawal History</h3>
              <button mat-stroked-button (click)="loadWithdrawals()">
                <mat-icon>refresh</mat-icon>
                Refresh
              </button>
            </div>

            <!-- Loading State -->
            <div *ngIf="loadingWithdrawals" class="loading-state">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Loading withdrawals...</p>
            </div>

            <!-- No Withdrawals -->
            <div *ngIf="!loadingWithdrawals && withdrawals.length === 0" class="no-withdrawals">
              <mat-icon>receipt_long</mat-icon>
              <h3>No Withdrawals Yet</h3>
              <p>Your withdrawal history will appear here once you create your first withdrawal.</p>
            </div>

            <!-- Withdrawals List -->
            <div *ngIf="!loadingWithdrawals && withdrawals.length > 0" class="withdrawals-list">
              <mat-card *ngFor="let withdrawal of withdrawals" class="withdrawal-card">
                <mat-card-content>
                  <div class="withdrawal-header">
                    <div class="withdrawal-amount">
                      <h3>{{ formatCurrency(withdrawal.amount) }}</h3>
                      <p class="net-amount">Net: {{ formatCurrency(withdrawal.net_amount) }}</p>
                    </div>
                    <div class="withdrawal-status">
                      <mat-chip [ngClass]="getStatusClass(withdrawal.status)">
                        <mat-icon>{{ getStatusIcon(withdrawal.status) }}</mat-icon>
                        {{ withdrawal.status | titlecase }}
                      </mat-chip>
                    </div>
                  </div>

                  <div class="withdrawal-details">
                    <div class="detail-row">
                      <span class="label">Method:</span>
                      <span>{{ withdrawal.method | titlecase }}</span>
                    </div>
                    <div class="detail-row" *ngIf="withdrawal.paypal_account">
                      <span class="label">PayPal Account:</span>
                      <span>{{ withdrawal.paypal_account.email || 'Unknown' }}</span>
                    </div>
                    <div class="detail-row" *ngIf="withdrawal.stripe_account_id">
                      <span class="label">Stripe Account:</span>
                      <span>{{ withdrawal.stripe_account_id }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Created:</span>
                      <span>{{ formatDate(withdrawal.createdAt) }}</span>
                    </div>
                    <div class="detail-row" *ngIf="withdrawal.processed_at">
                      <span class="label">Processed:</span>
                      <span>{{ formatDate(withdrawal.processed_at) }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Fee:</span>
                      <span>{{ formatCurrency(withdrawal.fee) }}</span>
                    </div>
                    <div class="detail-row" *ngIf="withdrawal.description">
                      <span class="label">Description:</span>
                      <span>{{ withdrawal.description }}</span>
                    </div>
                    <div class="detail-row" *ngIf="withdrawal.failed_reason">
                      <span class="label">Failure Reason:</span>
                      <span class="error-text">{{ withdrawal.failed_reason }}</span>
                    </div>
                  </div>

                  <div class="withdrawal-actions" *ngIf="withdrawal.status === 'pending'">
                    <button mat-stroked-button color="warn" 
                            (click)="cancelWithdrawal(withdrawal._id)"
                            [disabled]="cancelling === withdrawal._id">
                      <mat-icon *ngIf="cancelling === withdrawal._id">sync</mat-icon>
                      <mat-icon *ngIf="cancelling !== withdrawal._id">cancel</mat-icon>
                      {{ cancelling === withdrawal._id ? 'Cancelling...' : 'Cancel' }}
                    </button>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .withdrawals-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .header {
      text-align: center;
      margin-bottom: 32px;
    }

    .header h2 {
      margin: 0 0 8px 0;
      font-size: 2rem;
      font-weight: 600;
    }

    .subtitle {
      color: #666;
      margin: 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      padding: 8px;
      background: rgba(255, 255, 255, 0.2);
    }

    .stat-icon.available { color: #4caf50; }
    .stat-icon.withdrawn { color: #2196f3; }
    .stat-icon.pending { color: #ff9800; }
    .stat-icon.fees { color: #9c27b0; }

    .stat-info h3 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .stat-info p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }

    .withdrawal-tabs {
      margin-top: 24px;
    }

    .tab-content {
      padding: 24px 0;
    }

    .no-stripe-warning {
      text-align: center;
      padding: 48px;
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .no-stripe-warning mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #f39c12;
      margin-bottom: 16px;
    }

    .withdrawal-form-card {
      max-width: 600px;
      margin: 0 auto;
    }

    .card-actions {
      margin-left: auto;
    }

    .form-row {
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
    }

    .fee-calculation {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      margin: 16px 0;
    }

    .fee-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .fee-row.total {
      border-top: 1px solid #ddd;
      padding-top: 8px;
      margin-top: 8px;
    }

    .form-actions {
      margin-top: 24px;
      text-align: right;
    }

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 48px;
    }

    .no-withdrawals {
      text-align: center;
      padding: 48px;
      color: #666;
    }

    .no-withdrawals mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
    }

    .withdrawals-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .withdrawal-card {
      background: white;
      border-left: 4px solid #e0e0e0;
    }

    .withdrawal-card.completed {
      border-left-color: #4caf50;
    }

    .withdrawal-card.pending {
      border-left-color: #ff9800;
    }

    .withdrawal-card.processing {
      border-left-color: #2196f3;
    }

    .withdrawal-card.failed {
      border-left-color: #f44336;
    }

    .withdrawal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .withdrawal-amount h3 {
      margin: 0;
      font-size: 1.5rem;
    }

    .net-amount {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 0.9rem;
    }

    .withdrawal-details {
      margin-bottom: 16px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }

    .label {
      font-weight: 500;
      color: #666;
    }

    .error-text {
      color: #f44336;
    }

    .withdrawal-actions {
      text-align: right;
    }

    .mat-chip {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .status-pending {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .status-processing {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .status-completed {
      background-color: #e8f5e8;
      color: #388e3c;
    }

    .status-failed {
      background-color: #ffebee;
      color: #d32f2f;
    }

    .status-cancelled {
      background-color: #f5f5f5;
      color: #616161;
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
      
      .withdrawal-header {
        flex-direction: column;
        gap: 16px;
      }
      
      .history-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
    }
  `]
})
export class WithdrawalsComponent implements OnInit {
  withdrawalForm: FormGroup;
  stripeAccountStatus: StripeAccountStatus | null = null;
  withdrawals: Withdrawal[] = [];
  stats: WithdrawalStats | null = null;
  
  creating = false;
  loadingWithdrawals = true;
  loadingStripeStatus = true;
  cancelling: string | null = null;

  constructor(
    private fb: FormBuilder,
    private withdrawalService: WithdrawalService,
    private stripeConnectService: StripeConnectService,
    private snackBar: MatSnackBar
  ) {
    this.withdrawalForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(10), Validators.max(10000)]],
      description: ['']
    });
  }

  ngOnInit() {
    this.loadStripeAccountStatus();
    this.loadWithdrawals();
    this.loadStats();
    this.setupFormValidation();
  }

  setupFormValidation() {
    this.withdrawalForm.get('amount')?.valueChanges.subscribe(amount => {
      const control = this.withdrawalForm.get('amount');
      if (control && this.stats) {
        // Remove existing custom error
        if (control.hasError('insufficientBalance')) {
          const errors = { ...control.errors };
          delete errors['insufficientBalance'];
          control.setErrors(Object.keys(errors).length ? errors : null);
        }
        
        // Check if amount exceeds available balance
        if (amount > this.stats.available_balance) {
          control.setErrors({ ...control.errors, insufficientBalance: true });
        }
      }
    });
  }

  loadStripeAccountStatus() {
    this.loadingStripeStatus = true;
    this.stripeConnectService.getAccountStatus().subscribe({
      next: (status) => {
        this.stripeAccountStatus = status;
        this.loadingStripeStatus = false;
      },
      error: (error) => {
        console.error('Failed to load Stripe account status:', error);
        this.loadingStripeStatus = false;
      }
    });
  }

  loadWithdrawals() {
    this.loadingWithdrawals = true;
    this.withdrawalService.getWithdrawals().subscribe({
      next: (response) => {
        this.withdrawals = response.withdrawals;
        this.loadingWithdrawals = false;
      },
      error: (error) => {
        console.error('Failed to load withdrawals:', error);
        this.snackBar.open('Failed to load withdrawals', 'Close', { duration: 3000 });
        this.loadingWithdrawals = false;
      }
    });
  }

  loadStats() {
    this.withdrawalService.getWithdrawalStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Failed to load withdrawal stats:', error);
      }
    });
  }

  createWithdrawal() {
    if (this.withdrawalForm.invalid || !this.stripeAccountStatus?.payouts_enabled) return;

    this.creating = true;
    const request: CreateWithdrawalRequest = {
      amount: this.withdrawalForm.value.amount,
      method: WithdrawalMethod.STRIPE,
      description: this.withdrawalForm.value.description || undefined
    };

    this.withdrawalService.createWithdrawal(request).subscribe({
      next: (withdrawal) => {
        this.snackBar.open('Withdrawal created successfully!', 'Close', { duration: 3000 });
        this.withdrawalForm.reset();
        this.loadWithdrawals();
        this.loadStats();
        this.creating = false;
      },
      error: (error) => {
        console.error('Failed to create withdrawal:', error);
        this.snackBar.open(error.error?.message || 'Failed to create withdrawal', 'Close', { duration: 5000 });
        this.creating = false;
      }
    });
  }

  connectToStripe() {
    this.stripeConnectService.createOnboardingLink().subscribe({
      next: (response) => {
        window.location.href = response.url;
      },
      error: (error) => {
        console.error('Failed to create onboarding link:', error);
        this.snackBar.open('Failed to start Stripe onboarding', 'Close', { duration: 5000 });
      }
    });
  }

  openStripeDashboard() {
    this.stripeConnectService.createLoginLink().subscribe({
      next: (response) => {
        window.open(response.url, '_blank');
      },
      error: (error) => {
        console.error('Failed to create login link:', error);
        this.snackBar.open('Failed to open Stripe dashboard', 'Close', { duration: 5000 });
      }
    });
  }

  cancelWithdrawal(withdrawalId: string) {
    if (!confirm('Are you sure you want to cancel this withdrawal?')) {
      return;
    }

    this.cancelling = withdrawalId;
    this.withdrawalService.cancelWithdrawal(withdrawalId).subscribe({
      next: (response) => {
        this.snackBar.open(response.message, 'Close', { duration: 3000 });
        this.loadWithdrawals();
        this.loadStats();
        this.cancelling = null;
      },
      error: (error) => {
        console.error('Failed to cancel withdrawal:', error);
        this.snackBar.open('Failed to cancel withdrawal', 'Close', { duration: 3000 });
        this.cancelling = null;
      }
    });
  }

  formatCurrency(amount: number): string {
    return this.withdrawalService.formatCurrency(amount);
  }

  calculateFee(amount: number): number {
    return this.withdrawalService.calculateFee(amount);
  }

  calculateNetAmount(amount: number): number {
    return this.withdrawalService.calculateNetAmount(amount);
  }

  getStatusClass(status: WithdrawalStatus): string {
    return `status-${status}`;
  }

  getStatusIcon(status: WithdrawalStatus): string {
    return this.withdrawalService.getStatusIcon(status);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleString();
  }
}
