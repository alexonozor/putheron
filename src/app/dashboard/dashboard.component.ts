import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../shared/services/auth.service';
import { SupabaseService } from '../shared/services/supabase.service';
import { ProjectChatService } from '../shared/services/project-chat.service';
import { Router } from '@angular/router';
import { Tables } from '../shared/types/database.types';
import { AddServiceFormComponent } from '../shared/components/add-service-form/add-service-form.component';

interface BusinessWithCategory extends Tables<'businesses'> {
  category?: {
    name: string;
  } | null;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-6xl mx-auto">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p class="text-gray-600 mt-2">Welcome back, {{ user()?.user_metadata?.['full_name'] || user()?.email }}!</p>
        </div>

        <!-- Business Creation CTA -->
        @if (!userBusinesses().length) {
          <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 mb-8 text-white">
            <div class="max-w-3xl">
              <h2 class="text-2xl font-bold mb-3">Ready to Start Your Business?</h2>
              <p class="text-blue-100 mb-6 text-lg">
                Join thousands of women entrepreneurs on Putheron. Create your business profile and start connecting with customers today.
              </p>
              <div class="flex flex-col sm:flex-row gap-4">
                <button 
                  (click)="navigateToCreateBusiness()"
                  class="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center justify-center">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Create Your Business
                </button>
                <button 
                  (click)="learnMore()"
                  class="border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:bg-opacity-10 transition-colors">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        } @else {
          <!-- Existing Business Management -->
          <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-medium text-gray-900">Your Businesses</h2>
              <button 
                (click)="navigateToCreateBusiness()"
                class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add Business
              </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (business of userBusinesses(); track business.id) {
                <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                     (click)="viewBusiness(business.id)">
                  <div class="flex items-center mb-3">
                    @if (business.logo_url) {
                      <img [src]="business.logo_url" [alt]="business.name" class="w-10 h-10 rounded-lg object-cover mr-3">
                    } @else {
                      <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H7m2 0v-5a2 2 0 012-2h4a2 2 0 012 2v5"></path>
                        </svg>
                      </div>
                    }
                    <div>
                      <h3 class="font-medium text-gray-900">{{ business.name }}</h3>
                      <p class="text-sm text-gray-500">{{ business.category?.name || 'No category' }}</p>
                    </div>
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <span class="flex items-center text-gray-600">
                      @if (business.is_active) {
                        <span class="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                        Active
                      } @else {
                        <span class="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                        Inactive
                      }
                    </span>
                    <span class="text-blue-600 hover:text-blue-800">View →</span>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow-sm border p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Profile Views</p>
                <p class="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Services Listed</p>
                <p class="text-2xl font-semibold text-gray-900">{{ userServices().length }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Connections</p>
                <p class="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              (click)="openAddServiceDialog()"
              [disabled]="!userBusinesses().length"
              class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed">
              <div class="text-blue-600 mb-2">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </div>
              <h3 class="font-medium text-gray-900">Add Service</h3>
              <p class="text-sm text-gray-600">
                {{ userBusinesses().length ? 'List a new service' : 'Create a business first' }}
              </p>
            </button>

            <button class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div class="text-green-600 mb-2">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <h3 class="font-medium text-gray-900">Update Profile</h3>
              <p class="text-sm text-gray-600">Manage your information</p>
            </button>

            <button 
              (click)="viewMessages()"
              class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div class="text-purple-600 mb-2">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-2-2V10a2 2 0 012-2h2"></path>
                </svg>
              </div>
              <h3 class="font-medium text-gray-900">Messages</h3>
              <p class="text-sm text-gray-600">
                {{ userConversations().length ? userConversations().length + ' active chats' : 'No active chats' }}
              </p>
            </button>

            <button class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div class="text-orange-600 mb-2">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <h3 class="font-medium text-gray-900">Analytics</h3>
              <p class="text-sm text-gray-600">View your stats</p>
            </button>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
          <div class="text-center py-8">
            <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            <p class="text-gray-500">No recent activity</p>
            <p class="text-sm text-gray-400">Start by adding your first service or updating your profile</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      min-height: calc(100vh - 80px);
    }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly projectChatService = inject(ProjectChatService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly user = this.authService.user;
  readonly userBusinesses = signal<BusinessWithCategory[]>([]);
  readonly userServices = signal<any[]>([]);
  readonly userConversations = signal<any[]>([]);
  readonly loading = signal(false);

  ngOnInit() {
    if (!this.user()) {
      this.router.navigate(['/auth']);
      return;
    }
    
    this.loadUserBusinesses();
    this.loadUserServices();
    this.loadUserConversations();
  }

  async loadUserBusinesses() {
    const currentUser = this.user();
    if (!currentUser) return;

    try {
      this.loading.set(true);
      
      const { data, error } = await this.supabaseService.getClient()
        .from('businesses')
        .select(`
          *,
          category:categories(name)
        `)
        .eq('profile_id', currentUser.id);

      if (error) {
        console.error('Error loading businesses:', error);
        return;
      }

      if (data) {
        this.userBusinesses.set(data);
      }
    } catch (err) {
      console.error('Error loading user businesses:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async loadUserServices() {
    const currentUser = this.user();
    if (!currentUser) return;

    try {
      // Get all services for user's businesses
      const { data: businesses } = await this.supabaseService.getClient()
        .from('businesses')
        .select('id')
        .eq('profile_id', currentUser.id);

      if (!businesses || businesses.length === 0) {
        this.userServices.set([]);
        return;
      }

      const businessIds = businesses.map(b => b.id);
      
      const { data: services, error } = await this.supabaseService.getClient()
        .from('services')
        .select('*')
        .in('business_id', businessIds);

      if (error) {
        console.error('Error loading services:', error);
        return;
      }

      this.userServices.set(services || []);
    } catch (err) {
      console.error('Error loading user services:', err);
    }
  }

  async loadUserConversations() {
    const currentUser = this.user();
    if (!currentUser) return;

    try {
      const conversations = await this.projectChatService.getUserConversations(currentUser.id);
      this.userConversations.set(conversations || []);
    } catch (err) {
      console.error('Error loading user conversations:', err);
    }
  }

  navigateToCreateBusiness() {
    this.router.navigate(['/create-business']);
  }

  learnMore() {
    // Scroll to a section with more information or navigate to a help page
    // For now, we can navigate to the search page to show examples
    this.router.navigate(['/search']);
  }

  openAddServiceDialog() {
    const businesses = this.userBusinesses();
    if (businesses.length === 0) {
      return;
    }

    // For now, use the first business. Later we can add business selection
    const business = businesses[0];
    
    const dialogRef = this.dialog.open(AddServiceFormComponent, {
      width: '600px',
      maxHeight: '90vh',
      data: {
        businessId: business.id,
        businessName: business.name
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh both businesses and services data
        this.loadUserBusinesses();
        this.loadUserServices();
      }
    });
  }

  viewMessages() {
    const conversations = this.userConversations();
    if (conversations.length > 0) {
      // Navigate to the most recent conversation
      this.router.navigate(['/chat', conversations[0].id]);
    }
  }

  viewBusiness(businessId: string) {
    this.router.navigate(['/business', businessId]);
  }
}
