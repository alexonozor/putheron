import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { StripeConnectService } from '../../shared/services/stripe-connect.service';

@Component({
  selector: 'app-stripe-callback',
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
        <h2>Verifying Stripe Account</h2>
        <p>Please wait while we verify your Stripe account setup...</p>
      </div>

      <!-- Success State -->
      <div *ngIf="success && !processing" class="success-state">
        <mat-icon class="success-icon">check_circle</mat-icon>
        <h2>Stripe Account Connected Successfully!</h2>
        <p>Your Stripe account has been set up and is ready for withdrawals.</p>
        
        <div class="actions">
          <button mat-raised-button color="primary" (click)="goToEarnings()">
            View Earnings
          </button>
          <button mat-button (click)="goToDashboard()">
            Back to Dashboard
          </button>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="error && !processing" class="error-state">
        <mat-icon class="error-icon">error</mat-icon>
        <h2>Setup Incomplete</h2>
        <p>{{ errorMessage }}</p>
        
        <div class="actions">
          <button mat-raised-button color="warn" (click)="retrySetup()">
            Try Again
          </button>
          <button mat-button (click)="goToDashboard()">
            Back to Dashboard
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
      background: #f5f5f5;
    }

    .processing-state,
    .success-state,
    .error-state {
      text-align: center;
      max-width: 400px;
      padding: 48px 32px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .success-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #4caf50;
      margin-bottom: 24px;
    }

    .error-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #f44336;
      margin-bottom: 24px;
    }

    h2 {
      margin: 16px 0;
      color: #333;
    }

    p {
      margin: 16px 0;
      color: #666;
      line-height: 1.5;
    }

    .actions {
      margin-top: 32px;
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }

    mat-spinner {
      margin-bottom: 24px;
    }

    @media (max-width: 768px) {
      .processing-state,
      .success-state,
      .error-state {
        padding: 32px 24px;
        margin: 16px;
      }

      .actions {
        flex-direction: column;
        align-items: center;
      }

      .actions button {
        width: 100%;
        max-width: 200px;
      }
    }
  `]
})
export class StripeCallbackComponent implements OnInit {
  processing = true;
  success = false;
  error = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stripeConnectService: StripeConnectService
  ) {}

  async ngOnInit() {
    // Check for return parameters
    this.route.queryParams.subscribe(async (params) => {
      if (params['success'] === 'true') {
        await this.handleSuccess();
      } else if (params['success'] === 'false') {
        await this.handleError();
      } else {
        // No specific parameters, check account status
        await this.checkAccountStatus();
      }
    });
  }

  private async handleSuccess() {
    try {
      // Verify the account status
      const status = await this.stripeConnectService.getAccountStatus().toPromise();
      
      if (status?.payouts_enabled && !status?.requirements_due) {
        this.processing = false;
        this.success = true;
      } else {
        this.processing = false;
        this.error = true;
        this.errorMessage = 'Account setup is not yet complete. Please try the onboarding process again.';
      }
    } catch (err) {
      this.processing = false;
      this.error = true;
      this.errorMessage = 'Failed to verify account status. Please try again.';
    }
  }

  private async handleError() {
    this.processing = false;
    this.error = true;
    this.errorMessage = 'Account setup was not completed. You can try setting up your Stripe account again.';
  }

  private async checkAccountStatus() {
    try {
      const status = await this.stripeConnectService.getAccountStatus().toPromise();
      
      if (status?.payouts_enabled && !status?.requirements_due) {
        this.processing = false;
        this.success = true;
      } else {
        this.processing = false;
        this.error = true;
        this.errorMessage = 'Account setup is incomplete. Please complete the onboarding process.';
      }
    } catch (err) {
      this.processing = false;
      this.error = true;
      this.errorMessage = 'Failed to check account status. Please try again.';
    }
  }

  async retrySetup() {
    try {
      this.processing = true;
      const response = await this.stripeConnectService.createOnboardingLink().toPromise();
      window.location.href = response!.url;
    } catch (err) {
      this.processing = false;
      this.errorMessage = 'Failed to create setup link. Please try again later.';
    }
  }

  goToEarnings() {
    this.router.navigate(['/dashboard/earnings']);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
