import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Service } from '../../../shared/services/business.service';
import { ServiceCardComponent } from '../service-card/service-card.component';

@Component({
  selector: 'app-business-services-section',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ServiceCardComponent
  ],
  templateUrl: './business-services-section.component.html',
  styleUrls: ['./business-services-section.component.scss']
})
export class BusinessServicesSectionComponent {
  activeServices = input.required<Service[]>();
  featuredServices = input.required<Service[]>();
  servicesLoading = input.required<boolean>();
  isOwner = input.required<boolean>();
  
  addServiceClick = output<void>();
  editServiceClick = output<string>();
  startProjectClick = output<string>();

  currentIndex = signal(0);
  itemsPerPage = 3; // Show 3 cards at a time (2.5 visible)

  onAddService(): void {
    this.addServiceClick.emit();
  }

  onEditService(serviceId: string): void {
    this.editServiceClick.emit(serviceId);
  }

  onStartProject(serviceId: string): void {
    this.startProjectClick.emit(serviceId);
  }

  // Calculate slide width based on how many cards to show
  // We want to show 2.5 cards, so each slide moves by the width of 2.5 cards
  getSlideWidth(): number {
    // Each slide moves by approximately 40% (showing 2.5 cards means moving ~2 cards)
    return 80; // Move 80% to show 2 full cards and half of the next
  }

  nextSlide(): void {
    const services = this.activeServices();
    const maxIndex = Math.max(0, services.length - 3); // Can slide until last 3 cards are visible
    if (this.currentIndex() < services.length - 3) {
      this.currentIndex.update(i => Math.min(i + 2, maxIndex));
    }
  }

  prevSlide(): void {
    if (this.currentIndex() > 0) {
      this.currentIndex.update(i => Math.max(i - 2, 0));
    }
  }

  goToSlide(index: number): void {
    this.currentIndex.set(index * 2);
  }

  getTotalPages(): number {
    return Math.ceil(this.activeServices().length / 2);
  }

  getPageArray(): number[] {
    return Array.from({ length: this.getTotalPages() }, (_, i) => i);
  }

  getVisibleServices(): Service[] {
    const start = this.currentIndex() * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.activeServices().slice(start, end);
  }
}
