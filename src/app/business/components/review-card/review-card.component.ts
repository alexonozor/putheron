import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

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

@Component({
  selector: 'app-review-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './review-card.component.html',
  styleUrls: ['./review-card.component.scss']
})
export class ReviewCardComponent {
  review = input.required<Review>();

  getStarArray(rating: number): boolean[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= Math.round(rating));
    }
    return stars;
  }

  getReviewerName(): string {
    const review = this.review();
    if (review.reviewer) {
      return `${review.reviewer.first_name} ${review.reviewer.last_name}`;
    }
    return 'Anonymous';
  }

  getProjectTitle(): string {
    const review = this.review();
    if (typeof review.project_id === 'object' && review.project_id) {
      return review.project_id.title;
    }
    return 'Project';
  }

  formatReviewDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  hasDetailedRatings(): boolean {
    const review = this.review();
    return !!(review.service_quality || review.communication || review.timeliness || review.value_for_money);
  }
}
