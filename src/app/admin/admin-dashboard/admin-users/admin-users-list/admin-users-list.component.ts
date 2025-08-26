import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface User {
  _id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  user_mode?: 'client' | 'business_owner';
  is_active?: boolean;
  is_banned?: boolean;
  email_verified?: boolean;
  createdAt?: string;
  phone?: string;
  city?: string;
  state?: string;
  avatar_url?: string;
}

interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

@Component({
  selector: 'app-admin-users-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-users-list.component.html',
  styleUrls: ['./admin-users-list.component.scss']
})
export class AdminUsersListComponent implements OnInit {
  private router = inject(Router);
  
  // Signals for reactive state management
  users = signal<User[]>([]);
  loading = signal(false);
  selectedUsers = signal<Set<string>>(new Set());
  showDeleteModal = signal(false);
  showBulkActionModal = signal(false);
  bulkActionType = signal<'ban' | 'unban' | 'activate' | 'deactivate' | 'delete' | null>(null);
  userToDelete = signal<string | null>(null);
  
  // Filter and search states
  searchTerm = signal('');
  statusFilter = signal('all');
  roleFilter = signal('all');
  sortBy = signal('createdAt');
  sortOrder = signal<'asc' | 'desc'>('desc');
  currentPage = signal(1);
  itemsPerPage = signal(10);
  totalUsers = signal(0);
  totalPages = signal(0);

  // Computed values
  filteredUsersCount = computed(() => this.totalUsers());
  selectedCount = computed(() => this.selectedUsers().size);
  hasSelection = computed(() => this.selectedUsers().size > 0);
  allSelected = computed(() => {
    const users = this.users();
    const selected = this.selectedUsers();
    return users.length > 0 && users.every(user => selected.has(user._id));
  });
  
  // User statistics computed properties
  activeUsers = computed(() => {
    return this.users().filter(user => user.is_active && !user.is_banned).length;
  });
  
  bannedUsers = computed(() => {
    return this.users().filter(user => user.is_banned).length;
  });
  
  pendingUsers = computed(() => {
    return this.users().filter(user => !user.email_verified).length;
  });

  pageSize = computed(() => this.itemsPerPage());

  private apiUrl = `${environment.api.baseUrl}/admin`;
  
  Math = Math;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    
    let params = new HttpParams()
      .set('page', this.currentPage().toString())
      .set('limit', this.itemsPerPage().toString())
      .set('sortBy', this.sortBy())
      .set('sortOrder', this.sortOrder());

    // Add filters
    if (this.searchTerm()) {
      params = params.set('search', this.searchTerm());
    }

    if (this.statusFilter() === 'active') {
      params = params.set('isActive', 'true');
    } else if (this.statusFilter() === 'inactive') {
      params = params.set('isActive', 'false');
    } else if (this.statusFilter() === 'banned') {
      params = params.set('isBanned', 'true');
    }

    if (this.roleFilter() !== 'all') {
      params = params.set('userMode', this.roleFilter());
    }

