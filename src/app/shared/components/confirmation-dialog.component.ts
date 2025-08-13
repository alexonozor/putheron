import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  icon?: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="p-6">
      <div class="flex items-center mb-4">
        @if (data.icon) {
          <mat-icon 
            [class]="getIconClass()"
            class="mr-3 text-3xl">
            {{ data.icon }}
          </mat-icon>
        }
        <h2 class="text-xl font-semibold text-gray-900">{{ data.title }}</h2>
      </div>
      
      <p class="text-gray-600 mb-6 leading-relaxed">{{ data.message }}</p>
      
      <div class="flex justify-end gap-3">
        <button 
          mat-stroked-button
          (click)="onCancel()"
          class="px-4 py-2">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button 
          mat-raised-button
          [class]="getConfirmButtonClass()"
          (click)="onConfirm()"
          class="px-4 py-2">
          {{ data.confirmText || 'Confirm' }}
        </button>
      </div>
    </div>
  `
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getIconClass(): string {
    const baseClass = 'w-8 h-8';
    switch (this.data.type) {
      case 'danger':
        return `${baseClass} text-red-600`;
      case 'warning':
        return `${baseClass} text-yellow-600`;
      case 'info':
      default:
        return `${baseClass} text-blue-600`;
    }
  }

  getConfirmButtonClass(): string {
    switch (this.data.type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case 'info':
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  }
}
