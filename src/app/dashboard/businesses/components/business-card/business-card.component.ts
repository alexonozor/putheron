import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Business } from '../../../../shared/services/business.service';
import { FavoriteButtonComponent } from '../../../../shared/components/favorite-button/favorite-button.component';
import { AuthService } from '../../../../shared/services/auth.service';

@Component({
  selector: 'app-business-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, FavoriteButtonComponent],
  templateUrl: './business-card.component.html',
  styleUrl: './business-card.component.scss'
})
export class BusinessCardComponent {
  private readonly authService = inject(AuthService);

  @Input() business!: Business | any;
  @Input() statusColorClass: string = '';
  @Input() statusText: string = '';
  @Input() categoryName: string = '';
  @Input() businessTypeColor: string = '';
  @Input() businessTypeText: string = '';
  @Input() showFavoriteButton = false;
  @Input() showEditDelete = true;

  @Output() view = new EventEmitter<string>();
  @Output() edit = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();

  readonly currentUser = this.authService.user;

  isBusinessOwner(): boolean {
    if (!this.currentUser() || !this.business) {
      return false;
    }
    return this.business.owner_id === this.currentUser()?._id || 
           this.business.owner_id?._id === this.currentUser()?._id;
  }

  onView() {
    this.view.emit(this.business._id);
  }

  onEdit() {
    this.edit.emit(this.business._id);
  }

  onDelete() {
    this.delete.emit(this.business._id);
  }
}
