import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  PayPalAccount, 
  PayPalOAuthResponse, 
  PayPalConnectRequest,
  PayPalVerificationResult 
} from '../models/paypal-account.model';

@Injectable({
  providedIn: 'root'
})
export class PayPalService {
  private apiUrl = `${environment.api.baseUrl}/paypal-accounts`;

  constructor(private http: HttpClient) {}

  /**
   * Get PayPal OAuth authorization URL
   */
  getConnectUrl(): Observable<PayPalOAuthResponse> {
    return this.http.get<PayPalOAuthResponse>(`${this.apiUrl}/connect-url`);
  }

  /**
   * Connect PayPal account using OAuth code
   */
  connectAccount(request: PayPalConnectRequest): Observable<PayPalAccount> {
    return this.http.post<PayPalAccount>(`${this.apiUrl}/connect`, request);
  }

  /**
   * Get user's connected PayPal accounts
   */
  getAccounts(): Observable<PayPalAccount[]> {
    return this.http.get<PayPalAccount[]>(this.apiUrl);
  }

  /**
   * Get specific PayPal account
   */
  getAccount(accountId: string): Observable<PayPalAccount> {
    return this.http.get<PayPalAccount>(`${this.apiUrl}/${accountId}`);
  }

  /**
   * Refresh PayPal account tokens
   */
  refreshAccount(accountId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/${accountId}/refresh`, {});
  }

  /**
   * Disconnect PayPal account
   */
  disconnectAccount(accountId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/${accountId}/disconnect`, {});
  }

  /**
   * Verify PayPal account status
   */
  verifyAccount(accountId: string): Observable<PayPalVerificationResult> {
    return this.http.post<PayPalVerificationResult>(`${this.apiUrl}/${accountId}/verify`, {});
  }

  /**
   * Open PayPal OAuth window and handle the flow
   */
  async initiatePayPalConnection(userId: string): Promise<PayPalAccount | null> {
    try {
      // Get OAuth URL
      const response = await this.getConnectUrl().toPromise();
      if (!response?.auth_url) {
        throw new Error('Failed to get PayPal OAuth URL');
      }

      // Open PayPal OAuth in popup window
      const popup = window.open(
        response.auth_url,
        'paypal-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Wait for OAuth completion
      return new Promise((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            reject(new Error('PayPal connection was cancelled'));
          }
        }, 1000);

        // Listen for message from popup
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;

          if (event.data.type === 'PAYPAL_OAUTH_SUCCESS') {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            popup.close();

            // Connect the account
            this.connectAccount({
              code: event.data.code,
              state: event.data.state
            }).subscribe({
              next: (account) => resolve(account),
              error: (error) => reject(error)
            });
          } else if (event.data.type === 'PAYPAL_OAUTH_ERROR') {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            popup.close();
            reject(new Error(event.data.error || 'PayPal connection failed'));
          }
        };

        window.addEventListener('message', messageListener);
      });
    } catch (error) {
      console.error('PayPal connection error:', error);
      throw error;
    }
  }
}
