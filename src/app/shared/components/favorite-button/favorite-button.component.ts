import { Component, Input, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { FavoritesService } from '../../services/favorites.service';
import { AuthService } from '../../services/auth.service';
import { FavoriteConfirmDialogComponent } from '../favorite-confirm-dialog/favorite-confirm-dialog.component';

@Component({
  selector: 'app-favorite-button',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './favorite-button.component.html',
  styleUrl: './favorite-button.component.scss'
})
export class FavoriteButtonComponent {
  @Input() businessId!: string;
  @Input() businessName?: string;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() showText = false;
  @Input() buttonClass = 'favorite-button';

  private readonly favoritesService = inject(FavoritesService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal<boolean>(false);
  readonly isFavorited = signal<boolean>(false);
  readonly isAuthenticated = this.authService.isAuthenticated;

  constructor() {
    // Effect to watch for changes in favorited business IDs
    effect(() => {
      if (this.businessId) {
        this.favoritesService.isBusinessFavorited(this.businessId).subscribe(
          isFavorited => this.isFavorited.set(isFavorited)
        );
      }
    });
  }

  async onFavoriteClick(): Promise<void> {
    if (!this.isAuthenticated()) {
      // Could show login prompt here
      return;
    }

    if (!this.businessId) {
      console.error('Business ID is required for favorite button');
      return;
    }

    const currentlyFavorited = this.isFavorited();
    const action = currentlyFavorited ? 'remove' : 'add';
    const businessName = this.businessName || 'this business';

    // Show confirmation dialog
    const confirmed = await this.showConfirmationDialog(action, businessName);
    if (!confirmed) {
      return;
    }

    this.loading.set(true);

    try {
      if (currentlyFavorited) {
        await this.favoritesService.removeFromFavoritesAsync(this.businessId);
        console.log(`Removed ${businessName} from favorites`);
      } else {
        await this.favoritesService.addToFavoritesAsync(this.businessId);
        console.log(`Added ${businessName} to favorites`);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // You could show an error toast here
    } finally {
      this.loading.set(false);
    }
  }

  private async showConfirmationDialog(action: 'add' | 'remove', businessName: string): Promise<boolean> {
    
    const dialogRef = this.dialog.open(FavoriteConfirmDialogComponent, {
      width: '400px',
      data: {
        action,
        businessName,
        isFavorited: this.isFavorited()
      }
    });

    return dialogRef.afterClosed().toPromise();
  }

  getTooltipText(): string {
    if (!this.isAuthenticated()) {
      return 'Login to save favorites';
    }
    
    if (this.loading()) {
      return 'Processing...';
    }
    
    return this.isFavorited() 
      ? 'Remove from favorites' 
      : 'Add to favorites';
  }

  getIconClass(): string {
    const baseClass = 'favorite-icon';
    const activeClass = this.isFavorited() ? 'favorite-icon-active' : 'favorite-icon-inactive';
    return `${baseClass} ${activeClass}`;
  }
}