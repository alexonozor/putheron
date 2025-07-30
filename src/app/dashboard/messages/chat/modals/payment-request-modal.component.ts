import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface PaymentRequestData {
  amount: string;
  description: string;
  content: string;
}

@Component({
  selector: 'app-payment-request-modal',
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
      <mat-icon class="title-icon">payment</mat-icon>
      Request Additional Payment
    </h1>
    
    <div mat-dialog-content class="dialog-content">
      <form [formGroup]="paymentForm" class="payment-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Amount ($)</mat-label>
          <input 
            matInput 
            type="number" 
            formControlName="amount"
            placeholder="0.00"
            min="0.01"
            step="0.01">
          <mat-error *ngIf="paymentForm.get('amount')?.hasError('required')">
            Amount is required
          </mat-error>
          <mat-error *ngIf="paymentForm.get('amount')?.hasError('min')">
            Amount must be greater than 0
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <input 
            matInput 
            formControlName="description"
            placeholder="Why is additional payment needed?">
          <mat-error *ngIf="paymentForm.get('description')?.hasError('required')">
            Description is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Message to Client</mat-label>
          <textarea 
            matInput 
            formControlName="content"
            rows="4"
            placeholder="Explain the payment request in detail..."></textarea>
          <mat-error *ngIf="paymentForm.get('content')?.hasError('required')">
            Message is required
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
        [disabled]="paymentForm.invalid">
        <mat-icon>send</mat-icon>
        Send Payment Request
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
      color: #3b82f6;
      font-size: 24px;
    }

    .dialog-content {
      min-width: 400px;
      max-width: 500px;
    }

    .payment-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 16px;
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
export class PaymentRequestModalComponent {
  private readonly dialogRef = inject(MatDialogRef<PaymentRequestModalComponent>);
  private readonly formBuilder = inject(FormBuilder);

  paymentForm: FormGroup;

  constructor() {
    this.paymentForm = this.formBuilder.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      description: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.paymentForm.valid) {
      const formValue = this.paymentForm.value;
      const result: PaymentRequestData = {
        amount: formValue.amount.toString(),
        description: formValue.description,
        content: formValue.content
      };
      this.dialogRef.close(result);
    }
  }
}
