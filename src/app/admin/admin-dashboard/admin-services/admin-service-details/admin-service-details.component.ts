import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BusinessService, Service, CreateServiceDto } from '../../../../shared/services/business.service';

@Component({
  selector: 'app-admin-service-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-service-details.component.html',
  styleUrl: './admin-service-details.component.scss'
})
export class AdminServiceDetailsComponent implements OnInit {
  private readonly businessService = inject(BusinessService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly service = signal<Service | null>(null);
  readonly serviceId = signal<string>('');
  readonly editMode = signal(false);

  // Edit form
  editForm: any = {};

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.serviceId.set(id);
        this.loadServiceDetails(id);
      }
    });
  }

  async loadServiceDetails(serviceId: string) {
    this.loading.set(true);
    try {
      const service = await this.businessService.getServiceAsync(serviceId);
      this.service.set(service);
      if (service) {
        this.initEditForm(service);
      }
    } catch (error: any) {
      console.error('Error loading service details:', error);
      alert('Failed to load service details');
    } finally {
      this.loading.set(false);
    }
  }

  initEditForm(service: Service) {
    this.editForm = {
      name: service.name || '',
      description: service.description || '',
      short_description: service.short_description || '',
      price: service.price || 0,
      pricing_type: service.pricing_type || 'fixed',
      duration: service.duration || '',
      features: [...(service.features || [])],
      tags: [...(service.tags || [])],
      is_active: service.is_active || false,
      is_featured: service.is_featured || false,
      meta_title: service.meta_title || '',
      meta_description: service.meta_description || ''
    };
  }

  toggleEditMode() {
    if (this.editMode()) {
      // Reset form when canceling edit
      const service = this.service();
      if (service) {
        this.initEditForm(service);
      }
    }
    this.editMode.set(!this.editMode());
  }

  async saveService() {
    const service = this.service();
    if (!service) return;

    this.loading.set(true);
    try {
      const updatedData = { ...this.editForm };
      const updatedService = await this.businessService.updateServiceAsync(service._id, updatedData);
      this.service.set(updatedService);
      this.editMode.set(false);
      alert('Service updated successfully');
    } catch (error: any) {
      console.error('Error updating service:', error);
      alert('Failed to update service');
    } finally {
      this.loading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/admin/dashboard/services']);
  }

  async toggleServiceStatus() {
    const service = this.service();
    if (!service) return;

    this.loading.set(true);
    try {
      const updatedService = await this.businessService.updateServiceAsync(service._id, {
        is_active: !service.is_active
      });
      this.service.set(updatedService);
      alert(`Service ${service.is_active ? 'deactivated' : 'activated'} successfully`);
    } catch (error: any) {
      console.error('Error toggling service status:', error);
      alert('Failed to update service status');
    } finally {
      this.loading.set(false);
    }
  }

  async toggleFeatured() {
    const service = this.service();
    if (!service) return;

    this.loading.set(true);
    try {
      const updatedService = await this.businessService.updateServiceAsync(service._id, {
        is_featured: !service.is_featured
      });
      this.service.set(updatedService);
      alert(`Service ${service.is_featured ? 'removed from' : 'added to'} featured list`);
    } catch (error: any) {
      console.error('Error toggling featured status:', error);
      alert('Failed to update featured status');
    } finally {
      this.loading.set(false);
    }
  }

  async deleteService() {
    const service = this.service();
    if (!service) return;

    if (!confirm(`Are you sure you want to delete "${service.name}"? This action cannot be undone.`)) {
      return;
    }

    this.loading.set(true);
    try {
      await this.businessService.deleteServiceAsync(service._id);
      alert('Service deleted successfully');
      this.goBack();
    } catch (error: any) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service');
      this.loading.set(false);
    }
  }

  // Feature and tag management
  addFeature() {
    const newFeature = prompt('Enter new feature:');
    if (newFeature && newFeature.trim()) {
      this.editForm.features = [...this.editForm.features, newFeature.trim()];
    }
  }

  removeFeature(index: number) {
    this.editForm.features = this.editForm.features.filter((_: any, i: number) => i !== index);
  }

  addTag() {
    const newTag = prompt('Enter new tag:');
    if (newTag && newTag.trim()) {
      const trimmedTag = newTag.trim().toLowerCase();
      if (!this.editForm.tags.includes(trimmedTag)) {
        this.editForm.tags = [...this.editForm.tags, trimmedTag];
      }
    }
  }

  removeTag(index: number) {
    this.editForm.tags = this.editForm.tags.filter((_: any, i: number) => i !== index);
  }

  // Utility methods
  formatPrice(price?: number, pricingType?: string): string {
    if (!price) return 'Free';
    
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
    
    switch (pricingType) {
      case 'hourly':
        return `${formatted}/hr`;
      case 'project':
        return `${formatted}/project`;
      default:
        return formatted;
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getBusinessName(business: any): string {
    if (!business) return 'Unknown Business';
    if (typeof business === 'string') return 'Business ID: ' + business;
    return business.name || 'Unknown Business';
  }

  getPricingTypeLabel(type?: string): string {
    switch (type) {
      case 'fixed':
        return 'Fixed Price';
      case 'hourly':
        return 'Hourly Rate';
      case 'project':
        return 'Per Project';
      case 'custom':
        return 'Custom Pricing';
      default:
        return 'Fixed Price';
    }
  }

  async deleteServiceImage(imageUrl: string) {
    const service = this.service();
    if (!service || !confirm('Are you sure you want to delete this image?')) return;

    this.loading.set(true);
    try {
      await this.businessService.deleteServiceImageAsync(service._id, imageUrl);
      // Reload service to get updated images
      await this.loadServiceDetails(service._id);
      alert('Image deleted successfully');
    } catch (error: any) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image');
    } finally {
      this.loading.set(false);
    }
  }
}
