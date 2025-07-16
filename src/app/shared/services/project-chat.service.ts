import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Tables, TablesInsert } from '../types/database.types';

export interface ProjectFormData {
  businessId: string;
  serviceId?: number;
  title: string;
  description: string;
  budget?: number;
  timeline?: string;
  requirements?: string;
  contactPreference?: 'email' | 'phone' | 'chat';
  urgency?: 'low' | 'medium' | 'high';
}

export interface ChatConversation extends Tables<'chat_conversations'> {
  project?: {
    title: string;
    description: string | null;
  };
  business?: {
    name: string;
    logo_url: string | null;
  };
}

export interface ChatMessage extends Tables<'chat_messages'> {
  sender_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProjectChatService {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);

  async createUserBusinessProject(projectData: ProjectFormData): Promise<number> {
    try {
      const currentUser = this.authService.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Create user business project using the database function
      const { data, error } = await this.supabaseService.getClient()
        .rpc('create_user_business_project', {
          p_user_id: currentUser.id,
          p_business_id: projectData.businessId,
          p_project_title: projectData.title,
          p_project_description: projectData.description,
          p_start_date: new Date().toISOString(),
          p_status: 'in_progress'
        });

      if (error) {
        console.error('Error creating user business project:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createUserBusinessProject:', error);
      throw error;
    }
  }

  async startChatConversation(userId: string, businessId: string, projectId: number): Promise<string> {
    try {
      // Create chat conversation using the database function
      const { data, error } = await this.supabaseService.getClient()
        .rpc('start_chat_conversation', {
          p_user_id: userId,
          p_business_id: businessId,
          p_project_id: projectId
        });

      if (error) {
        console.error('Error starting chat conversation:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in startChatConversation:', error);
      throw error;
    }
  }

  async getConversation(conversationId: string): Promise<ChatConversation | null> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('chat_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('Error fetching conversation:', error);
        return null;
      }

      // Get additional project and business info separately
      const [projectResult, businessResult] = await Promise.all([
        this.supabaseService.getClient()
          .from('user_business_projects')
          .select('project_title, project_description')
          .eq('id', data.project_id)
          .single(),
        
        this.supabaseService.getClient()
          .from('businesses')
          .select('name, logo_url')
          .eq('id', data.business_id as any)
          .single()
      ]);

      return {
        ...data,
        project: projectResult.data ? {
          title: projectResult.data.project_title,
          description: projectResult.data.project_description
        } : undefined,
        business: businessResult.data ? {
          name: businessResult.data.name,
          logo_url: businessResult.data.logo_url
        } : undefined
      } as ChatConversation;
    } catch (error) {
      console.error('Error in getConversation:', error);
      return null;
    }
  }

  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      // Get sender profiles separately
      const senderIds = [...new Set(data.map(msg => msg.sender_id.toString()))];
      const { data: profilesData } = await this.supabaseService.getClient()
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', senderIds);

      const profilesMap = new Map(
        (profilesData || []).map(profile => [profile.id, profile])
      );

      return data.map(message => ({
        ...message,
        sender_profile: profilesMap.get(message.sender_id.toString()) || undefined
      })) as ChatMessage[];
    } catch (error) {
      console.error('Error in getConversationMessages:', error);
      return [];
    }
  }

  async sendMessage(conversationId: string, senderId: string, message: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.getClient()
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId, // Keep as string as per updated database schema
          message
        });

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }

  async getUserConversations(userId: string): Promise<ChatConversation[]> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('chat_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user conversations:', error);
        return [];
      }

      // Get project and business info for each conversation
      const conversations = await Promise.all(
        data.map(async (conv) => {
          const [projectResult, businessResult] = await Promise.all([
            this.supabaseService.getClient()
              .from('user_business_projects')
              .select('project_title, project_description')
              .eq('id', conv.project_id)
              .single(),
            
            this.supabaseService.getClient()
              .from('businesses')
              .select('name, logo_url')
              .eq('id', conv.business_id as any)
              .single()
          ]);

          return {
            ...conv,
            project: projectResult.data ? {
              title: projectResult.data.project_title,
              description: projectResult.data.project_description
            } : undefined,
            business: businessResult.data ? {
              name: businessResult.data.name,
              logo_url: businessResult.data.logo_url
            } : undefined
          } as ChatConversation;
        })
      );

      return conversations;
    } catch (error) {
      console.error('Error in getUserConversations:', error);
      return [];
    }
  }

  // Subscribe to real-time message updates
  subscribeToMessages(conversationId: number, callback: (message: ChatMessage) => void) {
    return this.supabaseService.getClient()
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Fetch the complete message with profile info
          const messageId = payload.new['id'] as number;
          const senderId = payload.new['sender_id'] as number;
          
          const [messageResult, profileResult] = await Promise.all([
            this.supabaseService.getClient()
              .from('chat_messages')
              .select('*')
              .eq('id', messageId)
              .single(),
            
            this.supabaseService.getClient()
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', senderId.toString())
              .single()
          ]);

          if (messageResult.data) {
            const message = {
              ...messageResult.data,
              sender_profile: profileResult.data || undefined
            } as ChatMessage;
            
            callback(message);
          }
        }
      )
      .subscribe();
  }
}
