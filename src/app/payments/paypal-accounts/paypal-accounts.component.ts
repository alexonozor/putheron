import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PayPalService } from '../../shared/services/paypal.service';
import { PayPalAccount } from '../../shared/models/paypal-account.model';

@Component({
  selector: 'app-paypal-accounts',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="paypal-accounts-container">
      <div class="header">
        <h2>PayPal Accounts</h2>
        <p class="subtitle">Connect your PayPal account to receive withdrawals</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading PayPal accounts...</p>
      </div>

      <!-- No Accounts State -->
      <div *ngIf="!loading && accounts.length === 0" class="no-accounts">
        <mat-icon class="large-icon">account_balance_wallet</mat-icon>
        <h3>No PayPal Account Connected</h3>
        <p>Connect your PayPal account to start receiving withdrawals directly to your PayPal balance.</p>
        <button mat-raised-button color="primary" (click)="connectPayPal()" [disabled]="connecting">
          <mat-icon *ngIf="connecting">sync</mat-icon>
          <mat-icon *ngIf="!connecting">add</mat-icon>
          {{ connecting ? 'Connecting...' : 'Connect PayPal Account' }}
        </button>
      </div>

      <!-- Accounts List -->
      <div *ngIf="!loading && accounts.length > 0" class="accounts-list">
        <div class="accounts-header">
          <h3>Connected Accounts</h3>
          <button mat-stroked-button (click)="connectPayPal()" [disabled]="connecting">
            <mat-icon>add</mat-icon>
            Add Another Account
          </button>
        </div>

        <div class="accounts-grid">
          <mat-card *ngFor="let account of accounts" class="account-card">
            <mat-card-header>
              <div mat-card-avatar class="paypal-avatar">
                <mat-icon>payment</mat-icon>
              </div>
              <mat-card-title>{{ account.email }}</mat-card-title>
              <mat-card-subtitle>
                {{ account.name || (account.given_name + ' ' + account.family_name) }}
              </mat-card-subtitle>
            </mat-card-header>

            <mat-card-content>
              <div class="account-details">
                <div class="detail-row">
                  <span class="label">Status:</span>
                  <span class="status" [ngClass]="getVerificationClass(account.is_verified)">
                    <mat-icon>{{ account.is_verified ? 'verified' : 'warning' }}</mat-icon>
                    {{ account.is_verified ? 'Verified' : 'Not Verified' }}
                  </span>
                </div>
                
                <div class="detail-row">
                  <span class="label">Account Type:</span>
                  <span>{{ account.account_type || 'Personal' }}</span>
                </div>
                
                <div class="detail-row">
                  <span class="label">Environment:</span>
                  <span class="environment" [ngClass]="account.environment">
                    {{ account.environment === 'sandbox' ? 'Sandbox' : 'Live' }}
                  </span>
                </div>
                
                <div class="detail-row">
                  <span class="label">Connected:</span>
                  <span>{{ formatDate(account.createdAt) }}</span>
                </div>
              </div>
            </mat-card-content>

            <mat-card-actions>
              <button mat-button (click)="verifyAccount(account._id)" [disabled]="verifying === account._id">
                <mat-icon *ngIf="verifying === account._id">sync</mat-icon>
                <mat-icon *ngIf="verifying !== account._id">refresh</mat-icon>
                {{ verifying === account._id ? 'Verifying...' : 'Verify' }}
              </button>
              
              <button mat-button (click)="refreshAccount(account._id)" [disabled]="refreshing === account._id">
                <mat-icon *ngIf="refreshing === account._id">sync</mat-icon>
                <mat-icon *ngIf="refreshing !== account._id">cached</mat-icon>
                {{ refreshing === account._id ? 'Refreshing...' : 'Refresh' }}
              </button>
              
              <button mat-button color="warn" (click)="disconnectAccount(account._id)" [disabled]="disconnecting === account._id">
                <mat-icon *ngIf="disconnecting === account._id">sync</mat-icon>
                <mat-icon *ngIf="disconnecting !== account._id">logout</mat-icon>
                {{ disconnecting === account._id ? 'Disconnecting...' : 'Disconnect' }}
              </button>
            </mat-card-actions>
          </mat-card>
        </div>
      </div>

      <!-- Benefits Section -->
      <div class="benefits-section">
        <h3>Why Connect PayPal?</h3>
        <div class="benefits-grid">
          <div class="benefit-item">
            <mat-icon>speed</mat-icon>
            <h4>Fast Withdrawals</h4>
            <p>Get your earnings quickly and securely</p>
          </div>
          <div class="benefit-item">
            <mat-icon>security</mat-icon>
            <h4>Secure</h4>
            <p>Industry-standard security and encryption</p>
          </div>
          <div class="benefit-item">
            <mat-icon>low_priority</mat-icon>
            <h4>Low Fees</h4>
            <p>Only 3% platform fee for withdrawals</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .paypal-accounts-container {
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

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 64px 0;
    }

    .no-accounts {
      text-align: center;
      padding: 64px 32px;
      background: #f9f9f9;
      border-radius: 12px;
    }

    .large-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #666;
      margin-bottom: 16px;
    }

    .no-accounts h3 {
      margin: 0 0 8px 0;
      font-size: 1.5rem;
    }

    .no-accounts p {
      color: #666;
      margin: 0 0 24px 0;
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
    }

    .accounts-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .accounts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 24px;
      margin-bottom: 48px;
    }

    .account-card {
      position: relative;
    }

    .paypal-avatar {
      background: #0070ba;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .account-details {
      margin: 16px 0;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .label {
      font-weight: 500;
      color: #666;
    }

    .status {
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 500;
    }

    .status.verified {
      color: #4caf50;
    }

    .status.not-verified {
      color: #ff9800;
    }

    .environment.sandbox {
      color: #ff9800;
      font-weight: 500;
    }

    .environment.live {
      color: #4caf50;
      font-weight: 500;
    }

    .benefits-section {
      background: linear-gradient(135deg, #0070ba, #005ea6);
      color: white;
      padding: 48px 32px;
      border-radius: 12px;
      text-align: center;
    }

    .benefits-section h3 {
      margin: 0 0 32px 0;
      font-size: 1.5rem;
    }

    .benefits-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 32px;
    }

    .benefit-item {
      text-align: center;
    }

    .benefit-item mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      opacity: 0.9;
    }

    .benefit-item h4 {
      margin: 0 0 8px 0;
      font-size: 1.1rem;
    }

    .benefit-item p {
      margin: 0;
      opacity: 0.9;
    }

    @media (max-width: 768px) {
      .accounts-grid {
        grid-template-columns: 1fr;
      }
      
      .accounts-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
    }
  `]
})
export class PayPalAccountsComponent implements OnInit {
  accounts: PayPalAccount[] = [];
  loading = true;
  connecting = false;
  verifying: string | null = null;
  refreshing: string | null = null;
  disconnecting: string | null = null;

  constructor(
    private paypalService: PayPalService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadAccounts();
  }

  loadAccounts() {
    this.loading = true;
    this.paypalService.getAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load PayPal accounts:', error);
        this.snackBar.open('Failed to load PayPal accounts', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  async connectPayPal() {
    this.connecting = true;
    try {
      // For now, we'll show instructions instead of implementing the full OAuth flow
      this.showConnectionInstructions();
    } catch (error) {
      console.error('PayPal connection error:', error);
      this.snackBar.open('Failed to connect PayPal account', 'Close', { duration: 3000 });
    } finally {
      this.connecting = false;
    }
  }

  private showConnectionInstructions() {
    this.paypalService.getConnectUrl().subscribe({
      next: (response) => {
        const message = `Please open this URL in a new tab to connect your PayPal account: ${response.auth_url}`;
        this.snackBar.open('PayPal connection URL copied to console', 'Close', { duration: 5000 });
        console.log('PayPal OAuth URL:', response.auth_url);
        console.log('Instructions:', message);
        
        // Open in new window
        window.open(response.auth_url, '_blank', 'width=500,height=600');
      },
      error: (error) => {
        console.error('Failed to get PayPal OAuth URL:', error);
        this.snackBar.open('Failed to get PayPal connection URL', 'Close', { duration: 3000 });
      }
    });
  }

  verifyAccount(accountId: string) {
    this.verifying = accountId;
    this.paypalService.verifyAccount(accountId).subscribe({
      next: (result) => {
        this.snackBar.open(result.message, 'Close', { duration: 3000 });
        this.loadAccounts(); // Refresh to get updated verification status
        this.verifying = null;
      },
      error: (error) => {
        console.error('Verification failed:', error);
        this.snackBar.open('Failed to verify PayPal account', 'Close', { duration: 3000 });
        this.verifying = null;
      }
    });
  }

  refreshAccount(accountId: string) {
    this.refreshing = accountId;
    this.paypalService.refreshAccount(accountId).subscribe({
      next: (result) => {
        this.snackBar.open(result.message, 'Close', { duration: 3000 });
        this.loadAccounts(); // Refresh to get updated info
        this.refreshing = null;
      },
      error: (error) => {
        console.error('Refresh failed:', error);
        this.snackBar.open('Failed to refresh PayPal account', 'Close', { duration: 3000 });
        this.refreshing = null;
      }
    });
  }

  disconnectAccount(accountId: string) {
    if (!confirm('Are you sure you want to disconnect this PayPal account?')) {
      return;
    }

    this.disconnecting = accountId;
    this.paypalService.disconnectAccount(accountId).subscribe({
      next: (result) => {
        this.snackBar.open(result.message, 'Close', { duration: 3000 });
        this.loadAccounts(); // Refresh the list
        this.disconnecting = null;
      },
      error: (error) => {
        console.error('Disconnect failed:', error);
        this.snackBar.open('Failed to disconnect PayPal account', 'Close', { duration: 3000 });
        this.disconnecting = null;
      }
    });
  }

  getVerificationClass(isVerified: boolean): string {
    return isVerified ? 'verified' : 'not-verified';
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }
}
