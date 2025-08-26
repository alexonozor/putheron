import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminReviewsService, Review } from '../admin-reviews.service';

@Component({
  selector: 'app-admin-review-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './admin-review-details.component.html',
  styleUrl: './admin-review-details.component.scss'
})
export class AdminReviewDetailsComponent implements OnInit {
  private readonly adminReviewsService = inject(AdminReviewsService);
  readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // Signals
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly review = signal<Review | null>(null);
  readonly showFlagModal = signal(false);
  readonly flagReason = signal('');
  readonly customFlagReason = signal('');

  // Forms
  statusForm: FormGroup;

  constructor() {
    this.statusForm = this.fb.group({
      is_verified: [false],
      is_flagged: [false],
      flagged_reason: ['']
    });
  }

  async ngOnInit() {
    const reviewId = this.route.snapshot.paramMap.get('id');
    if (reviewId) {
      await this.loadReview(reviewId);
    }
  }

  async loadReview(id: string) {
    this.loading.set(true);
    this.error.set(null);

    try {
      const review = await this.adminReviewsService.getReviewAsync(id);
      this.review.set(review);
      this.populateForm(review);
    } catch (err: any) {
      console.error('Error loading review:', err);
      this.error.set('Failed to load review details. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  populateForm(review: Review) {
    this.statusForm.patchValue({
      is_verified: review.is_verified,
      is_flagged: review.is_flagged,
      flagged_reason: review.flagged_reason || ''
    });
  }

  async updateReviewStatus() {
    if (this.statusForm.invalid) {
      this.statusForm.markAllAsTouched();
      return;
    }

    const review = this.review();
    if (!review) return;

    const formData = this.statusForm.value;

    // If flagging, require a reason
    if (formData.is_flagged && !formData.flagged_reason?.trim()) {
      this.statusForm.get('flagged_reason')?.setErrors({ required: true });
      this.statusForm.get('flagged_reason')?.markAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const updatedReview = await this.adminReviewsService.updateReviewStatusAsync(
        review._id,
        formData.is_verified,
        formData.is_flagged,
        formData.is_flagged ? formData.flagged_reason : undefined
      );
      
      this.review.set(updatedReview);
      // Show success message or handle success state
    } catch (err: any) {
      console.error('Error updating review status:', err);
      this.error.set('Failed to update review status. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async deleteReview() {
    const review = this.review();
    if (!review) return;

    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      await this.adminReviewsService.deleteReviewAsync(review._id);
      // Navigate back to reviews list
      this.router.navigate(['/admin/dashboard/reviews']);
    } catch (err: any) {
      console.error('Error deleting review:', err);
      this.error.set('Failed to delete review. Please try again.');
      this.loading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/admin/dashboard/reviews']);
  }

  async verifyReview() {
    const review = this.review();
    if (!review) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const updatedReview = await this.adminReviewsService.updateReviewStatusAsync(
        review._id,
        true, // is_verified
        review.is_flagged,
        review.flagged_reason
      );
      this.review.set(updatedReview);
    } catch (err: any) {
      console.error('Error verifying review:', err);
      this.error.set('Failed to verify review. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async flagReview() {
    const review = this.review();
    if (!review) return;

    const reason = this.flagReason() === 'other' ? this.customFlagReason() : this.flagReason();
    if (!reason.trim()) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const updatedReview = await this.adminReviewsService.updateReviewStatusAsync(
        review._id,
        review.is_verified,
        true, // is_flagged
        reason
      );
      this.review.set(updatedReview);
      this.showFlagModal.set(false);
      this.flagReason.set('');
      this.customFlagReason.set('');
    } catch (err: any) {
      console.error('Error flagging review:', err);
      this.error.set('Failed to flag review. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async unflagReview() {
    const review = this.review();
    if (!review) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const updatedReview = await this.adminReviewsService.updateReviewStatusAsync(
        review._id,
        review.is_verified,
        false, // is_flagged
        undefined
      );
      this.review.set(updatedReview);
    } catch (err: any) {
      console.error('Error unflagging review:', err);
      this.error.set('Failed to unflag review. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  viewBusiness(businessId: string) {
    this.router.navigate(['/admin/businesses', businessId]);
  }

  viewProject(projectId: string) {
    this.router.navigate(['/admin/projects', projectId]);
  }

  // Helper methods
  getStatusColor = this.adminReviewsService.getStatusColor.bind(this.adminReviewsService);
  getStatusLabel = this.adminReviewsService.getStatusLabel.bind(this.adminReviewsService);
  getRatingColor = this.adminReviewsService.getRatingColor.bind(this.adminReviewsService);
  formatDate = this.adminReviewsService.formatDate.bind(this.adminReviewsService);
  getUserName = this.adminReviewsService.getUserName.bind(this.adminReviewsService);
  getBusinessName = this.adminReviewsService.getBusinessName.bind(this.adminReviewsService);
  getProjectTitle = this.adminReviewsService.getProjectTitle.bind(this.adminReviewsService);
  generateStarDisplay = this.adminReviewsService.generateStarDisplay.bind(this.adminReviewsService);

  // Type guard helper methods
  hasUserEmail(userId: string | { _id: string; first_name: string; last_name: string; email: string; profile_picture?: string }): boolean {
    return typeof userId === 'object' && userId !== null && 'email' in userId;
  }

  getUserEmail(userId: string | { _id: string; first_name: string; last_name: string; email: string; profile_picture?: string }): string | null {
    return this.hasUserEmail(userId) ? (userId as any).email : null;
  }

  hasUserProfilePicture(userId: string | { _id: string; first_name: string; last_name: string; email: string; profile_picture?: string }): boolean {
    return typeof userId === 'object' && userId !== null && 'profile_picture' in userId && !!userId.profile_picture;
  }

  getUserProfilePicture(userId: string | { _id: string; first_name: string; last_name: string; email: string; profile_picture?: string }): string | null {
    return this.hasUserProfilePicture(userId) ? (userId as any).profile_picture : null;
  }

  hasBusinessEmail(businessId: string | { _id: string; name: string; slug: string; logo_url?: string }): boolean {
    return typeof businessId === 'object' && businessId !== null && 'email' in businessId;
  }

  getBusinessEmail(businessId: string | { _id: string; name: string; slug: string; logo_url?: string }): string | null {
    return this.hasBusinessEmail(businessId) ? (businessId as any).email : null;
  }

  hasBusinessPhone(businessId: string | { _id: string; name: string; slug: string; logo_url?: string }): boolean {
    return typeof businessId === 'object' && businessId !== null && 'phone' in businessId;
  }

  getBusinessPhone(businessId: string | { _id: string; name: string; slug: string; logo_url?: string }): string | null {
    return this.hasBusinessPhone(businessId) ? (businessId as any).phone : null;
  }

  hasBusinessLocation(businessId: string | { _id: string; name: string; slug: string; logo_url?: string }): boolean {
    return typeof businessId === 'object' && businessId !== null && 'location' in businessId;
  }

  getBusinessLocation(businessId: string | { _id: string; name: string; slug: string; logo_url?: string }): string | null {
    return this.hasBusinessLocation(businessId) ? (businessId as any).location : null;
  }

  getBusinessId(businessId: string | { _id: string; name: string; slug: string; logo_url?: string }): string | null {
    return typeof businessId === 'object' && businessId !== null ? businessId._id : businessId;
  }

  hasProjectDescription(projectId: string | { _id: string; title: string; status: string; description?: string; offered_price?: number; deadline?: string }): boolean {
    return typeof projectId === 'object' && projectId !== null && 'description' in projectId && !!projectId.description;
  }

  getProjectDescription(projectId: string | { _id: string; title: string; status: string; description?: string; offered_price?: number; deadline?: string }): string | null {
    return this.hasProjectDescription(projectId) ? (projectId as any).description : null;
  }

  getProjectId(projectId: string | { _id: string; title: string; status: string; description?: string; offered_price?: number; deadline?: string }): string | null {
    return typeof projectId === 'object' && projectId !== null ? projectId._id : projectId;
  }
}
