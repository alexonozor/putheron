import { Component, signal, inject, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { AuthService } from '../shared/services';
import { RegisterRequest } from '../models';
import { COUNTRIES } from '../shared/data/countries';
import { USCitiesService, USCity } from '../shared/services/us-cities.service';
import { PhoneValidators } from '../shared/validators/phone.validator';
import { PhoneFormatDirective } from '../shared/directives/phone-format.directive';
import { US_STATES } from '../shared/data/us-states';
import { HeaderComponent } from '../shared/components/header/header.component';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    HeaderComponent,
    PhoneFormatDirective
  ],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly citiesService = inject(USCitiesService);

  // Signals for component state
  readonly isSignUp = signal(false);
  readonly error = signal('');
  readonly successMessage = signal('');
  readonly authMessage = signal('');
  readonly filteredCities = signal<USCity[]>([]);
  readonly availableCities = signal<USCity[]>([]);
  
  // Password visibility signals
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  // Reactive form
  readonly authForm: FormGroup;
  
  // Countries list for country selector
  readonly countries = COUNTRIES;
  readonly usStates = US_STATES;

  // Computed signals
  readonly loading = this.authService.loading;
  readonly isFormValid = computed(() => this.authForm?.valid ?? false);

  constructor() {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      firstName: [''], // Will be required conditionally
      lastName: [''], // Will be required conditionally
      phone: [''], // Will be required conditionally
      city: [''], // Will be required conditionally
      state: [''], // Will be required conditionally
      countryOfOrigin: [''], // Will be required conditionally
      userType: ['buyer'] // Default to buyer
    });

    // Update validation based on isSignUp
    effect(() => {
      const firstNameControl = this.authForm.get('firstName');
      const lastNameControl = this.authForm.get('lastName');
      const phoneControl = this.authForm.get('phone');
      const cityControl = this.authForm.get('city');
      const stateControl = this.authForm.get('state');
      const countryOfOriginControl = this.authForm.get('countryOfOrigin');
      const userTypeControl = this.authForm.get('userType');
      
      if (this.isSignUp()) {
        firstNameControl?.setValidators([Validators.required]);
        lastNameControl?.setValidators([Validators.required]);
        phoneControl?.setValidators([Validators.required, PhoneValidators.usaPhone()]);
        cityControl?.setValidators([Validators.required]);
        stateControl?.setValidators([Validators.required]);
        countryOfOriginControl?.setValidators([Validators.required]);
        userTypeControl?.setValidators([Validators.required]);
      } else {
        firstNameControl?.clearValidators();
        lastNameControl?.clearValidators();
        phoneControl?.clearValidators();
        cityControl?.clearValidators();
        stateControl?.clearValidators();
        countryOfOriginControl?.clearValidators();
        userTypeControl?.clearValidators();
      }
      
      firstNameControl?.updateValueAndValidity();
      lastNameControl?.updateValueAndValidity();
      phoneControl?.updateValueAndValidity();
      cityControl?.updateValueAndValidity();
      stateControl?.updateValueAndValidity();
      countryOfOriginControl?.updateValueAndValidity();
      userTypeControl?.updateValueAndValidity();
    });
  }

  // Form control getters for template
  get firstNameControl() { return this.authForm.get('firstName'); }
  get lastNameControl() { return this.authForm.get('lastName'); }
  get phoneControl() { return this.authForm.get('phone'); }
  get cityControl() { return this.authForm.get('city'); }
  get stateControl() { return this.authForm.get('state'); }
  get countryOfOriginControl() { return this.authForm.get('countryOfOrigin'); }

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

  onCityInput(value: string) {
    const cities = this.citiesService.searchCities(value);
    this.filteredCities.set(cities);
  }

  onCitySelected(city: USCity) {
    this.authForm.patchValue({
      city: city.name,
      state: city.stateCode
    });
    this.filteredCities.set([]);
  }

  onStateSelected(stateCode: string, preserveCity: boolean = false) {
    if (stateCode) {
      const cities = this.citiesService.getCitiesByState(stateCode);
      this.availableCities.set(cities);
      // Only clear city when state changes if not preserving existing city
      if (!preserveCity) {
        this.authForm.patchValue({ city: '' });
      }
    } else {
      this.availableCities.set([]);
    }
  }

  displayCity(city: USCity): string {
    return city ? city.name : '';
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

    const { email, password, firstName, lastName, phone, city, state, countryOfOrigin, userType } = this.authForm.value;

    try {
      if (this.isSignUp()) {
        const registerData: RegisterRequest = {
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          city: city,
          state: state,
          country: 'USA',
          country_of_origin: countryOfOrigin,
          is_buyer: userType === 'buyer',
          is_seller: userType === 'seller'
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
          this.successMessage.set('Successfully signed in!');
          
          // Wait a moment for the auth state to fully update
          setTimeout(() => {
            // Check for return URL
            const returnUrl = sessionStorage.getItem('returnUrl');
            if (returnUrl) {
              sessionStorage.removeItem('returnUrl');
              this.router.navigate([returnUrl]);
            } else {
              this.router.navigate(['/dashboard']);
            }
          }, 100);
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

  // Password visibility toggle methods
  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  // Getters for template convenience
  get emailControl() { return this.authForm.get('email'); }
  get passwordControl() { return this.authForm.get('password'); }
}
