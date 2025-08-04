import { Component, signal, inject, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../shared/services';
import { RegisterRequest } from '../models';
import { COUNTRIES } from '../shared/data/countries';

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
  
  // Countries list for country selector
  readonly countries = COUNTRIES;

  // Computed signals
  readonly loading = this.authService.loading;
  readonly isFormValid = computed(() => this.authForm?.valid ?? false);

  constructor() {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      firstName: [''], // Will be required conditionally
      lastName: [''], // Optional
      countryOfOrigin: [''], // Will be required conditionally
      isBuyer: [true], // Default to buyer
      isSeller: [false]
    });

    // Update firstName and countryOfOrigin validation based on isSignUp
    effect(() => {
      const firstNameControl = this.authForm.get('firstName');
      const countryOfOriginControl = this.authForm.get('countryOfOrigin');
      
      if (this.isSignUp()) {
        firstNameControl?.setValidators([Validators.required]);
        countryOfOriginControl?.setValidators([Validators.required]);
      } else {
        firstNameControl?.clearValidators();
        countryOfOriginControl?.clearValidators();
      }
      firstNameControl?.updateValueAndValidity();
      countryOfOriginControl?.updateValueAndValidity();
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

    const { email, password, firstName, lastName, countryOfOrigin, isBuyer, isSeller } = this.authForm.value;

    try {
      if (this.isSignUp()) {
        const registerData: RegisterRequest = {
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          country_of_origin: countryOfOrigin,
          is_buyer: isBuyer || true,
          is_seller: isSeller || false
        };
        
        const { data, error } = await this.authService.signUp(registerData);
        
        if (error) {
          this.error.set(error.message);
        } else {
          this.successMessage.set('Account created successfully! You are now logged in.');
          // Redirect to dashboard after successful registration
          this.router.navigate(['/dashboard']);
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

    // For now, just show a message that password reset is not implemented
    this.successMessage.set('Password reset functionality will be available soon. Please contact support if needed.');
  }

  private clearMessages() {
    this.error.set('');
    this.successMessage.set('');
  }

  // Getters for template convenience
  get emailControl() { return this.authForm.get('email'); }
  get passwordControl() { return this.authForm.get('password'); }
  get firstNameControl() { return this.authForm.get('firstName'); }
  get countryOfOriginControl() { return this.authForm.get('countryOfOrigin'); }
}
