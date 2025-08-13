import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { StripeAccountStatus, OnboardingLinkResponse, LoginLinkResponse } from '../models/stripe-account.model';

export interface CreateStripeAccountResponse {
  account_id: string;
  onboarding_url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StripeConnectService {
  private readonly apiUrl = `${environment.api.baseUrl}/stripe-connect`;

  constructor(private http: HttpClient) {}

  /**
   * Create or get Stripe Express account
   */
  createOrGetAccount(country: string = 'US'): Observable<CreateStripeAccountResponse> {
    return this.http.post<CreateStripeAccountResponse>(`${this.apiUrl}/account`, { country });
  }

  /**
   * Get account status
   */
  getAccountStatus(): Observable<StripeAccountStatus> {
    return this.http.get<StripeAccountStatus>(`${this.apiUrl}/account/status`);
  }

  /**
   * Create onboarding link for existing account
   */
  createOnboardingLink(): Observable<OnboardingLinkResponse> {
    return this.http.post<OnboardingLinkResponse>(`${this.apiUrl}/account/onboarding`, {});
  }

  /**
   * Create Express dashboard login link
   */
  createLoginLink(): Observable<LoginLinkResponse> {
    return this.http.post<LoginLinkResponse>(`${this.apiUrl}/account/login`, {});
  }

  /**
   * Disconnect Stripe account
   */
  disconnectAccount(): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/account`);
  }
}
