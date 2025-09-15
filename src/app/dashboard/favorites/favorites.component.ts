import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { FavoritesService, Favorite } from '../../shared/services/favorites.service';
import { FavoriteButtonComponent } from '../../shared/components/favorite-button/favorite-button.component';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    FavoriteButtonComponent
  ],
  templateUrl: './favorites.component.html',
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    mat-card {
      border-radius: 12px;
      overflow: hidden;
    }
    
    mat-card-content {
      padding: 0 16px 16px 16px !important;
    }
    
    mat-card-actions {
      margin: 0 !important;
      padding: 0 !important;
    }
  `]
})
export class FavoritesComponent implements OnInit {
  private readonly favoritesService = inject(FavoritesService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal<boolean>(false);
  readonly error = signal<string>('');
  readonly favorites = this.favoritesService.userFavorites;
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly currentUser = this.authService.user;
  
  // Filter out favorites with missing business data and get business from business_id if populated
  readonly validFavorites = computed(() => 
    this.favorites().filter(favorite => {
      // Check if business_id is populated with business object
      if (typeof favorite.business_id === 'object' && favorite.business_id._id) {
        return true;
      }
      // Check if there's a separate business property
      return favorite.business && favorite.business._id;
    })
  );

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
    this.router.navigate(['/business', business.slug]);
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
}