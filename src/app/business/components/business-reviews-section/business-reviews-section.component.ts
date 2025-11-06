import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReviewCardComponent } from '../review-card/review-card.component';
import { ReviewStatsComponent } from '../review-stats/review-stats.component';

interface Review {
  _id: string;
  rating: number;
  review_text?: string;
  comment?: string;
  service_quality?: number;
  communication?: number;
  timeliness?: number;
  value_for_money?: number;
  createdAt: string;
  reviewer?: {
    first_name: string;
    last_name: string;
  };
  project_id?: {
    title: string;
  };
}

interface ReviewStats {
  service_quality_avg?: number;
  communication_avg?: number;
  timeliness_avg?: number;
  value_for_money_avg?: number;
}

@Component({
  selector: 'app-business-reviews-section',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ReviewCardComponent,
    ReviewStatsComponent
  ],
  templateUrl: './business-reviews-section.component.html',
  styleUrls: ['./business-reviews-section.component.scss']
})
export class BusinessReviewsSectionComponent {
  recentReviews = input.required<Review[]>();
  totalReviews = input.required<number>();
  averageRating = input.required<number>();
  reviewStats = input<ReviewStats | null>(null);
  reviewsLoading = input.required<boolean>();
  hasReviews = input.required<boolean>();

  getStarArray(rating: number): boolean[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= Math.round(rating));
    }
    return stars;
  }

  formatRating(rating: number): string {
    return rating.toFixed(1);
  }
}
