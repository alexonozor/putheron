import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../shared/services/auth.service';
import { SupabaseService } from '../shared/services/supabase.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-2xl mx-auto">
        <h1 class="text-3xl font-bold text-gray-900 mb-6">Profile</h1>
        
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center space-x-4 mb-6">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span class="text-blue-600 text-xl font-semibold">
                {{ userInitials() }}
              </span>
            </div>
            <div>
              <h2 class="text-xl font-semibold text-gray-900">{{ user()?.user_metadata?.['full_name'] || 'User' }}</h2>
              <p class="text-gray-600">{{ user()?.email }}</p>
            </div>
          </div>
          
          <div class="border-t pt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-700">Email</label>
                <p class="mt-1 text-sm text-gray-900">{{ user()?.email }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Member Since</label>
                <p class="mt-1 text-sm text-gray-900">{{ memberSince() }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Account Status</label>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
            </div>
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
export class ProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);

  readonly user = this.authService.user;
  readonly userInitials = computed(() => {
    if (!this.user()?.user_metadata?.['full_name']) {
      return this.user()?.email?.charAt(0).toUpperCase() || 'U';
    }
    const names = this.user()!.user_metadata['full_name'].split(' ');
    return names.map((name: string) => name.charAt(0)).join('').toUpperCase().slice(0, 2);
  });

  readonly memberSince = computed(() => {
    if (!this.user()?.created_at) return 'Unknown';
    return new Date(this.user()!.created_at).toLocaleDateString();
  });

  ngOnInit() {
    if (!this.user()) {
      this.router.navigate(['/auth']);
    }
  }
}
