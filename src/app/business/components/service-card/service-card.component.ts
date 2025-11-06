import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { Service } from '../../../shared/services/business.service';

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatListModule
  ],
  templateUrl: './service-card.component.html'
})
export class ServiceCardComponent {
  service = input.required<Service>();
  isOwner = input.required<boolean>();
  isFeatured = input<boolean>(false);
  
  editClick = output<string>();
  startProjectClick = output<string>();

  formatPrice(price?: number, pricingType?: string): string {
    if (!price) return 'Contact for pricing';
    
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);

    switch (pricingType) {
      case 'hourly':
        return `${formattedPrice}/hour`;
      case 'project':
        return `${formattedPrice}/project`;
      case 'custom':
        return `Starting at ${formattedPrice}`;
      case 'fixed':
      default:
        return formattedPrice;
    }
  }

  formatDuration(duration?: string): string {
    if (!duration) return '';
    return duration;
  }

  onEditClick(): void {
    this.editClick.emit(this.service()._id);
  }

  onStartProjectClick(): void {
    this.startProjectClick.emit(this.service()._id);
  }

  onImageError(event: Event): void {
    // Replace broken image with placeholder
    const target = event.target as HTMLImageElement;
    target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';
  }
}
