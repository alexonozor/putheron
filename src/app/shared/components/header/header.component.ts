import { Component, inject, signal, computed, effect, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../services/auth.service';
import { AuthorizationService } from '../../services/authorization.service';
import { NotificationNavComponent } from '../notification-nav/notification-nav.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    NotificationNavComponent
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly authorizationService = inject(AuthorizationService);
  private readonly router = inject(Router);

  // Input properties
  @Input() showMobileMenuButton = false;
  @Input() isAdminMode = false;
  @Input() isDashboardMode = false;

  // Output events
  @Output() menuToggle = new EventEmitter<void>();

  readonly user = this.authService.user;
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly showMobileMenu = signal(false);

  // Mock data for messages count
  readonly messageCount = signal(3);

  // Get current user mode as computed signal
  readonly userMode = computed(() => {
    const user = this.user();
    return user?.user_mode || 'client';
  });

  // Check if user is a business owner as computed signal
  readonly isBusinessOwner = computed(() => {
    return this.userMode() === 'business_owner';
  });

  // Check if user has admin access - use authorization service computed signal
  readonly hasAdminAccess = computed(() => {
    return this.authorizationService.hasAdminAccess();
  });

  constructor() {
    // Add effect to debug signal changes
    effect(() => {
      const user = this.user();
      const mode = this.userMode();
      const isBusiness = this.isBusinessOwner();
      console.log('Header signals updated:', { user: user?.email, mode, isBusiness });
    });
  }

  // Get user initials for display
  getUserInitials(): string {
    const user = this.user();
    if (!user) return '';
    
    // Handle first_name and last_name
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    
    if (firstName && lastName) {
      return firstName.charAt(0).toUpperCase() + lastName.charAt(0).toUpperCase();
    }
    
    if (firstName) {
      return firstName.charAt(0).toUpperCase() + (user.email.charAt(0).toUpperCase() || '');
    }
    
    if (lastName) {
      const emailInitial = user.email.charAt(0).toUpperCase();
      return emailInitial + lastName.charAt(0).toUpperCase();
    }
    
    // Fallback to just email initial
    return user.email.charAt(0).toUpperCase();
  }

  getUserFullName(): string {
    const user = this.user();
    if (!user) return '';
    
    // Use first_name and last_name if available
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    if (firstName) {
      return firstName;
    }
    
    if (lastName) {
      return lastName;
    }
    
    return user.email;
  }

  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  navigateToProfile() {
    this.router.navigate(['/dashboard/profile']);
  }

  navigateToSettings() {
    this.router.navigate(['/dashboard/settings']);
  }

  navigateToMessages() {
    this.router.navigate(['/dashboard/messages']);
  }

  navigateToAdmin() {
    this.router.navigate(['/admin']);
  }

  navigateToCreateBusiness() {
    this.router.navigate(['/dashboard/businesses/create-business']);
  }

  navigateToOwnBusiness() {
    // Navigate to the new own-business page
    this.router.navigate(['/own-business']);
  }

  navigateToBecomeBusiness() {
    // If not logged in, go to auth page with business mode
    this.router.navigate(['/auth'], { queryParams: { mode: 'business' } });
  }

  async switchToBusinessMode() {
    // Call API to switch user mode to business_owner
    try {
      const result = await this.authService.switchMode('business_owner');
      if (result.data) {
        console.log('Switched to business owner mode successfully');
        console.log('Updated user mode:', this.userMode());
        // Navigate to dashboard instead of create business page
        this.navigateToDashboard();
      } else {
        console.error('Failed to switch to business mode:', result.error);
      }
    } catch (error) {
      console.error('Error switching to business mode:', error);
    }
  }

  async switchToClientMode() {
    // Call API to switch user mode to client
    try {
      const result = await this.authService.switchMode('client');
      if (result.data) {
        console.log('Switched to client mode successfully');
        console.log('Updated user mode:', this.userMode());
        // Navigate to search page
        this.router.navigate(['/search']);
      } else {
        console.error('Failed to switch to client mode:', result.error);
      }
    } catch (error) {
      console.error('Error switching to client mode:', error);
    }
  }

  toggleMobileMenu() {
    this.showMobileMenu.update(current => !current);
  }

  onMenuToggle() {
    this.menuToggle.emit();
  }

  async signOut() {
    await this.authService.signOut();
    // Navigation is handled by the auth service
  }
}