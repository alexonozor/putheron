import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

export interface User {
  _id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  user_mode?: 'client' | 'business_owner';
  is_active?: boolean;
  is_banned?: boolean;
  email_verified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  country_of_origin?: string;
  bio?: string;
  avatar_url?: string;
  ban_reason?: string;
}

export interface UserActivity {
  _id: string;
  user_id: string;
  action: string;
  description: string;
  type: string;
  timestamp: Date;
  created_at: Date;
  ip_address?: string;
  user_agent?: string;
}

export interface UserStats {
  totalBusinesses: number;
  totalTransactions: number;
  totalSpent: number;
  totalEarned: number;
  totalMessages: number;
  totalReviews: number;
  avgRating: number;
  lastLogin?: Date;
  accountAge: number; // in days
}

@Component({
  selector: 'app-admin-user-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-user-details.component.html',
  styleUrls: ['./admin-user-details.component.scss']
})
export class AdminUserDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);

  // Signals
  loading = signal(false);
  user = signal<User | null>(null);
  userStats = signal<UserStats>({
    totalBusinesses: 0,
    totalTransactions: 0,
    totalSpent: 0,
    totalEarned: 0,
    totalMessages: 0,
    totalReviews: 0,
    avgRating: 0,
    accountAge: 0
  });
  activities = signal<UserActivity[]>([]);
  editMode = signal(false);
  showDeleteModal = signal(false);

  // Form data
  editForm = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    city: '',
    state: '',
    country: '',
    user_mode: 'client' as 'client' | 'business_owner',
    is_active: true
  };

  // Computed
  userId = computed(() => this.route.snapshot.paramMap.get('id'));
  userInitials = computed(() => {
    const user = this.user();
    if (!user) return '';
    const first = user.first_name?.charAt(0).toUpperCase() || '';
    const last = user.last_name?.charAt(0).toUpperCase() || '';
    return first + last;
  });
  
  private apiUrl = `${environment.api.baseUrl}/admin`;

  Math = Math;

  ngOnInit() {
    const id = this.userId();
    if (id) {
      this.loadUserDetails(id);
      this.loadUserActivity(id);
    }
  }

  async loadUserDetails(userId: string) {
    this.loading.set(true);
    try {
      const response = await this.http.get<{ success: boolean; data: User }>(`${this.apiUrl}/users/${userId}`).toPromise();
      if (response && response.data) {
        this.user.set(response.data);
        this.setEditForm(response.data);
      }
    } catch (error) {
      console.error('Failed to load user details:', error);
      // Handle 404 - user not found
      if ((error as any)?.status === 404) {
        this.router.navigate(['/admin/dashboard/users']);
      }
    } finally {
      this.loading.set(false);
    }
  }

  async loadUserActivity(userId: string, limit: number = 20) {
    try {
      const response = await this.http.get<{ success: boolean; data: UserActivity[] }>(`${this.apiUrl}/users/${userId}/activity`).toPromise();
      if (response && response.data) {
        this.activities.set(response.data);
      }
    } catch (error) {
      console.error('Failed to load user activity:', error);
      // Set mock data for demo purposes
      const mockActivity: UserActivity[] = [
        {
          _id: '1',
          user_id: userId,
          action: 'Login',
          description: 'User logged in',
          type: 'login',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          created_at: new Date(Date.now() - 1000 * 60 * 30),
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        {
          _id: '2',
          user_id: userId,
          action: 'Profile Updated',
          description: 'User updated profile information',
          type: 'update',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2),
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        {
          _id: '3',
          user_id: userId,
          action: 'Business Created',
          description: 'User created a new business profile',
          type: 'business',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24),
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      ];
      this.activities.set(mockActivity);
    }
  }

  setEditForm(user: User) {
    this.editForm = {
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email,
      phone: user.phone || '',
      bio: user.bio || '',
      city: user.city || '',
      state: user.state || '',
      country: user.country || '',
      user_mode: user.user_mode || 'client',
      is_active: user.is_active !== undefined ? user.is_active : true
    };
  }

  toggleEditMode() {
    const user = this.user();
    if (!user) return;
    
    if (this.editMode()) {
      // Cancel edit - reset form
      this.setEditForm(user);
    }
    this.editMode.set(!this.editMode());
  }

  async saveUser() {
    const user = this.user();
    if (!user) return;

    this.loading.set(true);
    try {
      const response = await this.http.patch<{ success: boolean; data: User }>(`${this.apiUrl}/users/${user._id}/profile`, this.editForm).toPromise();
      if (response && response.data) {
        this.user.set(response.data);
        this.editMode.set(false);
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async toggleUserStatus() {
    const user = this.user();
    if (!user) return;

    const newStatus = !user.is_active;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (confirm(`Are you sure you want to ${action} this user?`)) {
      try {
        const response = await this.http.patch(`${this.apiUrl}/users/${user._id}/status`, { isActive: newStatus }).toPromise();
        if (response) {
          await this.loadUserDetails(user._id);
        }
      } catch (error) {
        console.error('Failed to update user status:', error);
      }
    }
  }

  async toggleBanUser() {
    const user = this.user();
    if (!user) return;

    const newStatus = !user.is_banned;
    const action = newStatus ? 'ban' : 'unban';
    
    let banReason = '';
    if (newStatus) {
      banReason = prompt('Enter ban reason:') || 'No reason provided';
    }
    
    if (confirm(`Are you sure you want to ${action} this user?`)) {
      try {
        const response = await this.http.patch(`${this.apiUrl}/users/${user._id}/ban`, { 
          isBanned: newStatus,
          banReason: newStatus ? banReason : undefined
        }).toPromise();
        if (response) {
          await this.loadUserDetails(user._id);
        }
      } catch (error) {
        console.error(`Failed to ${action} user:`, error);
      }
    }
  }

  async verifyUserEmail() {
    const user = this.user();
    if (!user || user.email_verified) return;

    if (confirm(`Manually verify email for ${user.email}?`)) {
      try {
        const response = await this.http.patch(`${this.apiUrl}/users/${user._id}/verify-email`, {}).toPromise();
        if (response) {
          await this.loadUserDetails(user._id);
          alert('Email verified successfully!');
        }
      } catch (error) {
        console.error('Failed to verify email:', error);
        alert('Failed to verify email.');
      }
    }
  }

  confirmDelete() {
    this.showDeleteModal.set(true);
  }

  cancelDelete() {
    this.showDeleteModal.set(false);
  }

  async deleteUser() {
    const user = this.user();
    if (!user) return;

    this.loading.set(true);
    try {
      await this.http.delete(`${this.apiUrl}/users/${user._id}`).toPromise();
      this.router.navigate(['/admin/dashboard/users']);
    } catch (error) {
      console.error('Failed to delete user:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async sendPasswordReset() {
    const user = this.user();
    if (!user) return;

    if (confirm(`Send password reset email to ${user.email}?`)) {
      try {
        const response = await this.http.patch(`${this.apiUrl}/users/${user._id}/reset-password`, {}).toPromise();
        if (response) {
          alert('Password reset email sent successfully!');
        }
      } catch (error) {
        console.error('Failed to send password reset:', error);
        alert('Failed to send password reset email.');
      }
    }
  }

  async resendVerificationEmail() {
    const user = this.user();
    if (!user || user.email_verified) return;

    if (confirm(`Send verification email to ${user.email}?`)) {
      try {
        const response = await this.http.patch(`${this.apiUrl}/users/${user._id}/verify-email`, {}).toPromise();
        if (response) {
          await this.loadUserDetails(user._id);
          alert('Verification email sent successfully!');
        }
      } catch (error) {
        console.error('Failed to send verification email:', error);
        alert('Failed to send verification email.');
      }
    }
  }

  goBack() {
    this.router.navigate(['/admin/dashboard/users']);
  }

  getRoleDisplay(userMode: string): string {
    const roleMap: Record<string, string> = {
      'client': 'Customer',
      'business_owner': 'Business Owner'
    };
    return roleMap[userMode] || userMode;
  }

  getRoleBadgeClass(userMode: string): string {
    const classMap: Record<string, string> = {
      'client': 'bg-blue-100 text-blue-800',
      'business_owner': 'bg-green-100 text-green-800'
    };
    return classMap[userMode] || 'bg-gray-100 text-gray-800';
  }

  getStatusDisplay(user: User): string {
    if (user.is_banned) return 'Banned';
    if (!user.is_active) return 'Inactive';
    return 'Active';
  }

  getStatusBadgeClass(user: User): string {
    if (user.is_banned) return 'bg-red-100 text-red-800';
    if (!user.is_active) return 'bg-gray-100 text-gray-800';
    return 'bg-green-100 text-green-800';
  }

  getActivityIcon(action: string): string {
    const iconMap: Record<string, string> = {
      'Login': 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1',
      'Logout': 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
      'Profile Updated': 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      'Password Changed': 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
      'Business Created': 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
    };
    return iconMap[action] || 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
  }

  getActivityColor(action: string): string {
    const colorMap: Record<string, string> = {
      'Login': 'text-green-600 bg-green-100',
      'Logout': 'text-red-600 bg-red-100',
      'Profile Updated': 'text-blue-600 bg-blue-100',
      'Password Changed': 'text-purple-600 bg-purple-100',
      'Business Created': 'text-indigo-600 bg-indigo-100'
    };
    return colorMap[action] || 'text-gray-600 bg-gray-100';
  }

  formatAccountAge(createdAt?: string): string {
    if (!createdAt) return 'Unknown';
    
    const created = new Date(createdAt);
    const now = new Date();
    const days = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days < 30) {
      return days + ' days';
    } else if (days < 365) {
      return Math.floor(days / 30) + ' months';
    } else {
      return Math.floor(days / 365) + ' years';
    }
  }

  getUserStatusColor(): string {
    const user = this.user();
    if (!user) return 'bg-gray-400';
    
    if (user.is_banned) return 'bg-red-500';
    if (user.is_active) return 'bg-green-500';
    return 'bg-gray-400';
  }

  getFullName(user: User): string {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return 'No name provided';
  }
}
