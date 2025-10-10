import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RoleService, Role, UserRole, AssignRoleDto } from '../../../../shared/services/role.service';

interface User {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName: string;
  isActive?: boolean;
  profilePicture?: string;
}

@Component({
  selector: 'app-user-role-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user-role-assignment.component.html',
  styleUrl: './user-role-assignment.component.scss'
})
export class UserRoleAssignmentComponent implements OnInit {
  private readonly roleService = inject(RoleService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  // Signals for reactive state
  allUserRoles = signal<UserRole[]>([]);
  availableRoles = signal<Role[]>([]);
  filteredUserRoles = signal<UserRole[]>([]);

  // Form and UI state
  assignForm: FormGroup;
  showAssignForm = false;
  isLoading = false;
  isAssigning = false;
  errorMessage = '';
  successMessage = '';
  
  // Filters
  searchTerm = '';
  selectedRole = '';
  showOnlyActive = true;
  showExpiring = false;

  // Mock users data (would come from a user service in real app)
  mockUsers: User[] = [
    { _id: '1', username: 'john_doe', email: 'john@example.com', firstName: 'John', lastName: 'Doe', isActive: true },
    { _id: '2', username: 'jane_smith', email: 'jane@example.com', firstName: 'Jane', lastName: 'Smith', isActive: true },
    { _id: '3', username: 'admin_user', email: 'admin@example.com', firstName: 'Admin', lastName: 'User', isActive: true },
    { _id: '4', username: 'test_user', email: 'test@example.com', firstName: 'Test', lastName: 'User', isActive: false }
  ];

  constructor() {
    this.assignForm = this.fb.group({
      user_id: ['', Validators.required],
      role_id: ['', Validators.required],
      expires_at: [''],
      notes: ['']
    });
  }

  async ngOnInit() {
    await this.loadRoles();
    await this.loadUserRoles();
  }

  // ============= DATA LOADING =============

  async loadRoles() {
    try {
      const roles = await this.roleService.getAllRolesAsync({
        is_active: true
      });
      this.availableRoles.set(roles);
    } catch (error: any) {
      console.error('Failed to load roles:', error);
    }
  }

  async loadUserRoles() {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      
      // In a real application, you would have an endpoint to get all user role assignments
      // For now, we'll use mock data or try to get assignments for each user
      const mockUserRoles: UserRole[] = [
        {
          _id: '1',
          user_id: '1',
          role_id: this.availableRoles()[0]?._id || '1',
          assigned_by: '3',
          assigned_at: new Date('2024-01-15'),
          is_active: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15')
        },
        {
          _id: '2',
          user_id: '2',
          role_id: this.availableRoles()[1]?._id || '2',
          assigned_by: '3',
          assigned_at: new Date('2024-01-20'),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          is_active: true,
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date('2024-01-20')
        }
      ];
      
      this.allUserRoles.set(mockUserRoles);
      this.filterUserRoles();
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to load user roles';
    } finally {
      this.isLoading = false;
    }
  }

  // ============= FILTERING =============

  filterUserRoles() {
    let filtered = [...this.allUserRoles()];

    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(userRole => {
        const userName = this.getUserName(userRole.user_id).toLowerCase();
        const userEmail = this.getUserEmail(userRole.user_id).toLowerCase();
        const roleName = this.getRoleName(userRole.role_id).toLowerCase();
        
        return userName.includes(term) || 
               userEmail.includes(term) || 
               roleName.includes(term);
      });
    }

    // Apply role filter
    if (this.selectedRole) {
      filtered = filtered.filter(userRole => userRole.role_id === this.selectedRole);
    }

    // Apply active filter
    if (this.showOnlyActive) {
      filtered = filtered.filter(userRole => userRole.is_active);
    }

    // Apply expiring filter
    if (this.showExpiring) {
      filtered = filtered.filter(userRole => this.isExpiringSoon(userRole));
    }

