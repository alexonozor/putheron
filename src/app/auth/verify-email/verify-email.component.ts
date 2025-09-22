import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../shared/services';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Signals for component state
  readonly verifying = signal(true);
  readonly success = signal(false);
  readonly error = signal('');
  readonly userEmail = signal('');

  async ngOnInit() {
    // Get token from URL
    this.route.queryParams.subscribe(async params => {
      const token = params['token'];
      if (token) {
        await this.verifyEmail(token);
      } else {
        this.verifying.set(false);
        this.error.set('Invalid verification link. Please request a new verification email.');
      }
    });
  }

  private async verifyEmail(token: string) {
    try {
      const response = await this.authService.verifyEmail(token);
      
      if (response.success) {
        this.success.set(true);
        this.userEmail.set(response.data?.user?.email || '');
        
        // Redirect to login after 5 seconds
        setTimeout(() => {
          this.router.navigate(['/auth/login'], { 
            queryParams: { message: 'Email verified successfully! Please log in to your account.' }
          });
        }, 5000);
      } else {
        this.error.set(response.message || 'Verification failed. Please try again.');
      }
    } catch (error: any) {
      this.error.set(error?.message || 'Verification failed. The link may be invalid or expired.');
    } finally {
      this.verifying.set(false);
    }
  }

  async resendVerification() {
    if (!this.userEmail()) {
      this.error.set('Unable to resend verification. Please try registering again.');
      return;
    }

    try {
      const response = await this.authService.resendEmailVerification(this.userEmail());
      
      if (response.success) {
        this.router.navigate(['/auth/signup'], { 
          queryParams: { 
            message: 'Verification email sent. Please check your inbox.',
            email: this.userEmail()
          }
        });
      }
    } catch (error: any) {
      this.error.set(error?.message || 'Failed to resend verification email.');
    }
  }

  goToSignup() {
    this.router.navigate(['/auth/signup']);
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}