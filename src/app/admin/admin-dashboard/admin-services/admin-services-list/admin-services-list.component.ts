import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BusinessService, Service } from '../../../../shared/services/business.service';

@Component({
  selector: 'app-admin-services-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-services-list.component.html',
  styleUrl: './admin-services-list.component.scss'
})
export class AdminServicesListComponent implements OnInit {
  private readonly businessService = inject(BusinessService);
  private readonly router = inject(Router);

  // State signals
  readonly services = signal<Service[]>([]);
  readonly loading = signal(false);
  readonly selectedServices = signal<Set<string>>(new Set());

  // Filter signals
  readonly searchQuery = signal('');
  readonly statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  readonly featuredFilter = signal<'all' | 'featured' | 'regular'>('all');
  readonly sortBy = signal<'name' | 'createdAt' | 'price'>('createdAt');
  readonly sortOrder = signal<'asc' | 'desc'>('desc');

  // Pagination
  readonly currentPage = signal(1);
  readonly itemsPerPage = signal(10);
  readonly totalItems = signal(0);
  readonly totalPages = signal(0);

  // Computed values
  readonly filteredServices = computed(() => {
    let filtered = this.services();
    const query = this.searchQuery().toLowerCase();
    
    // Search filter
    if (query) {
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query) ||
        service.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Status filter
    const status = this.statusFilter();
    if (status !== 'all') {
      filtered = filtered.filter(service => 
        status === 'active' ? service.is_active : !service.is_active
      );
    }

    // Featured filter
    const featured = this.featuredFilter();
    if (featured !== 'all') {
      filtered = filtered.filter(service => 
        featured === 'featured' ? service.is_featured : !service.is_featured
      );
    }

    // Sort
    const sortBy = this.sortBy();
    const sortOrder = this.sortOrder();
    
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  });

  readonly stats = computed(() => {
    const services = this.services();
    return {
      total: services.length,
      active: services.filter(s => s.is_active).length,
      inactive: services.filter(s => !s.is_active).length,
      featured: services.filter(s => s.is_featured).length
    };
  });

  ngOnInit() {
    this.loadServices();
  }

  async loadServices() {
    this.loading.set(true);
    try {
      const result = await this.businessService.getServicesAsync(
        this.currentPage(),
        100, // Load all for admin view
        {}
      );
      this.services.set(result.services);
      this.totalItems.set(result.total);
      this.totalPages.set(result.totalPages);
    } catch (error: any) {
      console.error('Error loading services:', error);
      alert('Failed to load services');
    } finally {
      this.loading.set(false);
    }
  }

  // Navigation
  viewServiceDetails(serviceId: string) {
    this.router.navigate(['/admin/dashboard/services', serviceId]);
  }

  // Bulk operations
  toggleServiceSelection(serviceId: string) {
    const selected = new Set(this.selectedServices());
    if (selected.has(serviceId)) {
      selected.delete(serviceId);
    } else {
      selected.add(serviceId);
    }
    this.selectedServices.set(selected);
  }

  toggleAllServices() {
    const filtered = this.filteredServices();
    const selected = new Set(this.selectedServices());
    
    if (selected.size === filtered.length) {
      this.selectedServices.set(new Set());
    } else {
      this.selectedServices.set(new Set(filtered.map(s => s._id)));
    }
  }

  async bulkToggleStatus() {
    const selectedIds = Array.from(this.selectedServices());
    if (selectedIds.length === 0) {
      alert('Please select services to update');
      return;
    }

    if (!confirm(`Are you sure you want to toggle the status of ${selectedIds.length} service(s)?`)) {
      return;
    }

    this.loading.set(true);
    let successCount = 0;
    let failureCount = 0;

    for (const serviceId of selectedIds) {
      try {
        const service = this.services().find(s => s._id === serviceId);
        if (service) {
          await this.businessService.updateServiceAsync(serviceId, {
            is_active: !service.is_active
          });
          successCount++;
        }
      } catch (error) {
        failureCount++;
        console.error(`Error updating service ${serviceId}:`, error);
      }
    }

    alert(`Updated ${successCount} service(s). ${failureCount} failed.`);
    this.selectedServices.set(new Set());
    await this.loadServices();
    this.loading.set(false);
  }

  async bulkDelete() {
    const selectedIds = Array.from(this.selectedServices());
    if (selectedIds.length === 0) {
      alert('Please select services to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.length} service(s)? This action cannot be undone.`)) {
      return;
    }

    this.loading.set(true);
    let successCount = 0;
    let failureCount = 0;

    for (const serviceId of selectedIds) {
      try {
        await this.businessService.deleteServiceAsync(serviceId);
        successCount++;
      } catch (error) {
        failureCount++;
        console.error(`Error deleting service ${serviceId}:`, error);
      }
    }

    alert(`Deleted ${successCount} service(s). ${failureCount} failed.`);
    this.selectedServices.set(new Set());
    await this.loadServices();
    this.loading.set(false);
  }

  // Individual service operations
  async toggleServiceStatus(service: Service) {
    this.loading.set(true);
    try {
      await this.businessService.updateServiceAsync(service._id, {
        is_active: !service.is_active
      });
      await this.loadServices();
      alert(`Service ${service.is_active ? 'deactivated' : 'activated'} successfully`);
    } catch (error: any) {
      console.error('Error toggling service status:', error);
      alert('Failed to update service status');
    } finally {
      this.loading.set(false);
    }
  }

  async toggleFeatured(service: Service) {
    this.loading.set(true);
    try {
      await this.businessService.updateServiceAsync(service._id, {
        is_featured: !service.is_featured
      });
      await this.loadServices();
      alert(`Service ${service.is_featured ? 'removed from' : 'added to'} featured list`);
    } catch (error: any) {
      console.error('Error toggling featured status:', error);
      alert('Failed to update featured status');
    } finally {
      this.loading.set(false);
    }
  }

  async deleteService(service: Service) {
    if (!confirm(`Are you sure you want to delete "${service.name}"? This action cannot be undone.`)) {
      return;
    }

    this.loading.set(true);
    try {
      await this.businessService.deleteServiceAsync(service._id);
      await this.loadServices();
      alert('Service deleted successfully');
    } catch (error: any) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service');
    } finally {
      this.loading.set(false);
    }
  }

  // Utility methods
  formatPrice(price?: number, type?: string): string {
    if (price == null || price === undefined) return 'Free';
    const formatted = price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
    
    switch (type) {
      case 'hourly':
        return `${formatted}/hr`;
      case 'project':
        return `${formatted}/project`;
      default:
        return formatted;
    }
  }

  formatDate(date?: Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getBusinessName(business: any): string {
    if (!business) return 'Unknown Business';
    if (typeof business === 'string') return 'Business ID: ' + business;
    return business.name || 'Unknown Business';
  }

  // Filter and sort handlers
  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  onStatusFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.statusFilter.set(target.value as 'all' | 'active' | 'inactive');
  }

  onFeaturedFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.featuredFilter.set(target.value as 'all' | 'featured' | 'regular');
  }

  onSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const [field, order] = target.value.split('-');
    this.sortBy.set(field as 'name' | 'createdAt' | 'price');
    this.sortOrder.set(order as 'asc' | 'desc');
  }
}
