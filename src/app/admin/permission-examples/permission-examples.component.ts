import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { HasPermissionDirective } from '../../shared/directives/permission.directive';
import { HasPermissionPipe } from '../../shared/pipes/permission.pipe';
import { AuthorizationService } from '../../shared/services/authorization.service';

@Component({
  selector: 'app-permission-examples',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    HasPermissionDirective,
    HasPermissionPipe
  ],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-8">Permission System Examples</h1>
      
      <!-- Current User Info -->
      <mat-card class="mb-6">
        <mat-card-header>
          <mat-card-title>Current User Permissions</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 class="font-semibold mb-2">Current Roles:</h4>
              <div class="flex flex-wrap gap-2">
                <mat-chip *ngFor="let role of userRoles()" 
                         class="bg-blue-100 text-blue-800">
                  {{ role }}
                </mat-chip>
              </div>
            </div>
            <div>
              <h4 class="font-semibold mb-2">Permission Count:</h4>
              <p class="text-2xl font-bold text-green-600">{{ userPermissionCount() }}</p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- hasPermission Directive Examples -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <mat-card>
          <mat-card-header>
            <mat-card-title>hasPermission Directive Examples</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <!-- Single permission -->
            <div *hasPermission="'users.view'" class="mb-4 p-3 bg-green-100 rounded">
              ✅ You can view users
            </div>
            
            <!-- Multiple permissions (any) -->
            <div *hasPermission="['users.create', 'users.edit']; hasPermissionRequireAll: false" 
                 class="mb-4 p-3 bg-blue-100 rounded">
              ✅ You can create OR edit users
            </div>
            
            <!-- Multiple permissions (all) -->
            <div *hasPermission="['users.view', 'users.edit']; hasPermissionRequireAll: true" 
                 class="mb-4 p-3 bg-purple-100 rounded">
              ✅ You can both view AND edit users
            </div>
            
            <!-- With else template -->
            <div *hasPermission="'system.config'; else: noSystemAccess">
              ✅ You have system configuration access
            </div>
            <ng-template #noSystemAccess>
              <div class="p-3 bg-red-100 rounded text-red-800">
                ❌ No system configuration access
              </div>
            </ng-template>
          </mat-card-content>
        </mat-card>

        <!-- Permission Pipe Examples -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>Permission Pipe Examples</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="space-y-2">
              <p [class.text-green-600]="'users.view' | hasPermission">
                Users View: {{ ('users.view' | hasPermission) ? '✅' : '❌' }}
              </p>
              
              <p [class.text-green-600]="'users.create' | hasPermission">
                Users Create: {{ ('users.create' | hasPermission) ? '✅' : '❌' }}
              </p>
              
              <p [class.text-green-600]="'roles.manage' | hasPermission">
                Role Management: {{ ('roles.manage' | hasPermission) ? '✅' : '❌' }}
              </p>
              
              <p [class.text-green-600]="'system.config' | hasPermission">
                System Config: {{ ('system.config' | hasPermission) ? '✅' : '❌' }}
              </p>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Action Buttons Example -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>Permission-based Action Buttons</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="flex flex-wrap gap-2">
              <button *hasPermission="'users.create'" 
                      mat-raised-button color="primary">
                <mat-icon>add</mat-icon>
                Create User
              </button>
              
              <button *hasPermission="'users.edit'" 
                      mat-raised-button color="accent">
                <mat-icon>edit</mat-icon>
                Edit User
              </button>
              
              <button *hasPermission="'users.delete'" 
                      mat-raised-button color="warn">
                <mat-icon>delete</mat-icon>
                Delete User
              </button>
              
              <button *hasPermission="'roles.manage'" 
                      mat-raised-button>
                <mat-icon>settings</mat-icon>
                Manage Roles
              </button>
              
              <button *hasPermission="'business.create'" 
                      mat-stroked-button>
                <mat-icon>business</mat-icon>
                Create Business
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Authorization Service Info -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>Authorization Service Info</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="space-y-2">
              <p><strong>Has Admin Role:</strong> {{ hasAdminRole() ? '✅' : '❌' }}</p>
              <p><strong>Current User ID:</strong> {{ currentUserId() || 'Not logged in' }}</p>
              <p><strong>Permissions Loaded:</strong> {{ permissionsLoaded() ? '✅' : '❌' }}</p>
            </div>
            
            <div *hasPermission="'system.debug'" class="mt-4 p-3 bg-gray-100 rounded">
              <h4 class="font-semibold mb-2">Debug Info (Admin Only):</h4>
              <div class="max-h-32 overflow-y-auto text-xs">
                <div *ngFor="let permission of allUserPermissions()" class="mb-1">
                  {{ permission }}
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `
})
export class PermissionExamplesComponent {
  private readonly authService = inject(AuthorizationService);

  // Computed signals for reactive data
  userRoles = computed(() => this.authService.activeRoles().map(role => role.display_name || role.name));
  userPermissionCount = computed(() => this.authService.allPermissions().length);
  hasAdminRole = computed(() => this.authService.hasRole('admin'));
  currentUserId = computed(() => this.authService.userPermissions()?.userId || null);
  permissionsLoaded = computed(() => this.authService.userPermissions() !== null);
  allUserPermissions = computed(() => this.authService.permissionNames());

  getPermissionCategories() {
    const grouped = this.authService.getPermissionsByCategory();
    return Object.keys(grouped).map(key => ({
      name: key,
      count: grouped[key].length
    }));
  }
}