import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PayPalService } from '../../services/paypal.service';

@Component({
  selector: 'app-paypal-callback',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <div class="callback-container">
      <!-- Processing State -->
      <div *ngIf="processing" class="processing-state">
        <mat-spinner diameter="48"></mat-spinner>
        <h2>Connecting PayPal Account</h2>
        <p>Please wait while we connect your PayPal account...</p>
      </div>

      <!-- Success State -->
      <div *ngIf="success && !processing" class="success-state">
        <mat-icon class="success-icon">check_circle</mat-icon>
        <h2>PayPal Account Connected!</h2>
        <p>Your PayPal account has been successfully connected.</p>
        <div class="account-info" *ngIf="connectedAccount">
          <p><strong>Email:</strong> {{ connectedAccount.email }}</p>
          <p><strong>Status:</strong> {{ connectedAccount.is_verified ? 'Verified' : 'Not Verified' }}</p>
        </div>
        <div class="actions">
          <button mat-raised-button color="primary" (click)="goToPayPalAccounts()">
            View PayPal Accounts
          </button>
          <button mat-stroked-button (click)="goToWithdrawals()">
            Create Withdrawal
          </button>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="error && !processing" class="error-state">
        <mat-icon class="error-icon">error</mat-icon>
        <h2>Connection Failed</h2>
        <p>{{ errorMessage }}</p>
        <div class="actions">
          <button mat-raised-button color="primary" (click)="retry()">
            Try Again
          </button>
          <button mat-stroked-button (click)="goToPayPalAccounts()">
            Go Back
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .processing-state,
    .success-state,
    .error-state {
      background: white;
      padding: 48px 32px;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      text-align: center;
      max-width: 500px;
      width: 100%;
    }

    .processing-state h2,
    .success-state h2,
    .error-state h2 {
      margin: 24px 0 16px 0;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .processing-state p,
    .success-state p,
    .error-state p {
      margin: 0 0 24px 0;
      color: #666;
      line-height: 1.6;
    }

    .success-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #4caf50;
      margin-bottom: 16px;
    }

    .error-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #f44336;
      margin-bottom: 16px;
    }

    .account-info {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      margin: 24px 0;
      text-align: left;
    }

    .account-info p {
      margin: 8px 0;
      color: #333;
    }

    .actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 32px;
    }

    @media (max-width: 768px) {
      .actions {
        flex-direction: column;
      }
      
      .actions button {
        width: 100%;
      }
    }
  `]
})
export class PayPalCallbackComponent implements OnInit {
  processing = true;
  success = false;
  error = false;
  errorMessage = '';
  connectedAccount: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paypalService: PayPalService
  ) {}

  ngOnInit() {
    this.handleCallback();
  }

  private handleCallback() {
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      const state = params['state'];
      const error = params['error'];
      const errorDescription = params['error_description'];

      if (error) {
        this.handleError(errorDescription || error);
        return;
      }

      if (!code || !state) {
        this.handleError('Missing authorization code or state parameter');
        return;
      }

      // Connect the PayPal account
      this.paypalService.connectAccount({ code, state }).subscribe({
        next: (account) => {
          this.processing = false;
          this.success = true;
          this.connectedAccount = account;
          
          // Notify parent window if this is a popup
          if (window.opener) {
            window.opener.postMessage({
              type: 'PAYPAL_OAUTH_SUCCESS',
              code,
              state,
              account
            }, window.location.origin);
            window.close();
          }
        },
        error: (error) => {
          console.error('PayPal connection error:', error);
          this.handleError(error.error?.message || 'Failed to connect PayPal account');
          
          // Notify parent window of error if this is a popup
          if (window.opener) {
            window.opener.postMessage({
              type: 'PAYPAL_OAUTH_ERROR',
              error: error.error?.message || 'Failed to connect PayPal account'
            }, window.location.origin);
            window.close();
          }
        }
      });
    });
  }

  private handleError(message: string) {
    this.processing = false;
    this.error = true;
    this.errorMessage = message;
  }

  retry() {
    this.processing = true;
    this.error = false;
    this.success = false;
    this.handleCallback();
  }

  goToPayPalAccounts() {
    this.router.navigate(['/paypal-accounts']);
  }

  goToWithdrawals() {
    this.router.navigate(['/withdrawals']);
  }
}
