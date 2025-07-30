import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../services/auth.service';
import { NotificationNavComponent } from '../notification-nav.component';

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
  private readonly router = inject(Router);

  readonly user = this.authService.user;
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly showMobileMenu = signal(false);

  // Mock data for messages count
  readonly messageCount = signal(3);

  // Get user initials for display
  getUserInitials(): string {
    const user = this.user();
    if (!user) return '';
    
    // Handle full_name (split into first and last) or use individual names
    if (user.full_name) {
      const names = user.full_name.split(' ');
      const firstInitial = names[0]?.charAt(0).toUpperCase() || '';
      const lastInitial = names[names.length - 1]?.charAt(0).toUpperCase() || '';
      return firstInitial + lastInitial;
    }
    
    const lastName = user.last_name || '';
    const lastInitial = lastName.charAt(0).toUpperCase();
    
    // If we have last_name, use email first letter + last_name first letter
    if (lastInitial) {
      const emailInitial = user.email.charAt(0).toUpperCase();
      return emailInitial + lastInitial;
    }
    
    // Fallback to just email initial
    return user.email.charAt(0).toUpperCase();
  }

  getUserFullName(): string {
    const user = this.user();
    if (!user) return '';
    
    // Use full_name if available, otherwise use last_name or email
    if (user.full_name) {
      return user.full_name;
    }
    
    const lastName = user.last_name || '';
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

  toggleMobileMenu() {
    this.showMobileMenu.update(current => !current);
  }

  async signOut() {
    await this.authService.signOut();
    this.router.navigate(['/']);
  }
}