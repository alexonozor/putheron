import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AdminReviewsService, Review, AdminReviewFilters, ReviewStats } from '../admin-reviews.service';

@Component({
  selector: 'app-admin-reviews-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './admin-reviews-list.component.html',
  styleUrl: './admin-reviews-list.component.scss'
})
export class AdminReviewsListComponent implements OnInit {
  readonly adminReviewsService = inject(AdminReviewsService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // Make Math and Array available to template
  readonly Math = Math;
  readonly Array = Array;

  // Signals
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly reviews = signal<Review[]>([]);
  readonly stats = signal<ReviewStats | null>(null);
  readonly selectedReviews = signal<Set<string>>(new Set());
  readonly showBulkActions = computed(() => this.selectedReviews().size > 0);

  // Pagination
  readonly pagination = signal({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    perPage: 25,
    hasNext: false,
    hasPrev: false
  });

  // Filters
  filterForm: FormGroup;
  
  // Current filters
  readonly currentFilters = signal<AdminReviewFilters>({
    page: 1,
    limit: 25,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  constructor() {
    this.filterForm = this.fb.group({
      search: [''],
      rating: [''],
      dateFrom: [''],
      dateTo: [''],
      isVerified: [''],
      isFlagged: [''],
      sortBy: ['createdAt'],
      sortOrder: ['desc']
    });
  }

  async ngOnInit() {
    await Promise.all([
      this.loadReviews(),
      this.loadStats()
    ]);
  }

  async loadReviews() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await this.adminReviewsService.getReviewsAsync(this.currentFilters());
      this.reviews.set(response.reviews);
      this.pagination.set(response.pagination);
    } catch (err: any) {
      console.error('Error loading reviews:', err);
      this.error.set('Failed to load reviews. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async loadStats() {
    try {
      const stats = await this.adminReviewsService.getReviewStatsAsync();
      this.stats.set(stats);
    } catch (err: any) {
      console.error('Error loading review stats:', err);
    }
  }

  async onFiltersChange() {
    const formValues = this.filterForm.value;
    
    const filters: AdminReviewFilters = {
      ...this.currentFilters(),
      page: 1, // Reset to first page when filtering
      search: formValues.search || undefined,
      rating: formValues.rating ? Number(formValues.rating) : undefined,
      dateFrom: formValues.dateFrom || undefined,
      dateTo: formValues.dateTo || undefined,
      isVerified: formValues.isVerified === '' ? undefined : formValues.isVerified === 'true',
      isFlagged: formValues.isFlagged === '' ? undefined : formValues.isFlagged === 'true',
      sortBy: formValues.sortBy || 'createdAt',
      sortOrder: formValues.sortOrder || 'desc'
    };

    this.currentFilters.set(filters);
    await this.loadReviews();
  }

  async onPageChange(page: number) {
    const filters = { ...this.currentFilters(), page };
    this.currentFilters.set(filters);
    await this.loadReviews();
  }

  async onPerPageChange(perPage: number) {
    const filters = { ...this.currentFilters(), limit: perPage, page: 1 };
    this.currentFilters.set(filters);
    await this.loadReviews();
  }

  clearFilters() {
    this.filterForm.reset({
      search: '',
      rating: '',
      dateFrom: '',
      dateTo: '',
      isVerified: '',
      isFlagged: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    
    this.currentFilters.set({
      page: 1,
      limit: 25,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    
    this.loadReviews();
  }

  toggleReviewSelection(reviewId: string) {
    const selected = new Set(this.selectedReviews());
    if (selected.has(reviewId)) {
      selected.delete(reviewId);
    } else {
      selected.add(reviewId);
    }
    this.selectedReviews.set(selected);
  }

  selectAllReviews() {
    const allIds = new Set(this.reviews().map(r => r._id));
    this.selectedReviews.set(allIds);
  }

  deselectAllReviews() {
    this.selectedReviews.set(new Set());
  }

  async bulkVerifyReviews() {
    const reviewIds = Array.from(this.selectedReviews());
    if (reviewIds.length === 0) return;

    if (!confirm(`Are you sure you want to verify ${reviewIds.length} selected reviews?`)) {
      return;
    }

    this.loading.set(true);
    try {
      await this.adminReviewsService.bulkUpdateReviewsAsync(reviewIds, { is_verified: true });
      this.selectedReviews.set(new Set());
      await this.loadReviews();
      await this.loadStats();
    } catch (err: any) {
      console.error('Error verifying reviews:', err);
      this.error.set('Failed to verify reviews. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async bulkFlagReviews() {
    const reviewIds = Array.from(this.selectedReviews());
    if (reviewIds.length === 0) return;

    const reason = prompt('Please provide a reason for flagging these reviews:');
    if (!reason) return;

    this.loading.set(true);
    try {
      await this.adminReviewsService.bulkUpdateReviewsAsync(reviewIds, { 
        is_flagged: true, 
        flagged_reason: reason 
      });
      this.selectedReviews.set(new Set());
      await this.loadReviews();
      await this.loadStats();
    } catch (err: any) {
      console.error('Error flagging reviews:', err);
      this.error.set('Failed to flag reviews. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async deleteSelectedReviews() {
    const reviewIds = Array.from(this.selectedReviews());
    if (reviewIds.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${reviewIds.length} selected reviews? This action cannot be undone.`)) {
      return;
    }

    this.loading.set(true);
    try {
      for (const reviewId of reviewIds) {
        await this.adminReviewsService.deleteReviewAsync(reviewId);
      }
      this.selectedReviews.set(new Set());
      await this.loadReviews();
      await this.loadStats();
    } catch (err: any) {
      console.error('Error deleting reviews:', err);
      this.error.set('Failed to delete reviews. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  viewReviewDetails(review: Review) {
    this.router.navigate(['/admin/dashboard/reviews', review._id]);
  }

  async exportReviews() {
    try {
      const formValues = this.filterForm.value;
      const filters = {
        rating: formValues.rating ? Number(formValues.rating) : undefined,
        search: formValues.search || undefined,
        dateFrom: formValues.dateFrom || undefined,
        dateTo: formValues.dateTo || undefined,
        format: 'csv' as const
      };

      const exportData = await this.adminReviewsService.exportReviewsAsync(filters);
      console.log('Export data:', exportData); // Handle download logic here
    } catch (err: any) {
      console.error('Error exporting reviews:', err);
      this.error.set('Failed to export reviews. Please try again.');
    }
  }

  // Helper methods
  onSelectAllChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox?.checked) {
      this.selectAllReviews();
    } else {
      this.deselectAllReviews();
    }
  }

  onPerPageChangeEvent(event: Event) {
    const select = event.target as HTMLSelectElement;
    if (select?.value) {
      this.onPerPageChange(+select.value);
    }
  }

  async quickVerifyReview(reviewId: string) {
    try {
      await this.adminReviewsService.updateReviewStatusAsync(reviewId, true, false);
      await this.loadReviews();
      await this.loadStats();
    } catch (err: any) {
      console.error('Error verifying review:', err);
      this.error.set('Failed to verify review. Please try again.');
    }
  }

  async quickFlagReview(reviewId: string) {
    const reason = prompt('Please provide a reason for flagging this review:');
    if (!reason) return;

    try {
      await this.adminReviewsService.updateReviewStatusAsync(reviewId, false, true, reason);
      await this.loadReviews();
      await this.loadStats();
    } catch (err: any) {
      console.error('Error flagging review:', err);
      this.error.set('Failed to flag review. Please try again.');
    }
  }

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
}
