import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { BusinessService, Business } from '../../../../shared/services/business.service';

@Component({
  selector: 'app-admin-business-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTabsModule,
    MatDividerModule
  ],
  templateUrl: './admin-business-details.component.html',
  styleUrl: './admin-business-details.component.scss'
})
export class AdminBusinessDetailsComponent implements OnInit {
  private readonly businessService = inject(BusinessService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly business = signal<Business | null>(null);
  readonly businessId = signal<string>('');

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.businessId.set(id);
        this.loadBusinessDetails(id);
      }
    });
  }

  async loadBusinessDetails(businessId: string) {
    this.loading.set(true);
    try {
      const business = await this.businessService.getBusinessAsync(businessId);
      this.business.set(business);
    } catch (error: any) {
      console.error('Error loading business details:', error);
      alert('Failed to load business details');
    } finally {
      this.loading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/admin/businesses']);
  }

  async toggleFeatured() {
    const business = this.business();
    if (!business) return;

    this.loading.set(true);
    try {
      const updatedBusiness = await this.businessService.adminToggleFeaturedAsync(business._id, !business.is_featured);
      this.business.set(updatedBusiness);
      alert(`Business ${business.is_featured ? 'removed from' : 'added to'} featured list`);
    } catch (error: any) {
      console.error('Error toggling featured status:', error);
      alert('Failed to update featured status');
    } finally {
      this.loading.set(false);
    }
  }

  async verifyBusiness() {
    const business = this.business();
    if (!business) return;

    this.loading.set(true);
    try {
      const updatedBusiness = await this.businessService.adminVerifyBusinessAsync(business._id);
      this.business.set(updatedBusiness);
      alert('Business verified successfully');
    } catch (error: any) {
      console.error('Error verifying business:', error);
      alert('Failed to verify business');
    } finally {
      this.loading.set(false);
    }
  }

  async rejectBusiness() {
    const business = this.business();
    if (!business) return;

    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    this.loading.set(true);
    try {
      const updatedBusiness = await this.businessService.adminRejectBusinessAsync(business._id, reason);
      this.business.set(updatedBusiness);
      alert('Business verification rejected');
    } catch (error: any) {
      console.error('Error rejecting business:', error);
      alert('Failed to reject business verification');
    } finally {
      this.loading.set(false);
    }
  }

  async deleteBusiness() {
    const business = this.business();
    if (!business) return;

    if (!confirm(`Are you sure you want to delete "${business.name}"? This action cannot be undone.`)) {
      return;
    }

    this.loading.set(true);
    try {
      await this.businessService.adminDeleteBusinessAsync(business._id);
      alert('Business deleted successfully');
      this.goBack();
    } catch (error: any) {
      console.error('Error deleting business:', error);
      alert('Failed to delete business');
      this.loading.set(false);
    }
  }

  getOwnerName(owner: any): string {
    if (!owner) return 'Unknown';
    if (typeof owner === 'string') return 'Owner ID: ' + owner;
    return `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || owner.email || 'Unknown';
  }

  getCategoryName(category: any): string {
    if (!category) return 'Uncategorized';
    if (typeof category === 'string') return 'Category ID: ' + category;
    return category.name || 'Uncategorized';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  getBusinessHours(day: string): { open: string; close: string; closed?: boolean } | undefined {
    const business = this.business();
    if (!business || !business.business_hours) {
      return undefined;
    }
    
    // Type assertion to safely access business hours
    const businessHours = business.business_hours as any;
    return businessHours[day];
  }
}
