import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface CompletionRequestData {
  content: string;
}

@Component({
  selector: 'app-completion-request-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  template: `
    <h1 mat-dialog-title class="dialog-title">
      <mat-icon class="title-icon">check_circle</mat-icon>
      Request Project Completion
    </h1>
    
    <div mat-dialog-content class="dialog-content">
      <p class="description">
        You're about to request client approval for project completion. 
        Please describe what has been completed and delivered.
      </p>

      <form [formGroup]="completionForm" class="completion-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Completion Details</mat-label>
          <textarea 
            matInput 
            formControlName="content"
            rows="6"
            placeholder="Describe what has been completed, delivered, or achieved..."></textarea>
          <mat-hint>Be specific about deliverables and outcomes</mat-hint>
          <mat-error *ngIf="completionForm.get('content')?.hasError('required')">
            Completion details are required
          </mat-error>
          <mat-error *ngIf="completionForm.get('content')?.hasError('minlength')">
            Please provide more detailed information (at least 20 characters)
          </mat-error>
        </mat-form-field>
      </form>
    </div>
    
    <div mat-dialog-actions align="end">
      <button 
        mat-button 
        (click)="onCancel()">
        Cancel
      </button>
      <button 
        mat-raised-button 
        color="primary"
        (click)="onSubmit()"
        [disabled]="completionForm.invalid">
        <mat-icon>send</mat-icon>
        Request Completion Approval
      </button>
    </div>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 0;
    }

    .title-icon {
      color: #10b981;
      font-size: 24px;
    }

    .dialog-content {
      min-width: 400px;
      max-width: 500px;
    }

    .description {
      color: #64748b;
      font-size: 14px;
      line-height: 1.5;
      margin: 0 0 16px 0;
      padding: 12px;
      background: #f8fafc;
      border-radius: 8px;
      border-left: 4px solid #10b981;
    }

    .completion-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    mat-dialog-actions {
      padding-top: 16px;
    }

    mat-dialog-actions button {
      margin-left: 8px;
    }

    mat-dialog-actions button mat-icon {
      margin-right: 8px;
      font-size: 18px;
    }
  `]
})
export class CompletionRequestModalComponent {
  private readonly dialogRef = inject(MatDialogRef<CompletionRequestModalComponent>);
  private readonly formBuilder = inject(FormBuilder);

  completionForm: FormGroup;

  constructor() {
    this.completionForm = this.formBuilder.group({
      content: ['Project has been completed and is ready for review.', [Validators.required, Validators.minLength(20)]]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.completionForm.valid) {
      const result: CompletionRequestData = {
        content: this.completionForm.value.content
      };
      this.dialogRef.close(result);
    }
  }
}
