import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { 
  Order, 
  OrderInsert, 
  OrderUpdate,
  OrderWithDetails,
  Message,
  MessageInsert,
  Review,
  ReviewInsert
} from '../types/database.types';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private supabaseService = inject(SupabaseService);
  
  // Signals for reactive state management
  public buyerOrders = signal<OrderWithDetails[]>([]);
  public sellerOrders = signal<OrderWithDetails[]>([]);
  public currentOrder = signal<OrderWithDetails | null>(null);
  public orderMessages = signal<Message[]>([]);
  public loading = signal(false);
  public error = signal<string | null>(null);

  // Computed signals
  public totalBuyerOrders = computed(() => this.buyerOrders().length);
  public totalSellerOrders = computed(() => this.sellerOrders().length);
  public pendingBuyerOrders = computed(() => 
    this.buyerOrders().filter(order => order.status === 'pending').length
  );
  public pendingSellerOrders = computed(() => 
    this.sellerOrders().filter(order => order.status === 'pending').length
  );

  async loadBuyerOrders(userId: string) {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const { data, error } = await this.supabaseService.getOrdersByUser(userId, 'buyer');
      
      if (error) {
        this.error.set(error.message);
        return { data: [], error };
      }
      
      this.buyerOrders.set(data || []);
      return { data: data || [], error: null };
    } catch (err: any) {
      this.error.set(err.message);
      return { data: [], error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async loadSellerOrders(userId: string) {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const { data, error } = await this.supabaseService.getOrdersByUser(userId, 'seller');
      
      if (error) {
        this.error.set(error.message);
        return { data: [], error };
      }
      
      this.sellerOrders.set(data || []);
      return { data: data || [], error: null };
    } catch (err: any) {
      this.error.set(err.message);
      return { data: [], error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async createOrder(order: OrderInsert) {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const { data, error } = await this.supabaseService.createOrder(order);
      
      if (error) {
        this.error.set(error.message);
        return { data: null, error };
      }
      
      // Reload orders to include the new one
      if (data) {
        await this.loadBuyerOrders(order.buyer_id);
      }
      
      return { data, error: null };
    } catch (err: any) {
      this.error.set(err.message);
      return { data: null, error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async updateOrderStatus(orderId: string, status: OrderUpdate['status']) {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const updates: OrderUpdate = { 
        status,
        updated_at: new Date().toISOString()
      };

      // If completing order, set delivery date
      if (status === 'completed') {
        updates.delivery_date = new Date().toISOString();
      }

      const { data, error } = await this.supabaseService.updateOrder(orderId, updates);
      
      if (error) {
        this.error.set(error.message);
        return { data: null, error };
      }
      
      // Update current order if it's the one being updated
      if (this.currentOrder()?.id === orderId && data) {
        this.currentOrder.set({ ...this.currentOrder()!, ...data });
      }
      
      return { data, error: null };
    } catch (err: any) {
      this.error.set(err.message);
      return { data: null, error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async loadOrderById(orderId: string) {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const { data, error } = await this.supabaseService
        .from('orders')
        .select(`
          *,
          services (
            id,
            title,
            description,
            images,
            price,
            currency
          ),
          buyer_profile:profiles!buyer_id (
            id,
            full_name,
            avatar_url,
            email
          ),
          seller_profile:profiles!seller_id (
            id,
            full_name,
            avatar_url,
            email
          )
        `)
        .eq('id', orderId)
        .single();
      
      if (error) {
        this.error.set(error.message);
        return { data: null, error };
      }
      
      this.currentOrder.set(data);
      return { data, error: null };
    } catch (err: any) {
      this.error.set(err.message);
      return { data: null, error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async loadOrderMessages(orderId: string) {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const { data, error } = await this.supabaseService.getMessagesForOrder(orderId);
      
      if (error) {
        this.error.set(error.message);
        return { data: [], error };
      }
      
      this.orderMessages.set(data || []);
      return { data: data || [], error: null };
    } catch (err: any) {
      this.error.set(err.message);
      return { data: [], error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async sendMessage(message: MessageInsert) {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const { data, error } = await this.supabaseService.sendMessage(message);
      
      if (error) {
        this.error.set(error.message);
        return { data: null, error };
      }
      
      // Add message to current messages
      if (data) {
        const currentMessages = this.orderMessages();
        this.orderMessages.set([...currentMessages, data]);
      }
      
      return { data, error: null };
    } catch (err: any) {
      this.error.set(err.message);
      return { data: null, error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async markMessagesAsRead(orderId: string, userId: string) {
    try {
      // Mark all unread messages in this order as read
      await this.supabaseService
        .from('messages')
        .update({ 
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId)
        .eq('receiver_id', userId)
        .eq('is_read', false);

      // Update local state
      const updatedMessages = this.orderMessages().map(msg => ({
        ...msg,
        is_read: msg.receiver_id === userId ? true : msg.is_read
      }));
      
      this.orderMessages.set(updatedMessages);
    } catch (error) {
      console.warn('Failed to mark messages as read:', error);
    }
  }

  async submitRequirements(orderId: string, requirements: string) {
    return await this.supabaseService.updateOrder(orderId, {
      requirements_submitted: true,
      notes: requirements
    });
  }

  async createReview(review: ReviewInsert) {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const { data, error } = await this.supabaseService.createReview(review);
      
      if (error) {
        this.error.set(error.message);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (err: any) {
      this.error.set(err.message);
      return { data: null, error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async updatePaymentStatus(orderId: string, paymentStatus: OrderUpdate['payment_status'], paymentIntentId?: string) {
    const updates: OrderUpdate = {
      payment_status: paymentStatus,
      updated_at: new Date().toISOString()
    };

    if (paymentIntentId) {
      updates.payment_intent_id = paymentIntentId;
    }

    return await this.supabaseService.updateOrder(orderId, updates);
  }

  // Subscribe to real-time order updates
  subscribeToOrderUpdates(orderId: string, callback: (payload: any) => void) {
    return this.supabaseService
      .getClient()
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        callback
      )
      .subscribe();
  }

  // Subscribe to real-time message updates
  subscribeToMessages(orderId: string, callback: (payload: any) => void) {
    return this.supabaseService
      .getClient()
      .channel(`messages-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `order_id=eq.${orderId}`
        },
        callback
      )
      .subscribe();
  }

  // Clear order data
  clearOrderData() {
    this.buyerOrders.set([]);
    this.sellerOrders.set([]);
    this.currentOrder.set(null);
    this.orderMessages.set([]);
    this.error.set(null);
  }
}
