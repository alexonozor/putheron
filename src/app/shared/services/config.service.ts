import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  
  // API Configuration
  get apiBaseUrl(): string {
    return environment.api.baseUrl;
  }

  get apiTimeout(): number {
    return environment.api.timeout;
  }

  // Auth Configuration
  get tokenKey(): string {
    return environment.auth.tokenKey;
  }

  get userKey(): string {
    return environment.auth.userKey;
  }

  // Feature flags
  get isProduction(): boolean {
    return environment.production;
  }

  get enableLogging(): boolean {
    return environment.features.enableLogging;
  }

  get enableDevTools(): boolean {
    return environment.features.enableDevTools;
  }

  // Helper methods
  getApiUrl(endpoint: string): string {
    const baseUrl = this.apiBaseUrl.endsWith('/') 
      ? this.apiBaseUrl.slice(0, -1) 
      : this.apiBaseUrl;
    const cleanEndpoint = endpoint.startsWith('/') 
      ? endpoint 
      : `/${endpoint}`;
    return `${baseUrl}${cleanEndpoint}`;
  }

  logIfEnabled(message: string, ...optionalParams: any[]): void {
    if (this.enableLogging) {
      console.log(message, ...optionalParams);
    }
  }

  errorIfEnabled(message: string, ...optionalParams: any[]): void {
    if (this.enableLogging) {
      console.error(message, ...optionalParams);
    }
  }
}
