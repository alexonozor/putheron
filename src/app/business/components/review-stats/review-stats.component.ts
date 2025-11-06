import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

interface ReviewStats {
  service_quality_avg?: number;
  communication_avg?: number;
  timeliness_avg?: number;
  value_for_money_avg?: number;
}

@Component({
  selector: 'app-review-stats',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './review-stats.component.html',
  styleUrls: ['./review-stats.component.scss']
})
export class ReviewStatsComponent {
  averageRating = input.required<number>();
  totalReviews = input.required<number>();
  reviewStats = input<ReviewStats | null>(null);

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

  getRatingLabel(rating: number): string {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4.0) return 'Very Good';
    if (rating >= 3.5) return 'Good';
    if (rating >= 3.0) return 'Average';
    if (rating >= 2.0) return 'Below Average';
    return 'Poor';
  }
}