    this.http.get<UserListResponse>(`${this.apiUrl}/users`, { params })
      .subscribe({
        next: (response) => {
          this.users.set(response.users);
          this.totalUsers.set(response.total);
          this.totalPages.set(response.totalPages);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.loading.set(false);
        }
      });
  }

  onSearch(searchValue?: string) {
    if (searchValue !== undefined) {
      this.searchTerm.set(searchValue);
    }
    this.currentPage.set(1);
    this.loadUsers();
  }

  onStatusFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.statusFilter.set(target.value);
    this.currentPage.set(1);
    this.loadUsers();
  }

  onRoleFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.roleFilter.set(target.value);
    this.currentPage.set(1);
    this.loadUsers();
  }

  onSort(field: string) {
    if (this.sortBy() === field) {
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortOrder.set('desc');
    }
    this.loadUsers();
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadUsers();
    }
  }
  
  previousPage() {
    if (this.currentPage() > 1) {
      this.onPageChange(this.currentPage() - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.onPageChange(this.currentPage() + 1);
    }
  }

  goToPage(page: number) {
    this.onPageChange(page);
  }

  getPageNumbers(): (number | string)[] {
    return this.getPages();
  }

  onItemsPerPageChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.itemsPerPage.set(parseInt(target.value));
    this.currentPage.set(1);
    this.loadUsers();
  }

  toggleUserSelection(userId: string) {
    const selected = new Set(this.selectedUsers());
    if (selected.has(userId)) {
      selected.delete(userId);
    } else {
      selected.add(userId);
    }
    this.selectedUsers.set(selected);
  }

  toggleAllSelection() {
    const users = this.users();
    const selected = new Set(this.selectedUsers());
    
    if (this.allSelected()) {
      users.forEach(user => selected.delete(user._id));
    } else {
      users.forEach(user => selected.add(user._id));
    }
    
    this.selectedUsers.set(selected);
  }

  // Single user actions
  banUser(userId: string) {
    this.http.patch(`${this.apiUrl}/users/${userId}/ban`, { isBanned: true, banReason: 'Banned by admin' })
      .subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (error) => console.error('Error banning user:', error)
      });
  }

  unbanUser(userId: string) {
    this.http.patch(`${this.apiUrl}/users/${userId}/ban`, { isBanned: false })
      .subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (error) => console.error('Error unbanning user:', error)
      });
  }

  toggleUserStatus(userId: string, isActive: boolean) {
    this.http.patch(`${this.apiUrl}/users/${userId}/status`, { isActive })
      .subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (error) => console.error('Error updating user status:', error)
      });
  }

  deleteUser(userId: string) {
    this.userToDelete.set(userId);
    this.showDeleteModal.set(true);
  }

  cancelDelete() {
    this.showDeleteModal.set(false);
    this.userToDelete.set(null);
  }

  confirmDelete() {
    const userId = this.userToDelete();
    if (userId) {
      this.http.delete(`${this.apiUrl}/users/${userId}`)
        .subscribe({
          next: () => {
            this.loadUsers();
            this.showDeleteModal.set(false);
            this.userToDelete.set(null);
          },
          error: (error) => console.error('Error deleting user:', error)
        });
    }
  }

  // Bulk actions
  performBulkAction(action: 'ban' | 'unban' | 'activate' | 'deactivate' | 'delete') {
    this.bulkActionType.set(action);
    this.showBulkActionModal.set(true);
  }

  confirmBulkAction() {
    const userIds = Array.from(this.selectedUsers());
    const action = this.bulkActionType();

    if (!action || userIds.length === 0) return;

    let request;

    switch (action) {
      case 'ban':
        request = this.http.patch(`${this.apiUrl}/users/bulk-ban`, { 
          userIds, 
          isBanned: true, 
          banReason: 'Bulk banned by admin' 
        });
        break;
      case 'unban':
        request = this.http.patch(`${this.apiUrl}/users/bulk-ban`, { 
          userIds, 
          isBanned: false 
        });
        break;
      case 'activate':
        request = this.http.patch(`${this.apiUrl}/users/bulk-status`, { 
          userIds, 
          isActive: true 
        });
        break;
      case 'deactivate':
        request = this.http.patch(`${this.apiUrl}/users/bulk-status`, { 
          userIds, 
          isActive: false 
        });
        break;
      case 'delete':
        request = this.http.delete(`${this.apiUrl}/users/bulk-delete`, { 
          body: { userIds } 
        });
        break;
      default:
        return;
    }

    request.subscribe({
      next: () => {
        this.loadUsers();
        this.selectedUsers.set(new Set());
        this.showBulkActionModal.set(false);
        this.bulkActionType.set(null);
      },
      error: (error) => {
        console.error('Error performing bulk action:', error);
        this.showBulkActionModal.set(false);
      }
    });
  }

  exportUsers(format: 'json' | 'csv' = 'json') {
    const filters = {
      status: this.statusFilter() !== 'all' ? this.statusFilter() : undefined,
      role: this.roleFilter() !== 'all' ? this.roleFilter() : undefined
    };

    this.http.get(`${this.apiUrl}/users/export`, {
      params: { format, filters: JSON.stringify(filters) }
    }).subscribe({
      next: (response: any) => {
        if (format === 'csv') {
          this.downloadFile(response.data.data, 'users.csv', 'text/csv');
        } else {
          this.downloadFile(JSON.stringify(response.data.data, null, 2), 'users.json', 'application/json');
        }
      },
      error: (error) => console.error('Error exporting users:', error)
    });
  }

  private downloadFile(data: string, filename: string, type: string) {
    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  getUserStatusBadge(user: User): string {
    if (user.is_banned) return 'bg-red-100 text-red-800';
    if (!user.is_active) return 'bg-gray-100 text-gray-800';
    return 'bg-green-100 text-green-800';
  }

  getUserStatusText(user: User): string {
    if (user.is_banned) return 'Banned';
    if (!user.is_active) return 'Inactive';
    return 'Active';
  }

  getRoleText(user: User): string {
    return user.user_mode === 'business_owner' ? 'Business Owner' : 'Customer';
  }

  getRoleBadgeClass(userMode: string): string {
    const classMap: Record<string, string> = {
      'client': 'bg-blue-100 text-blue-800',
      'business_owner': 'bg-green-100 text-green-800'
    };
    return classMap[userMode] || 'bg-gray-100 text-gray-800';
  }

  getFullName(user: User): string {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return 'No name';
  }

  // Modal handlers
  closeDeleteModal() {
    this.showDeleteModal.set(false);
  }

  closeBulkActionModal() {
    this.showBulkActionModal.set(false);
    this.bulkActionType.set(null);
  }

  getPages(): number[] {
    const totalPages = this.totalPages();
    const currentPage = this.currentPage();
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots.filter((item, index, arr) => arr.indexOf(item) === index) as number[];
  }

  // Filter and pagination methods
  onFilter() {
    this.currentPage.set(1);
    this.loadUsers();
  }

  clearFilters() {
    this.searchTerm.set('');
    this.statusFilter.set('all');
    this.roleFilter.set('all');
    this.currentPage.set(1);
    this.loadUsers();
  }

  onPageSizeChange() {
    this.currentPage.set(1);
    this.loadUsers();
  }

  // Selection methods
  selectAll(event: any) {
    const isChecked = event.target.checked;
    if (isChecked) {
      const users = this.users();
      const newSelected = new Set(this.selectedUsers());
      users.forEach(user => newSelected.add(user._id));
      this.selectedUsers.set(newSelected);
    } else {
      this.selectedUsers.set(new Set());
    }
  }

  // User action methods
  viewUserDetails(userId: string) {
    // Navigate to user details
    this.router.navigate(['/admin/dashboard/users', userId]);
  }

  toggleBanUser(user: User) {
    // Toggle ban status for single user
    console.log('Toggle ban user:', user._id);
  }
}
