import { Component, Inject, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface StatusUpdateDialogData {
  currentStatus: string;
  newStatus: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  reportId: string;
}

export interface StatusUpdateDialogResult {
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  adminNotes?: string;
  resolutionAction?: string;
}

@Component({
  selector: 'app-status-update-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="bg-white">
      <!-- Dialog Header -->
      <div class="flex items-start p-6 pb-4">
        <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10"
             [ngClass]="{
               'bg-blue-100': data.newStatus === 'under_review',
               'bg-green-100': data.newStatus === 'resolved',
               'bg-gray-100': data.newStatus === 'dismissed',
               'bg-yellow-100': data.newStatus === 'pending'
             }">
          <mat-icon class="h-6 w-6"
                   [ngClass]="{
                     'text-blue-600': data.newStatus === 'under_review',
                     'text-green-600': data.newStatus === 'resolved',
                     'text-gray-600': data.newStatus === 'dismissed',
                     'text-yellow-600': data.newStatus === 'pending'
                   }">
            {{ getStatusIcon() }}
          </mat-icon>
        </div>
        <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
          <h2 mat-dialog-title class="text-lg leading-6 font-medium text-gray-900">
            Update Report Status
          </h2>
          <div mat-dialog-content class="mt-4 space-y-4">
            <p class="text-sm text-gray-500">
              Change status to: <span class="font-medium capitalize">{{ getStatusDisplayText() }}</span>
            </p>

            <!-- Admin Notes -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Admin Notes (Optional)</mat-label>
              <textarea 
                matInput
                [(ngModel)]="adminNotes"
                rows="3"
                placeholder="Add notes about your decision...">
              </textarea>
            </mat-form-field>

            <!-- Resolution Action (for resolved/dismissed) -->
            <mat-form-field 
              *ngIf="data.newStatus === 'resolved' || data.newStatus === 'dismissed'" 
              appearance="outline" 
              class="w-full">
              <mat-label>
                Resolution Action
                <span *ngIf="data.newStatus === 'resolved'" class="text-red-500">*</span>
              </mat-label>
              <input
                matInput
                [(ngModel)]="resolutionAction"
                placeholder="Describe the action taken..."
                [required]="data.newStatus === 'resolved'">
            </mat-form-field>
          </div>
        </div>
      </div>

      <!-- Dialog Actions -->
      <div mat-dialog-actions class="flex flex-row-reverse gap-3 p-6 pt-0">
        <button 
          mat-raised-button
          [color]="getButtonColor()"
          (click)="updateStatus()"
          [disabled]="data.newStatus === 'resolved' && !resolutionAction()"
          class="min-w-24">
          Update Status
        </button>
        <button 
          mat-button
          (click)="cancel()"
          color="warn">
          Cancel
        </button>
      </div>
    </div>
  `
})
export class StatusUpdateDialogComponent {
  adminNotes = signal('');
  resolutionAction = signal('');

  constructor(
    public dialogRef: MatDialogRef<StatusUpdateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StatusUpdateDialogData
  ) {}

  getStatusIcon(): string {
    switch (this.data.newStatus) {
      case 'under_review': return 'search';
      case 'resolved': return 'check_circle';
      case 'dismissed': return 'cancel';
      case 'pending': return 'schedule';
      default: return 'help';
    }
  }

  getStatusDisplayText(): string {
    switch (this.data.newStatus) {
      case 'under_review': return 'Under Review';
      case 'resolved': return 'Resolved';
      case 'dismissed': return 'Dismissed';
      case 'pending': return 'Pending';
      default: return this.data.newStatus;
    }
  }

  getButtonColor(): string {
    switch (this.data.newStatus) {
      case 'under_review': return 'primary';
      case 'resolved': return 'primary';
      case 'dismissed': return 'warn';
      case 'pending': return 'accent';
      default: return 'primary';
    }
  }

  updateStatus(): void {
    if (this.data.newStatus === 'resolved' && !this.resolutionAction()) {
      return; // Don't proceed if resolution action is required but not provided
    }

    // Close dialog with the update data - the actual API call will be handled by the parent component
    const result: StatusUpdateDialogResult = {
      status: this.data.newStatus,
      adminNotes: this.adminNotes(),
      resolutionAction: this.resolutionAction()
    };

    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}