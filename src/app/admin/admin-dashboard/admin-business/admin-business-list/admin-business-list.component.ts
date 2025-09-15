import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BusinessService, Business } from '../../../../shared/services/business.service';
import { ConfigService } from '../../../../shared/services/config.service';

@Component({
  selector: 'app-admin-business-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './admin-business-list.component.html',
  styleUrl: './admin-business-list.component.scss'
})
export class AdminBusinessListComponent implements OnInit {
  private readonly businessService = inject(BusinessService);
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly businesses = signal<Business[]>([]);
  readonly filteredBusinesses = signal<Business[]>([]);
  readonly selectedBusinesses = signal<Set<string>>(new Set());
  readonly searchQuery = signal('');
  readonly statusFilter = signal('all');
  readonly featuredFilter = signal('all');

  // Computed properties for statistics
  readonly approvedBusinesses = computed(() => 
    this.businesses().filter(business => business.status === 'approved').length
  );
  
  readonly pendingBusinesses = computed(() => 
    this.businesses().filter(business => business.status === 'pending').length
  );
  
  readonly featuredBusinesses = computed(() => 
    this.businesses().filter(business => business.is_featured).length
  );

  // Selection computed properties
  readonly allSelected = computed(() => {
    const filtered = this.filteredBusinesses();
    const selected = this.selectedBusinesses();
    return filtered.length > 0 && filtered.every(business => selected.has(business._id));
  });

  readonly someSelected = computed(() => {
    const filtered = this.filteredBusinesses();
    const selected = this.selectedBusinesses();
    return selected.size > 0 && selected.size < filtered.length;
  });

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
    console.log('Setting up filters...');
    // Watch for changes in search and filters
    const updateFilters = () => {
      const query = this.searchQuery().toLowerCase();
      const status = this.statusFilter();
      const featured = this.featuredFilter();
      
      let filtered = this.businesses();
      console.log('Current businesses in updateFilters:', filtered.length);
      
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
      
      console.log('Filtered businesses count:', filtered.length);
      this.filteredBusinesses.set(filtered);
      console.log('After setting filteredBusinesses, filteredBusinesses():', this.filteredBusinesses());
    };

    // Initial filter setup
    updateFilters();
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
    this.setupFilters();
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.setupFilters();
  }

  onFilter() {
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

  // Add missing methods for the new template
  exportBusinesses(format: string) {
    console.log('Exporting businesses in format:', format);
    // TODO: Implement export functionality
  }

  clearFilters() {
    this.searchQuery.set('');
    this.statusFilter.set('all');
    this.featuredFilter.set('all');
    this.setupFilters();
  }

  bulkAction(action: string) {
    const selectedIds = Array.from(this.selectedBusinesses());
    if (selectedIds.length === 0) return;

    switch (action) {
      case 'verify':
        this.bulkVerifyBusinesses();
        break;
      case 'feature':
        this.bulkToggleFeatured(true);
        break;
      case 'delete':
        this.bulkDeleteBusinesses();
        break;
    }
  }

  selectAll(event: any) {
    const isChecked = event.target.checked;
    if (isChecked) {
      const allIds = new Set(this.filteredBusinesses().map(b => b._id));
      this.selectedBusinesses.set(allIds);
    } else {
      this.selectedBusinesses.set(new Set());
    }
  }

  async loadBusinesses() {
    this.loading.set(true);
    try {
      console.log('Loading businesses...');
      
      // Make direct HTTP call to handle the actual response format
      const url = `${this.config.apiBaseUrl}/admin/businesses?page=1&limit=1000`;
      console.log('Making request to:', url);
      
      const response: any = await firstValueFrom(
        this.http.get(url)
      );
      
      console.log('Full API Response:', response);
      
      // Handle the actual response format from your API
      let businessesData: any[] = [];
      
      if (response?.businesses && Array.isArray(response.businesses)) {
        businessesData = response.businesses;
        console.log('Found businesses in response.businesses');
      } else if (response?.data?.businesses && Array.isArray(response.data.businesses)) {
        businessesData = response.data.businesses;
        console.log('Found businesses in response.data.businesses');
      } else if (Array.isArray(response)) {
        businessesData = response;
        console.log('Response is direct array');
      } else {
        console.log('Could not find businesses in response');
        console.log('Response keys:', Object.keys(response || {}));
      }
      
      console.log('Extracted businesses data:', businessesData);
      console.log('Businesses length:', businessesData.length);
      
      this.businesses.set(businessesData);
      console.log('After setting businesses signal, businesses():', this.businesses());
      console.log('Businesses signal length:', this.businesses().length);
      
      this.setupFilters(); // Trigger filters to update filteredBusinesses
      
      console.log('After setupFilters, filteredBusinesses():', this.filteredBusinesses());
      console.log('FilteredBusinesses length:', this.filteredBusinesses().length);
      console.log('Businesses set, count:', businessesData.length);
      
    } catch (error: any) {
      console.error('Error loading businesses:', error);
      console.error('Error details:', error.message, error.status, error.error);
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
    // Navigate to business details using the correct admin route
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

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  getOwnerName(owner: any): string {
    if (!owner) return 'Unknown';
    if (typeof owner === 'string') return 'Owner ID: ' + owner;
    return `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || owner.email || 'Unknown';
  }
}
