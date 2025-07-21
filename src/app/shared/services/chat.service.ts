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
  message_type: 'text' | 'file' | 'image' | 'project_update';
  file_url?: string;
  file_name?: string;
  file_size?: number;
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
  message_type?: 'text' | 'file' | 'image' | 'project_update';
  file_url?: string;
  file_name?: string;
  file_size?: number;
}

export interface UpdateMessageDto {
  content?: string;
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
}
