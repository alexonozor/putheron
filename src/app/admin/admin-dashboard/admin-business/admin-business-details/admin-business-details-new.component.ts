import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BusinessService, Business } from '../../../../shared/services/business.service';
import { BusinessRejectionDialogComponent, BusinessRejectionDialogData } from '../../../../shared/components/business-rejection-dialog/business-rejection-dialog.component';

@Component({
  selector: 'app-admin-business-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './admin-business-details.component.html',
  styleUrl: './admin-business-details.component.scss'
})
export class AdminBusinessDetailsComponent implements OnInit {
  private readonly businessService = inject(BusinessService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(false);
  readonly business = signal<Business | null>(null);
  readonly businessId = signal<string>('');
  readonly editMode = signal(false);

  // Edit form
  editForm: any = {};

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
      if (business) {
        this.initEditForm(business);
      }
    } catch (error: any) {
      console.error('Error loading business details:', error);
      alert('Failed to load business details');
    } finally {
      this.loading.set(false);
    }
  }

  initEditForm(business: Business) {
    this.editForm = {
      name: business.name || '',
      contact_email: business.contact_email || '',
      contact_phone: business.contact_phone || '',
      website: business.website || '',
      description: business.description || '',
      address: business.address || '',
      city: business.city || '',
      state: business.state || '',
      postal_code: business.postal_code || '',
      country: business.country || ''
    };
  }

  toggleEditMode() {
    if (this.editMode()) {
      // Reset form when canceling edit
      this.initEditForm(this.business()!);
    }
    this.editMode.set(!this.editMode());
  }

  async saveBusiness() {
    const business = this.business();
    if (!business) return;

    this.loading.set(true);
    try {
      const updatedData = { ...this.editForm };
      const updatedBusiness = await this.businessService.updateBusinessAsync(business._id, updatedData);
      this.business.set(updatedBusiness);
      this.editMode.set(false);
      alert('Business updated successfully');
    } catch (error: any) {
      console.error('Error updating business:', error);
      alert('Failed to update business');
    } finally {
      this.loading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/admin/businesses']);
  }

  async toggleBusinessStatus() {
    const business = this.business();
    if (!business) return;

    this.loading.set(true);
    try {
      const newStatus = !business.is_active;
      const updatedBusiness = await this.businessService.adminToggleBusinessStatusAsync(business._id, newStatus);
      this.business.set(updatedBusiness);
      
      // Show success message
      alert(`Business ${newStatus ? 'activated' : 'deactivated'} successfully! The business owner has been notified in real-time.`);
    } catch (error: any) {
      console.error('Error toggling business status:', error);
      alert('Failed to update business status: ' + (error.message || 'Unknown error'));
    } finally {
      this.loading.set(false);
    }
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
      
      // Show success message
      alert('Business verified successfully! The business owner has been notified via email about the approval.');
    } catch (error: any) {
      console.error('Error verifying business:', error);
      alert('Failed to verify business: ' + (error.message || 'Unknown error'));
    } finally {
      this.loading.set(false);
    }
  }

  async rejectBusiness() {
    const business = this.business();
    if (!business) return;

    const dialogData: BusinessRejectionDialogData = {
      businessName: business.name
    };

    const dialogRef = this.dialog.open(BusinessRejectionDialogComponent, {
      data: dialogData,
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
      panelClass: 'custom-dialog-container'
    });

    const result = await dialogRef.afterClosed().toPromise();
    if (!result) return;

    this.loading.set(true);
    try {
      const updatedBusiness = await this.businessService.adminRejectBusinessAsync(business._id, result.reason);
      this.business.set(updatedBusiness);
      
      // Show success message
      alert('Business submission rejected successfully. The business owner has been notified via email with the rejection reason.');
    } catch (error: any) {
      console.error('Error rejecting business:', error);
      alert('Failed to reject business submission: ' + (error.message || 'Unknown error'));
    } finally {
      this.loading.set(false);
    }
  }

  async suspendBusiness() {
    const business = this.business();
    if (!business) return;

    if (business.status === 'suspended') {
      alert('Business is already suspended');
      return;
    }

    const reason = prompt('Please provide a reason for suspending this business:');
    if (!reason || reason.trim().length === 0) {
      return;
    }

    this.loading.set(true);
    try {
      const updatedBusiness = await this.businessService.adminSuspendBusinessAsync(business._id, reason.trim());
      this.business.set(updatedBusiness);
      
      // Show success message
      alert('Business suspended successfully! The business owner has been notified in real-time.');
    } catch (error: any) {
      console.error('Error suspending business:', error);
      alert('Failed to suspend business: ' + (error.message || 'Unknown error'));
    } finally {
      this.loading.set(false);
    }
  }

  async reactivateBusiness() {
    const business = this.business();
    if (!business) return;

    if (business.status !== 'suspended') {
      alert('Business is not suspended');
      return;
    }

    if (!confirm('Are you sure you want to reactivate this business?')) {
      return;
    }

    this.loading.set(true);
    try {
      const updatedBusiness = await this.businessService.adminReactivateBusinessAsync(business._id);
      this.business.set(updatedBusiness);
      
      // Show success message
      alert('Business reactivated successfully! The business owner has been notified in real-time.');
    } catch (error: any) {
      console.error('Error reactivating business:', error);
      alert('Failed to reactivate business: ' + (error.message || 'Unknown error'));
    } finally {
      this.loading.set(false);
    }
  }

  async deleteBusiness() {
    const business = this.business();
    if (!business) return;

    if (!confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
      return;
    }

    this.loading.set(true);
    try {
      await this.businessService.adminDeleteBusinessAsync(business._id);
      alert('Business deleted successfully');
      this.router.navigate(['/admin/businesses']);
    } catch (error: any) {
      console.error('Error deleting business:', error);
      alert('Failed to delete business: ' + (error.message || 'Unknown error'));
    } finally {
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
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  getStatusColor(): string {
    const business = this.business();
    if (!business) return 'bg-gray-400';
    
    switch (business.status) {
      case 'approved':
        return 'bg-green-400';
      case 'pending':
        return 'bg-yellow-400';
      case 'rejected':
        return 'bg-red-400';
      case 'suspended':
        return 'bg-orange-400';
      default:
        return 'bg-gray-400';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'approved':
        return 'text-green-800 bg-green-100';
      case 'pending':
        return 'text-yellow-800 bg-yellow-100';
      case 'rejected':
        return 'text-red-800 bg-red-100';
      case 'suspended':
        return 'text-orange-800 bg-orange-100';
      default:
        return 'text-gray-800 bg-gray-100';
    }
  }
}
