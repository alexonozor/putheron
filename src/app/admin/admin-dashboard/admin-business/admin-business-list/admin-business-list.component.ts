import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { BusinessService, Business } from '../../../../shared/services/business.service';

@Component({
  selector: 'app-admin-business-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './admin-business-list.component.html',
  styleUrl: './admin-business-list.component.scss'
})
export class AdminBusinessListComponent implements OnInit {
  private readonly businessService = inject(BusinessService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly businesses = signal<Business[]>([]);
  readonly filteredBusinesses = signal<Business[]>([]);
  readonly selectedBusinesses = signal<Set<string>>(new Set());
  readonly searchQuery = signal('');
  readonly statusFilter = signal('all');
  readonly featuredFilter = signal('all');

  displayedColumns: string[] = ['select', 'name', 'owner', 'status', 'rating', 'actions'];

  statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  featuredOptions = [
    { value: 'all', label: 'All' },
    { value: 'featured', label: 'Featured Only' },
    { value: 'not-featured', label: 'Not Featured' }
  ];

  ngOnInit() {
    this.loadBusinesses();
    this.setupFilters();
  }

  setupFilters() {
    // Watch for changes in search and filters
    const updateFilters = () => {
      const query = this.searchQuery().toLowerCase();
      const status = this.statusFilter();
      const featured = this.featuredFilter();
      
      let filtered = this.businesses();
      
      // Apply search filter
      if (query) {
        filtered = filtered.filter(business => 
          business.name.toLowerCase().includes(query) ||
          business.city?.toLowerCase().includes(query) ||
          business.state?.toLowerCase().includes(query) ||
          business.contact_email?.toLowerCase().includes(query)
        );
      }
      
      // Apply status filter
      if (status !== 'all') {
        filtered = filtered.filter(business => business.status === status);
      }
      
      // Apply featured filter
      if (featured === 'featured') {
        filtered = filtered.filter(business => business.is_featured);
      } else if (featured === 'not-featured') {
        filtered = filtered.filter(business => !business.is_featured);
      }
      
      this.filteredBusinesses.set(filtered);
    };

    // Initial filter setup
    updateFilters();
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
    this.setupFilters();
  }

  onStatusFilterChange(status: string) {
    this.statusFilter.set(status);
    this.setupFilters();
  }

  onFeaturedFilterChange(featured: string) {
    this.featuredFilter.set(featured);
    this.setupFilters();
  }

  async loadBusinesses() {
    this.loading.set(true);
    try {
      const businesses = await this.businessService.getMyBusinessesAsync();
      this.businesses.set(businesses);
      this.filteredBusinesses.set(businesses);
    } catch (error: any) {
      console.error('Error loading businesses:', error);
    } finally {
      this.loading.set(false);
    }
  }

  // Selection methods
  toggleBusinessSelection(businessId: string) {
    const selected = new Set(this.selectedBusinesses());
    if (selected.has(businessId)) {
      selected.delete(businessId);
    } else {
      selected.add(businessId);
    }
    this.selectedBusinesses.set(selected);
  }

  toggleAllSelection() {
    const selected = this.selectedBusinesses();
    if (selected.size === this.filteredBusinesses().length) {
      // Deselect all
      this.selectedBusinesses.set(new Set());
    } else {
      // Select all
      const allIds = new Set(this.filteredBusinesses().map(b => b._id));
      this.selectedBusinesses.set(allIds);
    }
  }

  isBusinessSelected(businessId: string): boolean {
    return this.selectedBusinesses().has(businessId);
  }

  isAllSelected(): boolean {
    return this.selectedBusinesses().size === this.filteredBusinesses().length && this.filteredBusinesses().length > 0;
  }

  isIndeterminate(): boolean {
    const selectedCount = this.selectedBusinesses().size;
    return selectedCount > 0 && selectedCount < this.filteredBusinesses().length;
  }

  // Bulk actions
  bulkVerifyBusinesses() {
    const selectedIds = Array.from(this.selectedBusinesses());
    if (selectedIds.length === 0) return;

    this.loading.set(true);
    this.businessService.adminBulkVerifyBusinessesAsync(selectedIds)
      .then(result => {
        if (result.verified.length > 0) {
          // Update verified businesses in our local array
          const businesses = this.businesses();
          businesses.forEach(business => {
            if (result.verified.includes(business._id)) {
              business.status = 'approved';
            }
          });
          this.businesses.set([...businesses]);
          this.setupFilters();
          this.clearSelection();
          
          const message = `${result.verified.length} business(es) verified successfully.`;
          const failedMessage = result.failed.length > 0 ? ` ${result.failed.length} failed.` : '';
          alert(message + failedMessage);
        }
      })
      .catch(error => {
        console.error('Error bulk verifying businesses:', error);
        alert('Failed to verify selected businesses');
      })
      .finally(() => {
        this.loading.set(false);
      });
  }

  bulkToggleFeatured(featured: boolean) {
    const selectedIds = Array.from(this.selectedBusinesses());
    if (selectedIds.length === 0) return;

    this.loading.set(true);
    this.businessService.adminBulkToggleFeaturedAsync(selectedIds, featured)
      .then(result => {
        if (result.updated.length > 0) {
          // Update businesses in our local array
          const businesses = this.businesses();
          businesses.forEach(business => {
            if (result.updated.includes(business._id)) {
              business.is_featured = featured;
            }
          });
          this.businesses.set([...businesses]);
          this.setupFilters();
          this.clearSelection();
          
          const action = featured ? 'featured' : 'unfeatured';
          const message = `${result.updated.length} business(es) ${action} successfully.`;
          const failedMessage = result.failed.length > 0 ? ` ${result.failed.length} failed.` : '';
          alert(message + failedMessage);
        }
      })
      .catch(error => {
        console.error('Error bulk updating featured status:', error);
        alert('Failed to update featured status for selected businesses');
      })
      .finally(() => {
        this.loading.set(false);
      });
  }

  bulkDeleteBusinesses() {
    const selectedIds = Array.from(this.selectedBusinesses());
    if (selectedIds.length === 0) return;

    if (confirm(`Are you sure you want to delete ${selectedIds.length} selected businesses?`)) {
      this.loading.set(true);
      this.businessService.adminBulkDeleteBusinessesAsync(selectedIds)
        .then(result => {
          if (result.deleted.length > 0) {
            // Remove deleted businesses from our local array
            const businesses = this.businesses();
            const remainingBusinesses = businesses.filter(b => !result.deleted.includes(b._id));
            this.businesses.set(remainingBusinesses);
            this.setupFilters();
            this.clearSelection();
            
            const message = `${result.deleted.length} business(es) deleted successfully.`;
            const failedMessage = result.failed.length > 0 ? ` ${result.failed.length} failed.` : '';
            alert(message + failedMessage);
          }
        })
        .catch(error => {
          console.error('Error bulk deleting businesses:', error);
          alert('Failed to delete selected businesses');
        })
        .finally(() => {
          this.loading.set(false);
        });
    }
  }

  clearSelection() {
    this.selectedBusinesses.set(new Set());
  }

  viewBusinessDetails(businessId: string) {
    // Fix the navigation to match the new route structure
    this.router.navigate(['/admin/dashboard/businesses/details', businessId]);
  }

  toggleFeatured(business: Business) {
    this.loading.set(true);
    this.businessService.adminToggleFeaturedAsync(business._id, !business.is_featured)
      .then(updatedBusiness => {
        // Update the business in our local array
        const businesses = this.businesses();
        const index = businesses.findIndex(b => b._id === business._id);
        if (index !== -1) {
          businesses[index] = updatedBusiness;
          this.businesses.set([...businesses]);
          this.setupFilters(); // Refresh filtered results
        }
      })
      .catch(error => {
        console.error('Error toggling featured status:', error);
        alert('Failed to update featured status');
      })
      .finally(() => {
        this.loading.set(false);
      });
  }

  verifyBusiness(business: Business) {
    this.loading.set(true);
    this.businessService.adminVerifyBusinessAsync(business._id)
      .then(updatedBusiness => {
        // Update the business in our local array
        const businesses = this.businesses();
        const index = businesses.findIndex(b => b._id === business._id);
        if (index !== -1) {
          businesses[index] = updatedBusiness;
          this.businesses.set([...businesses]);
          this.setupFilters(); // Refresh filtered results
        }
        alert('Business verified successfully');
      })
      .catch(error => {
        console.error('Error verifying business:', error);
        alert('Failed to verify business');
      })
      .finally(() => {
        this.loading.set(false);
      });
  }

  deleteBusiness(business: Business) {
    if (confirm(`Are you sure you want to delete "${business.name}"?`)) {
      this.loading.set(true);
      this.businessService.adminDeleteBusinessAsync(business._id)
        .then(() => {
          // Remove the business from our local array
          const businesses = this.businesses();
          const filteredBusinesses = businesses.filter(b => b._id !== business._id);
          this.businesses.set(filteredBusinesses);
          this.setupFilters(); // Refresh filtered results
          alert('Business deleted successfully');
        })
        .catch(error => {
          console.error('Error deleting business:', error);
          alert('Failed to delete business');
        })
        .finally(() => {
          this.loading.set(false);
        });
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  getOwnerName(owner: any): string {
    if (!owner) return 'Unknown';
    if (typeof owner === 'string') return 'Owner ID: ' + owner;
    return `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || owner.email || 'Unknown';
  }
}
