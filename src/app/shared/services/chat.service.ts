import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { ConfigService } from './config.service';

export interface Chat {
  _id: string;
  project_id: {
    _id: string;
    title: string;
    status: string;
    client_id: {
      _id: string;
      last_name: string;
      email: string;
    };
    business_owner_id: {
      _id: string;
      last_name: string;
      email: string;
    };
    business_id: {
      _id: string;
      name: string;
      logo_url?: string;
    };
  };
  participants: string[];
  title: string;
  last_message_at: Date | string;
  is_active: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Message {
  _id: string;
  chat_id: string;
  sender_id: {
    _id: string;
    last_name: string;
    email: string;
  };
  content: string;
  message_type: 'text' | 'file' | 'image' | 'project_update' | 'payment_request' | 'completion_request';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  payment_amount?: number;
  payment_description?: string;
  payment_status?: 'pending' | 'approved' | 'rejected' | 'payment_pending' | 'paid';
  payment_intent_id?: string;
  completion_status?: 'pending' | 'approved' | 'rejected';
  is_edited: boolean;
  edited_at?: Date | string;
  is_deleted: boolean;
  read_by: {
    user_id: string;
    read_at: Date | string;
  }[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateChatDto {
  project_id: string;
}

export interface CreateMessageDto {
  chat_id: string;
  content: string;
  message_type?: 'text' | 'file' | 'image' | 'project_update' | 'payment_request' | 'completion_request';
  file_url?: string;
  file_name?: string;
  file_size?: number;
}

export interface UpdateMessageDto {
  content?: string;
}

export interface CreatePaymentRequestDto {
  amount: string;
  description: string;
  content: string;
}

export interface RespondToPaymentRequestDto {
  status: 'approved' | 'rejected';
  rejection_reason?: string;
}

export interface CreateCompletionRequestDto {
  content: string;
}

export interface RespondToCompletionRequestDto {
  status: 'approved' | 'rejected';
  rejection_reason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly configService = inject(ConfigService);
  
  private get apiUrl(): string {
    return this.configService.getApiUrl('/chat');
  }

  // Create or get chat for a project
  createOrGetChat(createChatDto: CreateChatDto): Observable<{ success: boolean; data: Chat; message: string }> {
    return this.http.post<{ success: boolean; data: Chat; message: string }>(
      this.apiUrl,
      createChatDto
    );
  }

  // Create or get chat async
  async createOrGetChatAsync(createChatDto: CreateChatDto): Promise<Chat> {
    const response = await firstValueFrom(this.createOrGetChat(createChatDto));
    return response.data;
  }

  // Get all user chats
  getUserChats(): Observable<{ success: boolean; data: Chat[]; message: string }> {
    return this.http.get<{ success: boolean; data: Chat[]; message: string }>(this.apiUrl);
  }

  // Get user chats async
  async getUserChatsAsync(): Promise<Chat[]> {
    const response = await firstValueFrom(this.getUserChats());
    return response.data;
  }

  // Get chat by ID
  getChatById(chatId: string): Observable<{ success: boolean; data: Chat; message: string }> {
    return this.http.get<{ success: boolean; data: Chat; message: string }>(
      `${this.apiUrl}/${chatId}`
    );
  }

  // Get chat by ID async
  async getChatByIdAsync(chatId: string): Promise<Chat> {
    const response = await firstValueFrom(this.getChatById(chatId));
    return response.data;
  }

  // Get chat messages
  getChatMessages(chatId: string, page = 1, limit = 50): Observable<{ success: boolean; data: Message[]; message: string }> {
    return this.http.get<{ success: boolean; data: Message[]; message: string }>(
      `${this.apiUrl}/${chatId}/messages?page=${page}&limit=${limit}`
    );
  }

  // Get chat messages async
  async getChatMessagesAsync(chatId: string, page = 1, limit = 50): Promise<Message[]> {
    const response = await firstValueFrom(this.getChatMessages(chatId, page, limit));
    return response.data;
  }

  // Send message
  sendMessage(chatId: string, createMessageDto: Omit<CreateMessageDto, 'chat_id'>): Observable<{ success: boolean; data: Message; message: string }> {
    return this.http.post<{ success: boolean; data: Message; message: string }>(
      `${this.apiUrl}/${chatId}/messages`,
      createMessageDto
    );
  }

  // Send message async
  async sendMessageAsync(chatId: string, createMessageDto: Omit<CreateMessageDto, 'chat_id'>): Promise<Message> {
    const response = await firstValueFrom(this.sendMessage(chatId, createMessageDto));
    return response.data;
  }

  // Update message
  updateMessage(chatId: string, messageId: string, updateMessageDto: UpdateMessageDto): Observable<{ success: boolean; data: Message; message: string }> {
    return this.http.patch<{ success: boolean; data: Message; message: string }>(
      `${this.apiUrl}/${chatId}/messages/${messageId}`,
      updateMessageDto
    );
  }

  // Update message async
  async updateMessageAsync(chatId: string, messageId: string, updateMessageDto: UpdateMessageDto): Promise<Message> {
    const response = await firstValueFrom(this.updateMessage(chatId, messageId, updateMessageDto));
    return response.data;
  }

  // Delete message
  deleteMessage(chatId: string, messageId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/${chatId}/messages/${messageId}`
    );
  }

  // Delete message async
  async deleteMessageAsync(chatId: string, messageId: string): Promise<void> {
    await firstValueFrom(this.deleteMessage(chatId, messageId));
  }

  // Mark messages as read
  markMessagesAsRead(chatId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/${chatId}/mark-read`,
      {}
    );
  }

  // Mark messages as read async
  async markMessagesAsReadAsync(chatId: string): Promise<void> {
    await firstValueFrom(this.markMessagesAsRead(chatId));
  }

  // Get unread message count
  getUnreadMessageCount(): Observable<{ success: boolean; data: { count: number }; message: string }> {
    return this.http.get<{ success: boolean; data: { count: number }; message: string }>(
      `${this.apiUrl}/unread-count`
    );
  }

  // Get unread message count async
  async getUnreadMessageCountAsync(): Promise<number> {
    const response = await firstValueFrom(this.getUnreadMessageCount());
    return response.data.count;
  }

  // Get chat by project ID
  getChatByProjectId(projectId: string): Observable<{ success: boolean; data: Chat | null; message: string }> {
    return this.http.get<{ success: boolean; data: Chat | null; message: string }>(
      `${this.apiUrl}/project/${projectId}`
    );
  }

  // Get chat by project ID async
  async getChatByProjectIdAsync(projectId: string): Promise<Chat | null> {
    const response = await firstValueFrom(this.getChatByProjectId(projectId));
    return response.data;
  }

  // Get chat unread count
  getChatUnreadCount(chatId: string): Observable<{ success: boolean; data: { count: number }; message: string }> {
    return this.http.get<{ success: boolean; data: { count: number }; message: string }>(
      `${this.apiUrl}/${chatId}/unread-count`
    );
  }

  // Get chat unread count async
  async getChatUnreadCountAsync(chatId: string): Promise<number> {
    const response = await firstValueFrom(this.getChatUnreadCount(chatId));
    return response.data.count;
  }

  // Upload files to chat
  uploadChatFiles(chatId: string, files: File[], content?: string): Observable<{ success: boolean; data: any; message: string }> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    if (content) {
      formData.append('content', content);
    }

    return this.http.post<{ success: boolean; data: any; message: string }>(
      `${this.apiUrl}/${chatId}/upload-files`,
      formData
    );
  }

  // Upload files to chat async
  async uploadChatFilesAsync(chatId: string, files: File[], content?: string): Promise<any> {
    const response = await firstValueFrom(this.uploadChatFiles(chatId, files, content));
    return response.data;
  }

  // Payment Request Methods
  requestAdditionalPayment(chatId: string, paymentRequest: CreatePaymentRequestDto): Observable<{ success: boolean; data: Message; message: string }> {
    return this.http.post<{ success: boolean; data: Message; message: string }>(
      `${this.apiUrl}/${chatId}/request-payment`,
      paymentRequest
    );
  }

  async requestAdditionalPaymentAsync(chatId: string, paymentRequest: CreatePaymentRequestDto): Promise<Message> {
    const response = await firstValueFrom(this.requestAdditionalPayment(chatId, paymentRequest));
    return response.data;
  }

  respondToPaymentRequest(chatId: string, messageId: string, response: RespondToPaymentRequestDto): Observable<{ success: boolean; data: Message; message: string }> {
    return this.http.post<{ success: boolean; data: Message; message: string }>(
      `${this.apiUrl}/${chatId}/respond-payment/${messageId}`,
      response
    );
  }

  async respondToPaymentRequestAsync(chatId: string, messageId: string, response: RespondToPaymentRequestDto): Promise<Message> {
    const resp = await firstValueFrom(this.respondToPaymentRequest(chatId, messageId, response));
    return resp.data;
  }

  // Additional Payment Intent Methods
  createAdditionalPaymentIntent(chatId: string, messageId: string): Observable<{ success: boolean; data: { clientSecret: string; paymentIntentId: string }; message: string }> {
    return this.http.post<{ success: boolean; data: { clientSecret: string; paymentIntentId: string }; message: string }>(
      `${this.apiUrl}/${chatId}/payment-intent/${messageId}`,
      {}
    );
  }

  async createAdditionalPaymentIntentAsync(chatId: string, messageId: string): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const response = await firstValueFrom(this.createAdditionalPaymentIntent(chatId, messageId));
    return response.data;
  }

