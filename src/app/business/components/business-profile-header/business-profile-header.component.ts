import { Component, input, output, signal, ViewChild, ElementRef, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Business } from '../../../shared/services/business.service';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { FavoriteButtonComponent } from '../../../shared/components/favorite-button/favorite-button.component';

@Component({
  selector: 'app-business-profile-header',
  standalone: true,
  imports: [
    CommonModule, 
    MatTabsModule, 
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    FavoriteButtonComponent
  ],
  templateUrl: './business-profile-header.component.html',
  styleUrls: ['./business-profile-header.component.scss']
})
export class BusinessProfileHeaderComponent implements AfterViewInit, OnDestroy {
  // Inputs
  business = input.required<Business>();
  isOwner = input.required<boolean>();
  activeServicesCount = input.required<number>();
  businessTypeDisplay = input.required<string>();
  activeSection = input<string>('about');

  // Outputs (Events)
  editBusinessClick = output<void>();
  addServiceClick = output<void>();
  startProjectClick = output<void>();
  visitWebsiteClick = output<void>();
  reportBusinessClick = output<void>();
  scrollToSection = output<string>();

  // Tab links
  links = ['About', 'Services', 'Portfolio', 'Reviews'];

  // ViewChild for original tabs
  @ViewChild('originalTabs', { read: ElementRef }) originalTabs?: ElementRef;

  // Signal to track if sticky tabs should be visible
  showStickyTabs = signal(false);

  private scrollContainer?: Element | null;
  private intersectionObserver?: IntersectionObserver;

  ngAfterViewInit() {
    // Get the scrollable container
    setTimeout(() => {
      this.scrollContainer = document.querySelector('mat-drawer-content');
      console.log('Scroll container found:', this.scrollContainer);
      console.log('Original tabs element:', this.originalTabs?.nativeElement);
      
      if (this.scrollContainer) {
        // Add scroll listener to the container
        this.scrollContainer.addEventListener('scroll', this.onScroll.bind(this));
        console.log('Scroll listener added');
      }
    }, 100);
  }

  private onScroll() {
    if (!this.originalTabs || !this.scrollContainer) return;

    // Get the position of the original tabs
    const tabsRect = this.originalTabs.nativeElement.getBoundingClientRect();
    const containerRect = this.scrollContainer.getBoundingClientRect();
    
    // Check if the tabs are above the container's visible area
    const tabsAreHidden = tabsRect.bottom < containerRect.top;
    
    console.log('Tabs bottom:', tabsRect.bottom, 'Container top:', containerRect.top, 'Should show sticky:', tabsAreHidden);
    
    this.showStickyTabs.set(tabsAreHidden);
  }

  ngOnDestroy() {
    if (this.scrollContainer) {
      this.scrollContainer.removeEventListener('scroll', this.onScroll.bind(this));
    }
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  // Handle tab click
  onTabClick(section: string) {
    this.scrollToSection.emit(section);
  }
}
