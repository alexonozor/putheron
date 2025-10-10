import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { AuthorizationService } from '../../shared/services/authorization.service';

@Component({
  selector: 'app-permission-debug',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="p-6">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Permission Debug Information</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="space-y-4">
            <div>
              <h3 class="font-semibold">User Permissions Loaded:</h3>
              <p>{{ userPermissions() ? 'Yes' : 'No' }}</p>
            </div>

            <div *ngIf="userPermissions()">
              <h3 class="font-semibold">User ID:</h3>
              <p>{{ userPermissions()?.userId }}</p>
            </div>

            <div *ngIf="userPermissions()">
              <h3 class="font-semibold">Roles:</h3>
              <ul>
                <li *ngFor="let role of userPermissions()?.roles">
                  {{ role.name }} ({{ role.display_name }}) - Active: {{ role.is_active }}
                </li>
              </ul>
            </div>

            <div *ngIf="userPermissions()">
              <h3 class="font-semibold">All Permissions:</h3>
              <div class="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                <div *ngFor="let permission of userPermissions()?.allPermissions" 
                     class="text-sm p-1 bg-gray-100 rounded">
                  {{ permission.name }}
                </div>
              </div>
            </div>

            <div class="border-t pt-4">
              <h3 class="font-semibold">Permission Tests:</h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span>dashboard.read:</span>
                  <span [class]="hasPermission('dashboard.read') ? 'text-green-600' : 'text-red-600'">
                    {{ hasPermission('dashboard.read') ? '✅' : '❌' }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span>users.read:</span>
                  <span [class]="hasPermission('users.read') ? 'text-green-600' : 'text-red-600'">
                    {{ hasPermission('users.read') ? '✅' : '❌' }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span>roles.read:</span>
                  <span [class]="hasPermission('roles.read') ? 'text-green-600' : 'text-red-600'">
                    {{ hasPermission('roles.read') ? '✅' : '❌' }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span>businesses.read:</span>
                  <span [class]="hasPermission('businesses.read') ? 'text-green-600' : 'text-red-600'">
                    {{ hasPermission('businesses.read') ? '✅' : '❌' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="border-t pt-4">
              <h3 class="font-semibold">Role Tests:</h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span>super_admin:</span>
                  <span [class]="hasRole('super_admin') ? 'text-green-600' : 'text-red-600'">
                    {{ hasRole('super_admin') ? '✅' : '❌' }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span>admin:</span>
                  <span [class]="hasRole('admin') ? 'text-green-600' : 'text-red-600'">
                    {{ hasRole('admin') ? '✅' : '❌' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="border-t pt-4">
              <h3 class="font-semibold">Authorization Constants:</h3>
              <div class="space-y-1 text-sm">
                <div>ADMIN_ACCESS: {{ getPermissionConstant('ADMIN_ACCESS') }}</div>
                <div>USERS_VIEW: {{ getPermissionConstant('USERS_VIEW') }}</div>
                <div>ROLES_VIEW: {{ getPermissionConstant('ROLES_VIEW') }}</div>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class PermissionDebugComponent implements OnInit {
  authService = inject(AuthorizationService);

  userPermissions = this.authService.userPermissions;

  ngOnInit() {
    console.log('Permission Debug Component Initialized');
    console.log('User Permissions:', this.userPermissions());
    console.log('Permission Constants:', AuthorizationService.PERMISSIONS);
  }

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  getPermissionConstant(key: string): string {
    return (AuthorizationService.PERMISSIONS as any)[key] || 'Not found';
  }
}