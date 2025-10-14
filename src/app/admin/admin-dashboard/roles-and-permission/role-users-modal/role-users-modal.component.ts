import { Component, OnInit, inject, Inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of, startWith, Subscription } from 'rxjs';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RoleService, Role, UserRole, AssignRoleDto } from '../../../../shared/services/role.service';
import { UserService, User } from '../../../../shared/services/user.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { AuthorizationService } from '../../../../shared/services/authorization.service';
export interface RoleUsersModalData {
  role: Role;
}

@Component({
  selector: 'app-role-users-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatCardModule,
    MatTooltipModule
  ],
  providers: [
    provideNativeDateAdapter()
  ],
  templateUrl: './role-users-modal.component.html',
  styleUrl: './role-users-modal.component.scss'
})
export class RoleUsersModalComponent implements OnInit, OnDestroy {
  private readonly roleService = inject(RoleService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly authorizationService = inject(AuthorizationService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<RoleUsersModalComponent>);
  
  private searchSubscription?: Subscription;

  // Signals for reactive state
  roleUsers = signal<UserRole[]>([]);
  allUsers = signal<User[]>([]);
  filteredUsers = signal<User[]>([]);
  
  // Form state
  assignForm: FormGroup;
  isLoading = false;
  isLoadingUsers = false;
  isAssigning = false;
  userSearchControl = this.fb.control('');

  // Date picker configuration
  minDate = new Date(); // Prevent selecting past dates

  // Computed available users (excluding already assigned users)
  availableUsers = computed(() => {
    const assignedUserIds = this.roleUsers().map(ur => {
      // Handle both populated user objects and string IDs
      if (typeof ur.user_id === 'object' && ur.user_id !== null && '_id' in ur.user_id) {
        return (ur.user_id as any)._id;
      }
      return ur.user_id?.toString() || '';
    });
    return this.allUsers().filter(user => 
      user.isActive !== false && !assignedUserIds.includes(user._id)
    );
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: RoleUsersModalData
  ) {
    this.assignForm = this.fb.group({
      user_id: ['', Validators.required],
      expires_at: ['', [this.futureDateValidator]],
      notes: ['']
    });

    // Set up real-time server search with debouncing
    this.setupUserSearch();
  }

  async ngOnInit() {
    await this.loadRoleUsers();
    // Don't load users initially - let them search when they type
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
  }

  // ============= SEARCH SETUP =============

  private setupUserSearch() {
    this.searchSubscription = this.userSearchControl.valueChanges.pipe(
      debounceTime(300), // Wait 300ms after user stops typing
      distinctUntilChanged(), // Only search if the term changed
      switchMap((searchTerm: string | null) => {
        const term = (searchTerm || '').trim();
        
        // Only search if user has typed something (minimum 2 characters for efficiency)
        if (!term || term.length < 2) {
          this.isLoadingUsers = false;
          return of({ success: true, data: [] });
        }

        this.isLoadingUsers = true;
        return this.userService.getAllUsers({
          isActive: true,
          search: term,
          limit: 50
        }).pipe(
          catchError(error => {
            console.error('Search failed:', error);
            this.isLoadingUsers = false;
            return of({ success: false, data: [] });
          })
        );
      })
    ).subscribe(response => {
      this.isLoadingUsers = false;
      if (response.success && response.data) {
        this.allUsers.set(response.data);
        this.filteredUsers.set(this.availableUsers());
      } else {
        this.allUsers.set([]);
        this.filteredUsers.set([]);
      }
    });
  }

  private async searchUsers(searchTerm: string) {
    try {
      // Only search if we have a meaningful search term
      const term = searchTerm.trim();
      if (!term || term.length < 2) {
        this.allUsers.set([]);
        this.filteredUsers.set([]);
        return;
      }

      this.isLoadingUsers = true;
      const users = await this.userService.getAllUsersAsync({
        isActive: true,
        search: term,
        limit: 50
      });
      
      console.log('Loaded users from API:', users);
      this.allUsers.set(users || []);
      this.filteredUsers.set(this.availableUsers());
    } catch (error: any) {
      console.error('Failed to load users:', error);
      this.allUsers.set([]);
      this.filteredUsers.set([]);
    } finally {
      this.isLoadingUsers = false;
    }
  }

  // ============= DATA LOADING =============



  // ============= DATA LOADING =============

  async loadRoleUsers() {
    try {
      this.isLoading = true;
      console.log('Loading users for role:', this.data.role._id);
      const users = await this.roleService.getRoleUsersAsync(this.data.role._id);
      console.log('Loaded role users:', users);
      this.roleUsers.set(users);
      
      // Update filtered users after loading role users
      this.filteredUsers.set(this.availableUsers());
    } catch (error: any) {
      console.error('Failed to load role users:', error);
      this.snackBar.open('Failed to load role users', 'Close', { duration: 3000 });
      this.roleUsers.set([]); // Set empty array on error
    } finally {
      this.isLoading = false;
    }
  }

  // ============= USER ASSIGNMENT =============

  async assignUserToRole() {
    if (this.assignForm.invalid) {
      console.log('Form is invalid:', this.assignForm.errors);
      return;
    }

    try {
      this.isAssigning = true;
      
      const formValue = this.assignForm.value;
      console.log('Form values:', formValue);
      
      const assignmentData: AssignRoleDto = {
        user_id: formValue.user_id,
        role_id: this.data.role._id,
        expires_at: formValue.expires_at ? new Date(formValue.expires_at) : undefined,
        notes: formValue.notes?.trim() || undefined
      };

      console.log('Assignment data:', assignmentData);
      await this.roleService.assignRoleAsync(assignmentData);
      
      this.snackBar.open('User assigned to role successfully', 'Close', { duration: 3000 });
      
      // Reset the form and clear search
      this.assignForm.reset();
      this.userSearchControl.setValue('');
      
      // Reload data
      await this.loadRoleUsers();
      
      // If the assigned user is the current logged-in user, refresh their permissions
      const currentUser = this.authService.user();
      if (currentUser && currentUser._id === assignmentData.user_id) {
        console.log('Refreshing permissions for current user after role assignment');
        await this.authorizationService.refreshPermissions(currentUser._id);
        this.snackBar.open('Your permissions have been updated!', 'Close', { duration: 3000 });
      }
      
    } catch (error: any) {
      console.error('Failed to assign user:', error);
      this.snackBar.open(error.message || 'Failed to assign user to role', 'Close', { duration: 5000 });
    } finally {
      this.isAssigning = false;
    }
  }

  async removeUserFromRole(userRole: UserRole) {
    const user = this.getUser(userRole);
    const userName = this.getUserDisplayName(user);
    
    if (!confirm(`Are you sure you want to remove "${userName}" from the role "${this.data.role.display_name || this.data.role.name}"?`)) {
      return;
    }

    try {
      // Extract the user ID - handle both populated object and string ID
      const userId = typeof userRole.user_id === 'object' && userRole.user_id !== null && '_id' in userRole.user_id 
        ? (userRole.user_id as any)._id 
        : userRole.user_id?.toString() || '';
      
      await this.roleService.removeRoleAsync(userId, this.data.role._id);
      this.snackBar.open('User removed from role successfully', 'Close', { duration: 3000 });
      
      // Check if the removed user is the current user and refresh permissions if needed
      const currentUser = this.authService.currentUser;
      if (currentUser && currentUser._id === userId) {
        console.log('Current user was removed from role, refreshing permissions...');
        this.authorizationService.loadUserPermissions(userId);
      }
      
      await this.loadRoleUsers();
    } catch (error: any) {
      console.error('Failed to remove user:', error);
      this.snackBar.open(error.message || 'Failed to remove user from role', 'Close', { duration: 5000 });
    }
  }

  async extendExpiry(userRole: UserRole) {
    // TODO: Implement extend expiry functionality with date picker dialog
    console.log('Extend expiry for:', userRole);
    this.snackBar.open('Extend expiry functionality coming soon', 'Close', { duration: 3000 });
  }

  // ============= AUTOCOMPLETE METHODS =============

  displayUser = (user: User): string => {
    return user ? `${this.getUserDisplayName(user)} (${user.email})` : '';
  }

  onUserSelected(event: any) {
    const selectedUser = event.option.value;
    if (selectedUser) {
      this.assignForm.patchValue({ user_id: selectedUser._id });
    }
  }

  // ============= UTILITY METHODS =============

  getUserById(userId: any): User | undefined {
    return this.allUsers().find((u: User) => u._id === userId.toString());
  }

  // Handle both populated user objects and user IDs
  getUser(userRole: UserRole): User | undefined {
    // Check if user_id is already populated (object with _id, email, etc.)
    if (userRole.user_id && typeof userRole.user_id === 'object' && '_id' in userRole.user_id) {
      return userRole.user_id as User;
    }
    // Fallback to lookup by ID
    return this.getUserById(userRole.user_id);
  }

  getUserDisplayName(user: User | undefined): string {
    if (!user) return 'Unknown User';
    // Handle both naming conventions: firstName/lastName and first_name/last_name
    const firstName = (user as any).first_name || user.firstName || '';
    const lastName = (user as any).last_name || user.lastName || '';
    return `${firstName} ${lastName}`.trim() || user.username || user.email;
  }

  getUserInitials(user: User | undefined): string {
    if (!user) return 'UK';
    // Handle both naming conventions: firstName/lastName and first_name/last_name
    const firstName = (user as any).first_name || user.firstName || (user.username || '') || user.email || 'U';
    const lastName = (user as any).last_name || user.lastName || (user.username || '').charAt(1) || user.email || 'K';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  getPermissionCount(): number {
    return Array.isArray(this.data.role.permissions) ? this.data.role.permissions.length : 0;
  }

  isExpiringSoon(userRole: UserRole): boolean {
    if (!userRole.expires_at) return false;
    const expiryDate = new Date(userRole.expires_at);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  }

  getStatusClass(userRole: UserRole): string {
    if (!userRole.is_active) return 'inactive';
    if (userRole.expires_at) {
      const expiryDate = new Date(userRole.expires_at);
      const now = new Date();
      if (expiryDate < now) return 'expired';
      if (this.isExpiringSoon(userRole)) return 'expiring';
    }
    return 'active';
  }

  getStatusText(userRole: UserRole): string {
    const statusClass = this.getStatusClass(userRole);
    switch (statusClass) {
      case 'inactive': return 'Inactive';
      case 'expired': return 'Expired';
      case 'expiring': return 'Expiring Soon';
      default: return 'Active';
    }
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  // Custom validator to ensure selected date is not in the past
  futureDateValidator(control: any) {
    if (!control.value) {
      return null; // Allow empty values (optional field)
    }
    
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to beginning of day
    
    if (selectedDate < today) {
      return { pastDate: { message: 'Expiry date cannot be in the past' } };
    }
    
    return null;
  }

  // Open date picker when input or icon is clicked
  openDatePicker(picker: any) {
    picker.open();
  }

  trackByUserRole(index: number, userRole: UserRole): string {
    return userRole._id;
  }
}