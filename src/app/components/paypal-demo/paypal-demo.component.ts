import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-paypal-demo',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  template: `
    <div class="demo-container">
      <mat-card class="demo-card">
        <mat-card-header>
          <mat-card-title>PayPal Withdrawal System Demo</mat-card-title>
          <mat-card-subtitle>Test the complete PayPal integration</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="demo-steps">
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-content">
                <h3>Connect PayPal Account</h3>
                <p>First, connect your PayPal account using OAuth</p>
                <button mat-raised-button color="primary" (click)="goToPayPalAccounts()">
                  <mat-icon>account_balance_wallet</mat-icon>
                  Connect PayPal
                </button>
              </div>
            </div>

            <div class="step">
              <div class="step-number">2</div>
              <div class="step-content">
                <h3>Create Withdrawal</h3>
                <p>Once connected, create a withdrawal request</p>
                <button mat-stroked-button (click)="goToWithdrawals()">
                  <mat-icon>send</mat-icon>
                  Create Withdrawal
                </button>
              </div>
            </div>

            <div class="step">
              <div class="step-number">3</div>
              <div class="step-content">
                <h3>Track Status</h3>
                <p>Monitor your withdrawal status in real-time</p>
                <button mat-stroked-button (click)="goToWithdrawals()">
                  <mat-icon>history</mat-icon>
                  View History
                </button>
              </div>
            </div>
          </div>

          <div class="features">
            <h3>Features Included:</h3>
            <ul>
              <li>✅ PayPal OAuth Integration</li>
              <li>✅ Secure Account Connection</li>
              <li>✅ Real-time Fee Calculation (3%)</li>
              <li>✅ Withdrawal Status Tracking</li>
              <li>✅ Balance Validation</li>
              <li>✅ Transaction History</li>
              <li>✅ Error Handling & Recovery</li>
              <li>✅ Mobile Responsive Design</li>
            </ul>
          </div>
        </mat-card-content>

        <mat-card-actions>
          <button mat-raised-button color="accent" (click)="goToPayPalAccounts()">
            Get Started
          </button>
          <button mat-button (click)="goToDashboard()">
            Back to Dashboard
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .demo-container {
      max-width: 800px;
      margin: 48px auto;
      padding: 24px;
    }

    .demo-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .demo-card mat-card-title,
    .demo-card mat-card-subtitle {
      color: white;
    }

    .demo-steps {
      margin: 32px 0;
    }

    .step {
      display: flex;
      align-items: flex-start;
      margin-bottom: 32px;
    }

    .step-number {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      margin-right: 24px;
    }

    .step-content h3 {
      margin: 0 0 8px 0;
      font-size: 1.2rem;
    }

    .step-content p {
      margin: 0 0 16px 0;
      opacity: 0.9;
    }

    .features {
      background: rgba(255, 255, 255, 0.1);
      padding: 24px;
      border-radius: 8px;
      margin-top: 32px;
    }

    .features h3 {
      margin: 0 0 16px 0;
    }

    .features ul {
      margin: 0;
      padding-left: 20px;
    }

    .features li {
      margin-bottom: 8px;
      opacity: 0.9;
    }

    @media (max-width: 768px) {
      .step {
        flex-direction: column;
        text-align: center;
      }
      
      .step-number {
        margin: 0 auto 16px auto;
      }
    }
  `]
})
export class PayPalDemoComponent {
  constructor(private router: Router) {}

  goToPayPalAccounts() {
    this.router.navigate(['/paypal-accounts']);
  }

  goToWithdrawals() {
    this.router.navigate(['/withdrawals']);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
