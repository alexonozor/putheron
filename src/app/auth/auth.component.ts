import { Component, signal, inject, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  // Signals for component state
  readonly isSignUp = signal(false);
  readonly error = signal('');
  readonly successMessage = signal('');
  readonly authMessage = signal('');

  // Reactive form
  readonly authForm: FormGroup;

  // Computed signals
  readonly loading = this.authService.loading;
  readonly isFormValid = computed(() => this.authForm?.valid ?? false);

  constructor() {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      fullName: [''] // Will be required conditionally
    });

    // Update fullName validation based on isSignUp
    effect(() => {
      const fullNameControl = this.authForm.get('fullName');
      if (this.isSignUp()) {
        fullNameControl?.setValidators([Validators.required]);
      } else {
        fullNameControl?.clearValidators();
      }
      fullNameControl?.updateValueAndValidity();
    });
  }

  ngOnInit() {
    // Check for query parameters
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'login') {
        this.isSignUp.set(false);
      } else if (params['action'] === 'signup') {
        this.isSignUp.set(true);
      }
      
      if (params['message']) {
        this.authMessage.set(params['message']);
      }
    });
  }

  toggleMode() {
    this.isSignUp.update(current => !current);
    this.clearMessages();
    this.authForm.reset();
  }

  async onSubmit() {
    this.clearMessages();
    
    if (!this.authForm.valid) {
      this.error.set('Please fill in all required fields correctly');
      return;
    }

    const { email, password, fullName } = this.authForm.value;

    try {
      if (this.isSignUp()) {
        const { data, error } = await this.authService.signUp(email, password, fullName);
        
        if (error) {
          this.error.set(error.message);
        } else {
          this.successMessage.set('Account created successfully! Please check your email to verify your account.');
        }
      } else {
        const { data, error } = await this.authService.signIn(email, password);
        
        if (error) {
          this.error.set(error.message);
        } else {
          // Check for return URL
          const returnUrl = sessionStorage.getItem('returnUrl');
          if (returnUrl) {
            sessionStorage.removeItem('returnUrl');
            this.router.navigate([returnUrl]);
          } else {
            this.router.navigate(['/dashboard']);
          }
        }
      }
    } catch (err: any) {
      this.error.set(err?.message || 'An unexpected error occurred');
    }
  }

  async resetPassword() {
    this.clearMessages();
    
    const email = this.authForm.get('email')?.value;
    if (!email) {
      this.error.set('Please enter your email address');
      return;
    }

    try {
      const { error } = await this.authService.resetPassword(email);
      if (error) {
        this.error.set(error.message);
      } else {
        this.successMessage.set('Password reset email sent! Check your inbox.');
      }
    } catch (err: any) {
      this.error.set(err?.message || 'An unexpected error occurred');
    }
  }

  private clearMessages() {
    this.error.set('');
    this.successMessage.set('');
  }

  // Getters for template convenience
  get emailControl() { return this.authForm.get('email'); }
  get passwordControl() { return this.authForm.get('password'); }
  get fullNameControl() { return this.authForm.get('fullName'); }
}
