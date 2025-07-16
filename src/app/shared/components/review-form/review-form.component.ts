import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { ReviewsService, UserBusinessProject } from '../../services/reviews.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-review-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatSliderModule
  ],
  template: `
    <div class="p-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Leave a Review</h2>
      
      @if (userProjects().length === 0) {
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
            <mat-select formControlName="userBusinessProjectId" required>
              @for (project of userProjects(); track project.id) {
                <mat-option [value]="project.id">
                  {{ project.project_title }}
                  @if (project.completion_date) {
                    <span class="text-sm text-gray-500"> - Completed {{ formatDate(project.completion_date) }}</span>
                  }
                </mat-option>
              }
            </mat-select>
          </mat-form-field>

          <!-- Overall Rating -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Overall Rating</label>
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
              formControlName="reviewText" 
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
                [displayWith]="formatSliderLabel"
                formControlName="serviceQuality">
              </mat-slider>
              <div class="text-xs text-gray-500 mt-1">{{ reviewForm.get('serviceQuality')?.value || 0 }}/5</div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Communication</label>
              <mat-slider 
                min="1" 
                max="5" 
                step="1" 
                discrete
                [displayWith]="formatSliderLabel"
                formControlName="communication">
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
                [displayWith]="formatSliderLabel"
                formControlName="timeliness">
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
                [displayWith]="formatSliderLabel"
                formControlName="value">
              </mat-slider>
              <div class="text-xs text-gray-500 mt-1">{{ reviewForm.get('value')?.value || 0 }}/5</div>
            </div>
          </div>

          <!-- Form Actions -->
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
              [disabled]="reviewForm.invalid || submitting()">
              {{ submitting() ? 'Submitting...' : 'Submit Review' }}
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .mat-slider {
      width: 100%;
    }
  `]
})
export class ReviewFormComponent {
  @Input() businessId!: string;
  @Input() businessName!: string;
  @Output() reviewSubmitted = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private reviewsService = inject(ReviewsService);
  private authService = inject(AuthService);
  public dialogRef = inject(MatDialogRef<ReviewFormComponent>);

  public userProjects = signal<UserBusinessProject[]>([]);
  public submitting = signal(false);

  public reviewForm: FormGroup;

  constructor() {
    this.reviewForm = this.fb.group({
      userBusinessProjectId: ['', Validators.required],
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      reviewText: [''],
      serviceQuality: [5],
      communication: [5],
      timeliness: [5],
      value: [5]
    });

    this.loadUserProjects();
  }

  async loadUserProjects() {
    try {
      const currentUser = this.authService.currentUser;
      if (!currentUser) return;

      const projects = await this.reviewsService.getUserBusinessProjects(currentUser.id);
      
      // Filter for completed projects with this business that don't have reviews yet
      const eligibleProjects = projects.filter((project: UserBusinessProject) => 
        project.business_id === this.businessId && 
        project.status === 'completed' &&
        project.completion_date
      );

      this.userProjects.set(eligibleProjects);
    } catch (error) {
      console.error('Error loading user projects:', error);
    }
  }

  setRating(rating: number) {
    this.reviewForm.patchValue({ rating });
  }

  formatSliderLabel(value: number): string {
    return `${value}`;
  }

  formatDate(dateString: string): string {
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
      
      const currentUser = this.authService.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const formValue = this.reviewForm.value;
      
      await this.reviewsService.submitBusinessReview(
        currentUser.id,
        this.businessId,
        formValue.userBusinessProjectId,
        formValue.rating,
        formValue.reviewText,
        formValue.serviceQuality,
        formValue.communication,
        formValue.timeliness,
        formValue.value
      );

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
