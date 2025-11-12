import { Component, ViewChild, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HeaderComponent } from '../shared/components/header/header.component';
import { FooterComponent } from '../shared/components/footer/footer.component';
import { UserSidenavComponent } from '../shared/components/user-sidenav/user-sidenav.component';
import { GuestSidenavComponent } from '../shared/components/guest-sidenav/guest-sidenav.component';
import { AuthService } from '../shared/services/auth.service';
import { ContactService } from '../shared/services/contact.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatSnackBarModule,
    HeaderComponent,
    FooterComponent,
    UserSidenavComponent,
    GuestSidenavComponent
  ],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private contactService = inject(ContactService);
  private snackBar = inject(MatSnackBar);

  @ViewChild('drawer') drawer: any;

  currentUser = computed(() => {
    return this.authService.user();
  });

  contactForm: FormGroup;
  submitted = false;
  loading = signal(false);

  constructor() {
    this.contactForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required]
    });
  }

  onSubmit() {
    this.submitted = true;
    
    if (this.contactForm.valid) {
      this.loading.set(true);

      const contactData = {
        first_name: this.contactForm.value.firstName,
        last_name: this.contactForm.value.lastName,
        email: this.contactForm.value.email,
        subject: this.contactForm.value.subject,
        message: this.contactForm.value.message
      };

      this.contactService.createContact(contactData).subscribe({
        next: (response) => {
          this.loading.set(false);
          this.snackBar.open(
            response.message || 'Thank you for contacting us! We will get back to you soon.',
            'Close',
            {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            }
          );
          this.contactForm.reset();
          this.submitted = false;
          // Reset validation state
          Object.keys(this.contactForm.controls).forEach(key => {
            this.contactForm.controls[key].setErrors(null);
            this.contactForm.controls[key].markAsUntouched();
            this.contactForm.controls[key].markAsPristine();
          });
        },
        error: (error) => {
          this.loading.set(false);
          this.snackBar.open(
            error.error?.message || 'Failed to send message. Please try again.',
            'Close',
            {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            }
          );
        }
      });
    }
  }

  get f() {
    return this.contactForm.controls;
  }
}
