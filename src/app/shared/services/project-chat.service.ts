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
  customer?: {
    name: string | null;
    avatar_url: string | null;
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

      console.log('Creating user business project with data:', {
        user_id: currentUser.id,
        business_id: projectData.businessId,
        project_title: projectData.title,
        project_description: projectData.description,
        start_date: new Date().toISOString(),
        status: 'in_progress'
      });

      // Use direct insert since the RPC function inserts into wrong table
      return await this.createUserBusinessProjectDirect(projectData);
    } catch (error) {
      console.error('Error in createUserBusinessProject:', error);
      throw error;
    }
  }

  async createUserBusinessProjectDirect(projectData: ProjectFormData): Promise<number> {
    try {
      const currentUser = this.authService.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      console.log('Creating user business project directly with data:', {
        user_id: currentUser.id,
        business_id: projectData.businessId,
        project_title: projectData.title,
        project_description: projectData.description,
        start_date: new Date().toISOString(),
        status: 'active'
      });

      // Create user business project directly in the table
      const { data, error } = await this.supabaseService.getClient()
        .from('user_business_projects')
        .insert({
          user_id: currentUser.id,
          business_id: projectData.businessId,
          project_title: projectData.title,
          project_description: projectData.description,
          start_date: new Date().toISOString(),
          status: 'active'
        })
        .select('id')
        .single();

      console.log('Direct insert response:', { data, error });

      if (error) {
        console.error('Error creating user business project directly:', error);
        throw error;
      }

      if (!data || !data.id) {
        console.error('No data or ID returned from direct insert');
        throw new Error('No project ID returned');
      }

      console.log('Created user business project directly with ID:', data.id);
      return data.id;
    } catch (error) {
      console.error('Error in createUserBusinessProjectDirect:', error);
      throw error;
    }
  }

  async startChatConversation(userId: string, businessId: string, projectId: number): Promise<string> {
    try {
      console.log('Starting chat conversation with:', { userId, businessId, projectId });
      
      // Try RPC function first
      try {
        const { data, error } = await this.supabaseService.getClient()
          .rpc('start_chat_conversation', {
            p_user_id: userId,
            p_business_id: businessId,
            p_project_id: projectId
          });

        console.log('start_chat_conversation RPC response:', { data, error });

        if (!error && data) {
          console.log('Created conversation via RPC with ID:', data);
          return data;
        } else {
          console.warn('RPC failed, falling back to direct insert:', error);
        }
      } catch (rpcError) {
        console.warn('RPC function failed, using direct insert:', rpcError);
      }

      // Fallback to direct insert
      return await this.startChatConversationDirect(userId, businessId, projectId);
    } catch (error) {
      console.error('Error in startChatConversation:', error);
      throw error;
    }
  }

  async startChatConversationDirect(userId: string, businessId: string, projectId: number): Promise<string> {
    try {
      console.log('Starting chat conversation directly with:', { userId, businessId, projectId });
      
      // Create chat conversation directly in the table
      const { data, error } = await this.supabaseService.getClient()
        .from('chat_conversations')
        .insert({
          user_id: userId,
          business_id: businessId,
          project_id: projectId
        })
        .select('id')
        .single();

      console.log('Direct chat conversation insert response:', { data, error });

      if (error) {
        console.error('Error starting chat conversation directly:', error);
        throw error;
      }

      if (!data || !data.id) {
        console.error('No conversation ID returned from direct insert');
        throw new Error('No conversation ID returned');
      }

      console.log('Created conversation directly with ID:', data.id);
      return data.id;
    } catch (error) {
      console.error('Error in startChatConversationDirect:', error);
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

      if (!data || data.length === 0) {
        return [];
      }

      console.log('Found conversations:', data);

      // Get project and business info for each conversation
      const conversations = await Promise.all(
        data.map(async (conv) => {
          console.log('Processing conversation:', conv.id, 'project_id:', conv.project_id, 'business_id:', conv.business_id);
          
          try {
            const [projectResult, businessResult] = await Promise.all([
              this.supabaseService.getClient()
                .from('user_business_projects')
                .select('project_title, project_description')
                .eq('id', conv.project_id)
                .single(),
              
              this.supabaseService.getClient()
                .from('businesses')
                .select('name, logo_url')
                .eq('id', conv.business_id)
                .single()
            ]);

            console.log('Project query result:', projectResult);
            console.log('Business query result:', businessResult);

            if (projectResult.error) {
              console.error('Error fetching project:', projectResult.error);
            }
            if (businessResult.error) {
              console.error('Error fetching business:', businessResult.error);
            }

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
          } catch (err) {
            console.error('Error processing conversation:', conv.id, err);
            return {
              ...conv,
              project: undefined,
              business: undefined
            } as ChatConversation;
          }
        })
      );

      console.log('Final conversations with project/business data:', conversations);
      return conversations;
    } catch (error) {
      console.error('Error in getUserConversations:', error);
      return [];
    }
  }

  async getBusinessConversations(userId: string): Promise<ChatConversation[]> {
    try {
      // First get businesses owned by this user
      const { data: businesses, error: businessError } = await this.supabaseService.getClient()
        .from('businesses')
        .select('id')
        .eq('profile_id', userId);

      if (businessError) {
        console.error('Error fetching user businesses:', businessError);
        return [];
      }

      if (!businesses || businesses.length === 0) {
        console.log('No businesses found for user:', userId);
        return [];
      }

      console.log('Found businesses for user:', businesses);
      const businessIds = businesses.map(b => b.id);

      // Get conversations for these businesses
      const { data, error } = await this.supabaseService.getClient()
        .from('chat_conversations')
        .select('*')
        .in('business_id', businessIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching business conversations:', error);
        return [];
      }

      if (!data || data.length === 0) {
        console.log('No conversations found for businesses:', businessIds);
        return [];
      }

      console.log('Found business conversations:', data);

      // Get project, business, and customer info for each conversation
      const conversations = await Promise.all(
        data.map(async (conv) => {
          console.log('Processing business conversation:', conv.id, 'project_id:', conv.project_id);
          
          try {
            const [projectResult, businessResult, customerResult] = await Promise.all([
              this.supabaseService.getClient()
                .from('user_business_projects')
                .select('project_title, project_description')
                .eq('id', conv.project_id)
                .single(),
              
              this.supabaseService.getClient()
                .from('businesses')
                .select('name, logo_url')
                .eq('id', conv.business_id)
                .single(),
              
              this.supabaseService.getClient()
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', conv.user_id)
                .single()
            ]);

            console.log('Business conversation project result:', projectResult);

            if (projectResult.error) {
              console.error('Error fetching project for business conversation:', projectResult.error);
            }
            if (businessResult.error) {
              console.error('Error fetching business for business conversation:', businessResult.error);
            }
            if (customerResult.error) {
              console.error('Error fetching customer for business conversation:', customerResult.error);
            }

            return {
              ...conv,
              project: projectResult.data ? {
                title: projectResult.data.project_title,
                description: projectResult.data.project_description
              } : undefined,
              business: businessResult.data ? {
                name: businessResult.data.name,
                logo_url: businessResult.data.logo_url
              } : undefined,
              customer: customerResult.data ? {
                name: customerResult.data.full_name,
                avatar_url: customerResult.data.avatar_url
              } : undefined
            } as ChatConversation & { customer?: { name: string | null; avatar_url: string | null } };
          } catch (err) {
            console.error('Error processing business conversation:', conv.id, err);
            return {
              ...conv,
              project: undefined,
              business: undefined,
              customer: undefined
            } as ChatConversation & { customer?: { name: string | null; avatar_url: string | null } };
          }
        })
      );

      console.log('Final business conversations:', conversations);
      return conversations;
    } catch (error) {
      console.error('Error in getBusinessConversations:', error);
      return [];
    }
  }

  async getAllUserConversations(userId: string): Promise<{
    asCustomer: ChatConversation[];
    asBusiness: ChatConversation[];
  }> {
    try {
      const [customerConversations, businessConversations] = await Promise.all([
        this.getUserConversations(userId),
        this.getBusinessConversations(userId)
      ]);

      return {
        asCustomer: customerConversations,
        asBusiness: businessConversations
      };
    } catch (error) {
      console.error('Error in getAllUserConversations:', error);
      return {
        asCustomer: [],
        asBusiness: []
      };
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
