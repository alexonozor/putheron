import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface FavoriteConfirmDialogData {
  action: 'add' | 'remove';
  businessName: string;
  isFavorited: boolean;
}

@Component({
  selector: 'app-favorite-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './favorite-confirm-dialog.component.html',
  styleUrl: './favorite-confirm-dialog.component.scss'
})
export class FavoriteConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<FavoriteConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FavoriteConfirmDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  getTitle(): string {
    return this.data.action === 'add' 
      ? 'Add to Favorites' 
      : 'Remove from Favorites';
  }

  getMessage(): string {
    if (this.data.action === 'add') {
      return `Are you sure you want to add "${this.data.businessName}" to your favorites? You'll be able to easily find it later in your favorites list.`;
    } else {
      return `Are you sure you want to remove "${this.data.businessName}" from your favorites?`;
    }
  }

  getIconClass(): string {
    return this.data.action === 'add' ? 'text-red-500' : 'text-red-500';
  }

  getConfirmButtonClass(): string {
    const baseClass = 'text-white transition-colors duration-200';
    return this.data.action === 'add' 
      ? `${baseClass} bg-blue-500 hover:bg-blue-600`
      : `${baseClass} bg-red-500 hover:bg-red-600`;
  }

  getConfirmButtonText(): string {
    return this.data.action === 'add' ? 'Add to Favorites' : 'Remove';
  }
}