    // Sort by assignment date (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.assigned_at || a.createdAt || new Date()).getTime();
      const dateB = new Date(b.assigned_at || b.createdAt || new Date()).getTime();
      return dateB - dateA;
    });

    this.filteredUserRoles.set(filtered);
  }

  // ============= FORM MANAGEMENT =============

  closeAssignForm(event?: Event) {
    if (event && (event.target as HTMLElement).classList.contains('modal-content')) {
      return;
    }
    
    this.showAssignForm = false;
    this.assignForm.reset();
  }

  async assignRole() {
    if (this.assignForm.invalid) return;

    try {
      this.isAssigning = true;
      this.errorMessage = '';

      const formValue = this.assignForm.value;
      const assignmentData: AssignRoleDto = {
        user_id: formValue.user_id,
        role_id: formValue.role_id,
        expires_at: formValue.expires_at ? new Date(formValue.expires_at) : undefined,
        notes: formValue.notes?.trim() || undefined
      };

      await this.roleService.assignRoleAsync(assignmentData);
      this.successMessage = 'Role assigned successfully';
      await this.loadUserRoles();
      this.closeAssignForm();
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to assign role';
    } finally {
      this.isAssigning = false;
    }
  }

  // ============= USER ROLE OPERATIONS =============

  async removeRole(userRole: UserRole) {
    const userName = this.getUserName(userRole.user_id);
    const roleName = this.getRoleName(userRole.role_id);
    
    if (!confirm(`Are you sure you want to remove the role "${roleName}" from user "${userName}"?`)) {
      return;
    }

    try {
      await this.roleService.removeRoleAsync(userRole.user_id.toString(), userRole.role_id.toString());
      this.successMessage = 'Role removed successfully';
      await this.loadUserRoles();
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to remove role';
    }
  }

  async extendExpiry(userRole: UserRole) {
    // TODO: Implement extend expiry functionality
    // This could open a modal to select new expiry date
    console.log('Extend expiry for:', userRole);
  }

  viewUserDetails(userRole: UserRole) {
    // TODO: Implement user details view
    // This could open a modal with user permissions and role details
    console.log('View details for:', userRole);
  }

  // ============= ROLE USER MANAGEMENT =============

  viewRoleUsers(role: Role) {
    // TODO: Implement role users modal component
    console.log('View users for role:', role);
    this.snackBar.open(`Viewing users for role: ${role.display_name || role.name}`, 'Close', {
      duration: 3000,
    });
  }

  // ============= UTILITY METHODS =============

  getUserName(userId: any): string {
    const user = this.mockUsers.find(u => u._id === userId.toString());
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
  }

  getUserInitials(userId: any): string {
    const user = this.mockUsers.find(u => u._id === userId.toString());
    if (!user) return 'UK';
    
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    } else if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    
    return 'UK';
  }

  getUserEmail(userId: any): string {
    const user = this.mockUsers.find(u => u._id === userId.toString());
    return user?.email || 'unknown@example.com';
  }

  getRoleName(roleId: any): string {
    const role = this.availableRoles().find(r => r._id === roleId.toString());
    return role ? (role.display_name || role.name) : 'Unknown Role';
  }

  getRoleColor(roleId: any): string {
    const role = this.availableRoles().find(r => r._id === roleId.toString());
    return role?.color || '#6366f1';
  }

  getRolePermissionCount(roleId: any): number {
    const role = this.availableRoles().find(r => r._id === roleId.toString());
    return role ? this.getPermissionCount(role) : 0;
  }

  getPermissionCount(role: Role): number {
    return Array.isArray(role.permissions) ? role.permissions.length : 0;
  }

  getAssignedByName(assignedById: any): string {
    if (!assignedById) return '';
    const user = this.mockUsers.find(u => u._id === assignedById.toString());
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown';
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

  trackByUserRoleId(index: number, userRole: UserRole): string {
    return userRole._id;
  }

  // ============= STATISTICS =============

  getTotalUsers(): number {
    const uniqueUsers = new Set(this.allUserRoles().map(ur => ur.user_id.toString()));
    return uniqueUsers.size;
  }

  getActiveAssignments(): number {
    return this.allUserRoles().filter(ur => ur.is_active).length;
  }

  getExpiringAssignments(): number {
    return this.allUserRoles().filter(ur => this.isExpiringSoon(ur)).length;
  }

  getMostUsedRole(): string {
    const roleCounts = this.allUserRoles().reduce((acc, ur) => {
      const roleId = ur.role_id.toString();
      acc[roleId] = (acc[roleId] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const mostUsedRoleId = Object.keys(roleCounts).reduce((a, b) => 
      roleCounts[a] > roleCounts[b] ? a : b, '');

    return mostUsedRoleId ? this.getRoleName(mostUsedRoleId) : 'None';
  }

  getRoleUserCount(roleId: string): number {
    return this.allUserRoles().filter(ur => ur.role_id.toString() === roleId && ur.is_active).length;
  }

  trackByRoleId(index: number, role: Role): string {
    return role._id;
  }
}