  confirmAdditionalPayment(chatId: string, messageId: string, paymentIntentId: string): Observable<{ success: boolean; data: Message; message: string }> {
    return this.http.post<{ success: boolean; data: Message; message: string }>(
      `${this.apiUrl}/${chatId}/confirm-additional-payment/${messageId}`,
      { paymentIntentId }
    );
  }

  async confirmAdditionalPaymentAsync(chatId: string, messageId: string, paymentIntentId: string): Promise<Message> {
    const response = await firstValueFrom(this.confirmAdditionalPayment(chatId, messageId, paymentIntentId));
    return response.data;
  }

  // Completion Request Methods
  requestCompletion(chatId: string, completionRequest: CreateCompletionRequestDto): Observable<{ success: boolean; data: Message; message: string }> {
    return this.http.post<{ success: boolean; data: Message; message: string }>(
      `${this.apiUrl}/${chatId}/request-completion`,
      completionRequest
    );
  }

  async requestCompletionAsync(chatId: string, completionRequest: CreateCompletionRequestDto): Promise<Message> {
    const response = await firstValueFrom(this.requestCompletion(chatId, completionRequest));
    return response.data;
  }

  respondToCompletionRequest(chatId: string, messageId: string, response: RespondToCompletionRequestDto): Observable<{ success: boolean; data: Message; message: string }> {
    return this.http.post<{ success: boolean; data: Message; message: string }>(
      `${this.apiUrl}/${chatId}/respond-completion/${messageId}`,
      response
    );
  }

  async respondToCompletionRequestAsync(chatId: string, messageId: string, response: RespondToCompletionRequestDto): Promise<Message> {
    const resp = await firstValueFrom(this.respondToCompletionRequest(chatId, messageId, response));
    return resp.data;
  }
}
