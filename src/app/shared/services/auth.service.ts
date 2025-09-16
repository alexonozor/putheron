import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { 
  User, 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  UpdateUserRequest,
  UserResponse 
} from '../../models/user.model';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly config = inject(ConfigService);
  
  private readonly API_URL = this.config.apiBaseUrl;
  private readonly TOKEN_KEY = this.config.tokenKey;
  private readonly USER_KEY = this.config.userKey;
  
  // Signals for state management
  readonly loading = signal<boolean>(false);
  
  // User state
  private userSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  private tokenSubject = new BehaviorSubject<string | null>(this.getTokenFromStorage());
  
  readonly user$ = this.userSubject.asObservable();
  readonly token$ = this.tokenSubject.asObservable();
  readonly isAuthenticated$ = this.user$.pipe(map(user => !!user));
  
  // Reactive signals
  private _user = signal<User | null>(this.getUserFromStorage());
  private _isAuthenticated = signal<boolean>(!!this.getUserFromStorage());
  
  // Computed signals
  readonly user = computed(() => this._user());
  readonly isAuthenticated = computed(() => this._isAuthenticated());
  
  // Legacy properties for backward compatibility
  get currentUser() {
    return this._user();
  }

  get loading$() {
    return of(this.loading());
  }

  private getTokenFromStorage(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  private getUserFromStorage(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  private setAuthData(token: string, user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
    // Update both BehaviorSubject and signals
    this.tokenSubject.next(token);
    this.userSubject.next(user);
    this._user.set(user);
    this._isAuthenticated.set(true);
  }

  private clearAuthData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    // Update both BehaviorSubject and signals
    this.tokenSubject.next(null);
    this.userSubject.next(null);
    this._user.set(null);
    this._isAuthenticated.set(false);
  }

  getAuthToken(): string | null {
    return this.tokenSubject.value;
  }

  getAuthHeaders(): HttpHeaders | Record<string, string> {
    const token = this.getAuthToken();
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }

  async signUp(registerData: RegisterRequest) {
    try {
      this.loading.set(true);
      
      const response = await this.http.post<AuthResponse>(
        `${this.API_URL}/auth/register`,
        registerData
      ).toPromise();

      if (response?.success && response.data) {
        this.setAuthData(response.data.access_token, response.data.user);
        this.config.logIfEnabled('User registered successfully:', response.data.user.email);
        return { data: response.data, error: null };
      }

      return { data: null, error: new Error('Registration failed') };
    } catch (error: any) {
      this.config.errorIfEnabled('SignUp error:', error);
      const errorMessage = error.error?.message || error.message || 'Registration failed';
      return { data: null, error: new Error(errorMessage) };
    } finally {
      this.loading.set(false);
    }
  }

  async signIn(email: string, password: string) {
    try {
      this.loading.set(true);
      
      const response = await this.http.post<AuthResponse>(
        `${this.API_URL}/auth/login`,
        { email, password }
      ).toPromise();

      if (response?.success && response.data) {
        this.setAuthData(response.data.access_token, response.data.user);
        this.config.logIfEnabled('User signed in successfully:', response.data.user.email);
        return { data: response.data, error: null };
      }

      return { data: null, error: new Error('Login failed') };
    } catch (error: any) {
      this.config.errorIfEnabled('SignIn error:', error);
      const errorMessage = error.error?.message || error.message || 'Login failed';
      return { data: null, error: new Error(errorMessage) };
    } finally {
      this.loading.set(false);
    }
  }

  async signOut() {
    try {
      this.loading.set(true);
      this.clearAuthData();
      this.config.logIfEnabled('User signed out successfully');
      await this.router.navigate(['/']);
      return { error: null };
    } catch (error: any) {
      this.config.errorIfEnabled('SignOut error:', error);
      return { error };
    } finally {
      this.loading.set(false);
    }
  }

  // async getProfile(): Promise<{ data: User | null; error: any }> {
  //   try {
  //     const response = await this.http.get<{ success: boolean; data: User; message: string }>(
  //       `${this.API_URL}/users/profile`,
  //       { headers: this.getAuthHeaders() }
  //     ).toPromise();

  //     if (response?.success && response.data) {
  //       this.userSubject.next(response.data);
  //       if (typeof window !== 'undefined') {
  //         localStorage.setItem(this.USER_KEY, JSON.stringify(response.data));
  //       }
  //       return { data: response.data, error: null };
  //     }

  //     return { data: null, error: new Error('Failed to get profile') };
  //   } catch (error: any) {
  //     console.error('Get profile error:', error);
  //     return { data: null, error };
  //   }
  // }

  async updateProfile(updateData: UpdateUserRequest): Promise<{ data: User | null; error: any }> {
    try {
      if (!this.currentUser) {
        return { data: null, error: new Error('User not authenticated') };
      }

      const response = await this.http.put<UserResponse>(
        `${this.API_URL}/users/${this.currentUser._id}`,
        updateData,
        { headers: this.getAuthHeaders() }
      ).toPromise();

      if (response?.success && response.data) {
        this.userSubject.next(response.data);
        this._user.set(response.data);
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.USER_KEY, JSON.stringify(response.data));
        }
        this.config.logIfEnabled('Profile updated successfully');
        return { data: response.data, error: null };
      }

      return { data: null, error: new Error('Failed to update profile') };
    } catch (error: any) {
      this.config.errorIfEnabled('Update profile error:', error);
      return { data: null, error };
    }
  }

  logout(): void {
    // Clear user and token from memory
    this.userSubject.next(null);
    this.tokenSubject.next(null);
    this._user.set(null);
    this._isAuthenticated.set(false);
    
    // Clear from storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    
    this.config.logIfEnabled('User logged out successfully');
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const response = await this.http.get<UserResponse>(
        `${this.API_URL}/users/${userId}`,
        { headers: this.getAuthHeaders() }
      ).toPromise();

      if (response?.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error: any) {
      this.config.errorIfEnabled('Get user by ID error:', error);
      return null;
    }
  }

  async switchMode(userMode: 'client' | 'business_owner'): Promise<{ data: User | null; error: any }> {
    try {
      this.loading.set(true);
      
      const response = await this.http.put<UserResponse>(
        `${this.API_URL}/users/switch-mode`,
        { user_mode: userMode },
        { headers: this.getAuthHeaders() }
      ).toPromise();

      if (response?.success && response.data) {
        // Update the user in storage and state
        this.userSubject.next(response.data);
        this._user.set(response.data);
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.USER_KEY, JSON.stringify(response.data));
        }
        
        this.config.logIfEnabled(`User mode switched to ${userMode} successfully`);
        return { data: response.data, error: null };
      }

      return { data: null, error: new Error('Failed to switch user mode') };
    } catch (error: any) {
      this.config.errorIfEnabled('Switch mode error:', error);
      return { data: null, error };
    } finally {
      this.loading.set(false);
    }
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      this.loading.set(true);
      
      const response = await this.http.post<{ 
        success: boolean; 
        data: { success: boolean; message: string }; 
        message: string;
      }>(
        `${this.API_URL}/auth/forgot-password`,
        { email }
      ).toPromise();

      if (response?.success) {
        this.config.logIfEnabled('Password reset email sent successfully');
        return {
          success: true,
          message: response.data?.message || response.message || 'Password reset email sent successfully'
        };
      }

      return {
        success: false,
        message: response?.message || 'Failed to send password reset email'
      };
    } catch (error: any) {
      this.config.errorIfEnabled('Forgot password error:', error);
      return {
        success: false,
        message: error.error?.message || error.message || 'Failed to send password reset email'
      };
    } finally {
      this.loading.set(false);
    }
  }

  async verifyResetToken(token: string): Promise<{ 
    success: boolean; 
    message: string; 
    data?: { email: string }; 
  }> {
    try {
      const response = await this.http.get<{
        success: boolean;
        data: { success: boolean; message: string; email: string };
        message: string;
      }>(
        `${this.API_URL}/auth/verify-reset-token?token=${token}`
      ).toPromise();

      if (response?.success) {
        return {
          success: true,
          message: response.data?.message || 'Token is valid',
          data: { email: response.data?.email || '' }
        };
      }

      return {
        success: false,
        message: response?.message || 'Invalid or expired token'
      };
    } catch (error: any) {
      this.config.errorIfEnabled('Verify reset token error:', error);
      return {
        success: false,
        message: error.error?.message || error.message || 'Invalid or expired token'
      };
    }
  }

  async resetPassword(token: string, newPassword: string, confirmPassword: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      this.loading.set(true);
      
      const response = await this.http.post<{
        success: boolean;
        data: { success: boolean; message: string };
        message: string;
      }>(
        `${this.API_URL}/auth/reset-password`,
        { token, newPassword, confirmPassword }
      ).toPromise();

      if (response?.success) {
        this.config.logIfEnabled('Password reset successfully');
        return {
          success: true,
          message: response.data?.message || response.message || 'Password reset successfully'
        };
      }

      return {
        success: false,
        message: response?.message || 'Failed to reset password'
      };
    } catch (error: any) {
      this.config.errorIfEnabled('Reset password error:', error);
      return {
        success: false,
        message: error.error?.message || error.message || 'Failed to reset password'
      };
    } finally {
      this.loading.set(false);
    }
  }

}
