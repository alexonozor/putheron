import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../shared/services/auth.service';
import { BusinessService, Business } from '../../../shared/services/business.service';

@Component({
  selector: 'app-list-businesses',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './list-businesses.component.html',
  styleUrl: './list-businesses.component.scss'
})
export class ListBusinessesComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly businessService = inject(BusinessService);
  private readonly route = inject(ActivatedRoute);

  // Signals for component state
  readonly userBusinesses = signal<Business[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal<string>('');
  readonly viewMode = signal<'grid' | 'list'>('grid');
  readonly selectedCategory = signal<string>('all');

  // Computed signals
  readonly user = this.authService.user;
  readonly filteredBusinesses = computed(() => {
    let businesses = this.userBusinesses();
    const search = this.searchTerm().toLowerCase().trim();
    const categoryFilter = this.selectedCategory();
    
    // Filter by category
    if (categoryFilter !== 'all') {
      businesses = businesses.filter(business => {
        if (typeof business.category_id === 'string') {
          return business.category_id === categoryFilter;
        }
        return (business.category_id as any)?._id === categoryFilter || 
               (business.category_id as any)?.name?.toLowerCase() === categoryFilter.toLowerCase();
      });
    }
    
    // Filter by search term
    if (search) {
      businesses = businesses.filter(business => 
        business.name.toLowerCase().includes(search) ||
        business.description?.toLowerCase().includes(search) ||
        business.short_description?.toLowerCase().includes(search) ||
        business.city?.toLowerCase().includes(search) ||
        business.state?.toLowerCase().includes(search) ||
        business.tags?.some(tag => tag.toLowerCase().includes(search))
      );
    }
    
    return businesses;
  });

  ngOnInit() {
    if (!this.user()) {
      this.router.navigate(['/auth']);
      return;
    }
    
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const businesses = await this.businessService.getMyBusinessesAsync();
      this.userBusinesses.set(businesses);
    } catch (error) {
      console.error('Error loading businesses:', error);
      this.error.set('Failed to load businesses. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  // Search and filter methods
  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  clearSearch() {
    this.searchTerm.set('');
  }

  onCategoryFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedCategory.set(target.value);
  }

  setViewMode(mode: 'grid' | 'list') {
    this.viewMode.set(mode);
  }

  // Navigation methods
  navigateToCreateBusiness() {
    this.router.navigate(['../create-business'], { relativeTo: this.route });
  }

  editBusiness(businessId: string) {
    console.log('Editing business with ID:', businessId);
    this.router.navigate(['../edit', businessId], { relativeTo: this.route });
  }

  viewBusiness(businessId: string) {
    this.router.navigate(['/business/profile', businessId]);
  }

  // Business-specific methods
  getStatusColor(business: Business): string {
    // Use the actual status field for proper business status display
    const status = business.status;
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(business: Business): string {
    // Use the actual status field for proper business status display
    const status = business.status;
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'pending':
        return 'Pending';
      case 'rejected':
        return 'Rejected';
      case 'suspended':
        return 'Suspended';
      default:
        return 'Unknown';
    }
  }

  getCategoryName(business: Business): string {
    if (typeof business.category_id === 'string') {
      return business.category_id;
    }
    return (business.category_id as any)?.name || 'No Category';
  }

  formatDate(date: string | Date): string {
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return 'Unknown';
    }
  }

  getBusinessTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      'service': 'bg-blue-100 text-blue-800',
      'product': 'bg-purple-100 text-purple-800',
      'both': 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  }

  getBusinessTypeText(type: string): string {
    const types: { [key: string]: string } = {
      'service': 'Service',
      'product': 'Product',
      'both': 'Service & Product'
    };
    return types[type] || type;
  }

  async deleteBusiness(businessId: string) {
    if (!confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
      return;
    }

    try {
      await this.businessService.deleteBusiness(businessId);
      // Reload the businesses list
      this.loadData();
    } catch (error) {
      console.error('Error deleting business:', error);
      this.error.set('Failed to delete business. Please try again.');
    }
  }

  getUniqueCategories(): { id: string; name: string }[] {
    const categories = new Set<string>();
    const categoryObjects: { id: string; name: string }[] = [];

    this.userBusinesses().forEach(business => {
      if (typeof business.category_id === 'string') {
        if (!categories.has(business.category_id)) {
          categories.add(business.category_id);
          categoryObjects.push({ id: business.category_id, name: business.category_id });
        }
      } else if (business.category_id && typeof business.category_id === 'object') {
        const cat = business.category_id as any;
        if (cat._id && cat.name && !categories.has(cat._id)) {
          categories.add(cat._id);
          categoryObjects.push({ id: cat._id, name: cat.name });
        }
      }
    });

    return categoryObjects;
  }
}
