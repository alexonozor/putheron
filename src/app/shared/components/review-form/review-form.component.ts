import { Component, inject, signal, Input, Output, EventEmitter, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReviewService } from '../../services/review.service';
import { CompletedProjectForReview, CreateReviewRequest } from '../../interfaces/review.interface';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatSliderModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="p-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Leave a Review</h2>
      
      @if (loadingProjects()) {
        <div class="flex items-center justify-center py-8">
          <mat-spinner diameter="40"></mat-spinner>
          <span class="ml-3 text-gray-600">Loading projects...</span>
        </div>
      } @else if (completedProjects().length === 0) {
        <div class="text-center py-8">
          <mat-icon class="text-gray-400 text-6xl mb-4">work_off</mat-icon>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No Completed Projects</h3>
          <p class="text-gray-600 mb-4">You need to complete a project with this business before you can leave a review.</p>
          <button 
            mat-button 
            color="primary" 
            (click)="dialogRef.close()">
            Close
          </button>
        </div>
      } @else {
        <form [formGroup]="reviewForm" (ngSubmit)="submitReview()">
          <!-- Project Selection -->
          <mat-form-field appearance="outline" class="w-full mb-4">
            <mat-label>Select Project</mat-label>
            <mat-select formControlName="project_id" required>
              @for (project of completedProjects(); track project._id) {
                <mat-option [value]="project._id">
                  {{ project.title }}
                  @if (project.completed_at) {
                    <span class="text-sm text-gray-500"> - Completed {{ formatDate(project.completed_at) }}</span>
                  }
                </mat-option>
              }
            </mat-select>
          </mat-form-field>

          <!-- Overall Rating -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Overall Rating *</label>
            <div class="flex items-center space-x-2">
              @for (star of [1, 2, 3, 4, 5]; track star) {
                <mat-icon 
                  class="cursor-pointer text-2xl hover:text-yellow-400 transition-colors"
                  [class.text-yellow-400]="star <= reviewForm.get('rating')?.value"
                  [class.text-gray-300]="star > reviewForm.get('rating')?.value"
                  (click)="setRating(star)">
                  star
                </mat-icon>
              }
              <span class="ml-2 text-sm text-gray-600">{{ reviewForm.get('rating')?.value || 0 }}/5</span>
            </div>
          </div>

          <!-- Review Text -->
          <mat-form-field appearance="outline" class="w-full mb-4">
            <mat-label>Review</mat-label>
            <textarea 
              matInput 
              formControlName="review_text" 
              rows="4" 
              placeholder="Share your experience working with this business...">
            </textarea>
          </mat-form-field>

          <!-- Detailed Ratings -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Service Quality</label>
              <mat-slider 
                min="1" 
                max="5" 
                step="1" 
                discrete
                [displayWith]="formatSliderLabel">
                <input matSliderThumb formControlName="service_quality" />
              </mat-slider>
              <div class="text-xs text-gray-500 mt-1">{{ reviewForm.get('service_quality')?.value || 0 }}/5</div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Communication</label>
              <mat-slider 
                min="1" 
                max="5" 
                step="1" 
                discrete
                [displayWith]="formatSliderLabel">
                <input matSliderThumb formControlName="communication" />
              </mat-slider>
              <div class="text-xs text-gray-500 mt-1">{{ reviewForm.get('communication')?.value || 0 }}/5</div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Timeliness</label>
              <mat-slider 
                min="1" 
                max="5" 
                step="1" 
                discrete
                [displayWith]="formatSliderLabel">
                <input matSliderThumb formControlName="timeliness" />
              </mat-slider>
              <div class="text-xs text-gray-500 mt-1">{{ reviewForm.get('timeliness')?.value || 0 }}/5</div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Value for Money</label>
              <mat-slider 
                min="1" 
                max="5" 
                step="1" 
                discrete
                [displayWith]="formatSliderLabel">
                <input matSliderThumb formControlName="value_for_money" />
              </mat-slider>
              <div class="text-xs text-gray-500 mt-1">{{ reviewForm.get('value_for_money')?.value || 0 }}/5</div>
            </div>
          </div>

          <!-- Submit Buttons -->
          <div class="flex justify-end space-x-3">
            <button 
              type="button"
              mat-button 
              (click)="dialogRef.close()">
              Cancel
            </button>
            <button 
              type="submit"
              mat-raised-button 
              color="primary"
              [disabled]="!reviewForm.valid || submitting()">
              @if (submitting()) {
                <mat-spinner diameter="20" class="mr-2"></mat-spinner>
              }
              Submit Review
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      max-width: 600px;
    }
    
    .mat-mdc-slider {
      width: 100%;
    }
    
    mat-icon.text-yellow-400 {
      color: #fbbf24;
    }
    
    mat-icon.text-gray-300 {
      color: #d1d5db;
    }
  `]
})
export class ReviewFormComponent implements OnInit {
  @Output() reviewSubmitted = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private reviewService = inject(ReviewService);
  public dialogRef = inject(MatDialogRef<ReviewFormComponent>);

  // Dialog data injection
  public data = inject(MAT_DIALOG_DATA, { optional: true });

  public completedProjects = signal<CompletedProjectForReview[]>([]);
  public submitting = signal(false);
  public loadingProjects = signal(false);

  // Get business ID and name from dialog data
  public get businessId(): string {
    return this.data?.businessId || '';
  }

  public get businessName(): string {
    return this.data?.businessName || 'Business';
  }

  public get projectId(): string | null {
    return this.data?.projectId || null;
  }

  public get projectTitle(): string {
    return this.data?.projectTitle || 'Current Project';
  }

  public reviewForm: FormGroup;

  constructor() {
    this.reviewForm = this.fb.group({
      project_id: ['', Validators.required],
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      review_text: [''],
      service_quality: [5],
      communication: [5],
      timeliness: [5],
      value_for_money: [5]
    });
  }

  ngOnInit() {
    // If we have a specific project ID, pre-populate the form
    if (this.projectId) {
      this.reviewForm.patchValue({ project_id: this.projectId });
      // Create a mock completed project for this specific project
      this.completedProjects.set([{
        _id: this.projectId,
        title: this.projectTitle,
        business_id: { _id: this.businessId, name: this.businessName },
        completed_at: new Date(),
        client_id: '',
        business_owner_id: '',
        status: 'completed'
      } as any]);
    } else {
      this.loadCompletedProjects();
    }
  }

  async loadCompletedProjects() {
    try {
      this.loadingProjects.set(true);
      const projects = await this.reviewService.getCompletedProjectsForReviewAsync();
      
      // Filter for projects with this business
      const businessProjects = projects.filter(project => 
        project.business_id._id === this.businessId
      );

      this.completedProjects.set(businessProjects);
    } catch (error) {
      console.error('Error loading completed projects:', error);
    } finally {
      this.loadingProjects.set(false);
    }
  }

  setRating(rating: number) {
    this.reviewForm.patchValue({ rating });
  }

  formatSliderLabel(value: number): string {
    return `${value}`;
  }

  formatDate(dateString: Date | string): string {
    if (!dateString) return 'Date not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  async submitReview() {
    if (this.reviewForm.invalid) return;

    try {
      this.submitting.set(true);
      
      const formValue = this.reviewForm.value;
      
      const reviewData: CreateReviewRequest = {
        project_id: formValue.project_id,
        rating: formValue.rating,
        review_text: formValue.review_text || undefined,
        service_quality: formValue.service_quality,
        communication: formValue.communication,
        timeliness: formValue.timeliness,
        value_for_money: formValue.value_for_money
      };

      await this.reviewService.createReviewAsync(reviewData);

      this.reviewSubmitted.emit();
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error submitting review:', error);
      // You might want to show a toast or error message here
    } finally {
      this.submitting.set(false);
    }
  }
}
