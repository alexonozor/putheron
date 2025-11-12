import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

export interface CreateContactDto {
  first_name: string;
  last_name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private http = inject(HttpClient);
  private configService = inject(ConfigService);
  private readonly apiUrl = `${this.configService.apiBaseUrl}/contacts`;



  createContact(contactData: CreateContactDto): Observable<ContactResponse> {
    return this.http.post<ContactResponse>(`${this.apiUrl}`, contactData);
  }
}
