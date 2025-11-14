import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { FavoritesService, Favorite } from '../../shared/services/favorites.service';
import { AuthService } from '../../shared/services/auth.service';
import { DashboardSubheaderComponent } from '../../shared/components/dashboard-subheader/dashboard-subheader.component';
import { BusinessSearchFilterComponent } from '../../shared/components/business-search-filter/business-search-filter.component';
import { BusinessCardComponent } from '../businesses/components/business-card/business-card.component';
import { BusinessListCardComponent } from '../businesses/components/business-list-card/business-list-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    DashboardSubheaderComponent,
    BusinessSearchFilterComponent,
    BusinessCardComponent,
    BusinessListCardComponent,
    EmptyStateComponent
  ],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss'
})
export class FavoritesComponent implements OnInit {
  private readonly favoritesService = inject(FavoritesService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly loading = signal<boolean>(false);
  readonly error = signal<string>('');
  readonly searchTerm = signal<string>('');
  readonly viewMode = signal<'grid' | 'list'>('grid');
  readonly favorites = this.favoritesService.userFavorites;
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly currentUser = this.authService.user;
  
  // Filter out favorites with missing business data and get business from business_id if populated
  readonly validFavorites = computed(() => 
    this.favorites()
      .filter(favorite => {
        // Check if business_id is populated with business object
        if (typeof favorite.business_id === 'object' && favorite.business_id._id) {
          return true;
        }
        // Check if there's a separate business property
        return favorite.business && favorite.business._id;
      })
      .filter(favorite => {
        const business = this.getBusiness(favorite);
        if (!business) return false;
        const search = this.searchTerm().toLowerCase().trim();
        if (!search) return true;
        
        return business.name.toLowerCase().includes(search) ||
               business.description?.toLowerCase().includes(search) ||
               business.city?.toLowerCase().includes(search) ||
               business.state?.toLowerCase().includes(search);
      })
  );

  // Get list of businesses for list view
  readonly favoritesBusinesses = computed(() => {
    return this.validFavorites()
      .map(fav => this.getBusiness(fav))
      .filter((business): business is any => !!business);
  });

  // Get business object from either business_id (if populated) or business property
  getBusiness(favorite: Favorite) {
    if (typeof favorite.business_id === 'object') {
      return favorite.business_id;
    }
    return favorite.business;
  }

  ngOnInit() {
    if (!this.isAuthenticated()) {
      this.error.set('You must be logged in to view favorites');
      return;
    }
    
    // Set view mode based on screen size
    this.breakpointObserver.observe([Breakpoints.Tablet]).subscribe(result => {
      this.viewMode.set(result.matches ? 'list' : 'grid');
    });
    
    this.loadFavorites();
  }

  async loadFavorites() {
    this.loading.set(true);
    this.error.set('');
    
    try {
      await this.favoritesService.refreshFavorites();
    } catch (error: any) {
      console.error('Error loading favorites:', error);
      this.error.set(error.message || 'Failed to load favorites');
    } finally {
      this.loading.set(false);
    }
  }

  viewBusiness(business: any) {
    this.router.navigate(['/business/profile', business._id]);
  }

  searchBusinesses() {
    this.router.navigate(['/search']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'today';
    } else if (diffInDays === 1) {
      return 'yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  // Helper methods for business card
  getStatusColor(business: any): string {
    return 'bg-green-100 text-green-800';
  }

  getStatusText(business: any): string {
    return 'Active';
  }

  getCategoryName(business: any): string {
    return (business.category_id as any)?.name || 'Business';
  }

  getBusinessTypeColor(type: string): string {
    return 'bg-blue-100 text-blue-800';
  }

  getBusinessTypeText(type: string): string {
    return 'Service';
  }

  clearSearch() {
    this.searchTerm.set('');
  }

  setViewMode(mode: 'grid' | 'list') {
    this.viewMode.set(mode);
  }

  // Helper for list view - create map of business names
  getBusinessNameMap(): { [key: string]: string } {
    const map: { [key: string]: string } = {};
    this.validFavorites().forEach(favorite => {
      const business = this.getBusiness(favorite);
      if (business) {
        map[business._id] = business.name;
      }
    });
    return map;
  }

  editBusiness(businessId: string) {
    this.router.navigate(['/dashboard/edit', businessId]);
  }

  async deleteBusiness(businessId: string) {
    // Remove from favorites
    try {
      await this.favoritesService.removeFromFavoritesAsync(businessId);
    } catch (error: any) {
      console.error('Error removing from favorites:', error);
    }
  }
}