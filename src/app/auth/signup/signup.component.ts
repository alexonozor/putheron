import { Component, signal, inject, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../shared/services';
import { RegisterRequest } from '../../shared/models';
import { COUNTRIES } from '../../shared/data/countries';
import { USCitiesService, USCity } from '../../shared/services/us-cities.service';
import { PhoneValidators } from '../../shared/validators/phone.validator';
import { PhoneFormatDirective } from '../../shared/directives/phone-format.directive';
import { US_STATES } from '../../shared/data/us-states';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    PhoneFormatDirective
  ],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly citiesService = inject(USCitiesService);
  private readonly snackBar = inject(MatSnackBar);

  // Signals for component state
  readonly filteredCities = signal<USCity[]>([]);
  readonly availableCities = signal<USCity[]>([]);
  readonly loading = signal(false);
  readonly showPassword = signal(false);
  readonly showVerificationStep = signal(false);
  readonly verificationEmail = signal('');

  // Reactive form
  readonly signupForm: FormGroup;

  // Data
  readonly countries = COUNTRIES;
  readonly usStates = US_STATES;

  constructor() {
    this.signupForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      phone: ['', [Validators.required, PhoneValidators.usaPhone]],
      state: ['', [Validators.required]],
      city: ['', [Validators.required]],
      userType: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      countryOfOrigin: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      agreeToTerms: [false, [Validators.requiredTrue]]
    });

    // Effect to load cities when state changes
    effect(() => {
      const stateCode = this.stateControl?.value;
      if (stateCode) {
        this.loadCitiesForState(stateCode);
      } else {
        this.availableCities.set([]);
      }
    });
  }

  ngOnInit() {
    // Check for any query parameters or success messages
    this.route.queryParams.subscribe(params => {
      if (params['message']) {
        this.snackBar.open(params['message'], 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snackbar-info']
        });
      }
    });
  }

  async onSubmit() {
    if (!this.signupForm.valid) {
      this.snackBar.open('Please fill in all required fields correctly', 'Close', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['snackbar-error']
      });
      return;
    }

    const formData = this.signupForm.value;
    const registerRequest: RegisterRequest = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      state: formData.state,
      city: formData.city,
      country_of_origin: formData.countryOfOrigin,
      is_buyer: formData.userType === 'buyer',
      is_seller: formData.userType === 'seller'
    };

    this.loading.set(true);

    try {
      const response = await this.authService.signUp(registerRequest);
      
      if (response.data) {
        this.snackBar.open('Account created successfully! Please check your email to verify your account.', 'Close', {
          duration: 6000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snackbar-success']
        });
        
        // Redirect to login page after successful signup (user needs to verify email first)
        setTimeout(() => {
          this.router.navigate(['/auth/login'], { 
            queryParams: { message: 'Please verify your email and then login' } 
          });
        }, 1500);
      } else {
        this.snackBar.open(response.error?.message || 'Registration failed. Please try again.', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
      }
    } catch (error: any) {
      this.snackBar.open(error?.message || 'An unexpected error occurred. Please try again.', 'Close', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['snackbar-error']
      });
    } finally {
      this.loading.set(false);
    }
  }

  private showVerificationMessage(email: string) {
    // Store email for potential resend functionality
    this.verificationEmail.set(email);
    this.showVerificationStep.set(true);
    
    // Disable the form
    this.signupForm.disable();
  }

  async resendVerification() {
    if (!this.verificationEmail()) return;

    this.loading.set(true);
    try {
      const response = await this.authService.resendEmailVerification(this.verificationEmail());
      
      if (response.success) {
        this.snackBar.open('Verification email sent! Please check your inbox.', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snackbar-success']
        });
      } else {
        this.snackBar.open(response.message || 'Failed to resend verification email.', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
      }
    } catch (error: any) {
      this.snackBar.open(error?.message || 'Failed to resend verification email.', 'Close', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['snackbar-error']
      });
    } finally {
      this.loading.set(false);
    }
  }

  onStateSelected(stateCode: string) {
    this.loadCitiesForState(stateCode);
    // Reset city selection when state changes
    this.signupForm.get('city')?.setValue('');
  }

  private loadCitiesForState(stateCode: string) {
    const cities = this.citiesService.getCitiesByState(stateCode);
    this.availableCities.set(cities);
  }

  togglePasswordVisibility() {
    this.showPassword.update(current => !current);
  }

  // Getters for template convenience
  get firstNameControl() { return this.signupForm.get('firstName'); }
  get lastNameControl() { return this.signupForm.get('lastName'); }
  get phoneControl() { return this.signupForm.get('phone'); }
  get stateControl() { return this.signupForm.get('state'); }
  get cityControl() { return this.signupForm.get('city'); }
  get userTypeControl() { return this.signupForm.get('userType'); }
  get emailControl() { return this.signupForm.get('email'); }
  get countryOfOriginControl() { return this.signupForm.get('countryOfOrigin'); }
  get passwordControl() { return this.signupForm.get('password'); }
  get agreeToTermsControl() { return this.signupForm.get('agreeToTerms'); }
}
