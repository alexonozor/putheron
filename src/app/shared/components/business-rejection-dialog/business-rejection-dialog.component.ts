import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

export interface BusinessRejectionDialogData {
  businessName: string;
}

export interface BusinessRejectionResult {
  reason: string;
}

@Component({
  selector: 'app-business-rejection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  template: `
    <div class="p-6 max-w-lg">
      <div class="flex items-center mb-4">
        <mat-icon class="text-red-600 mr-3 text-3xl">cancel</mat-icon>
        <h2 mat-dialog-title class="text-xl font-semibold text-gray-900 m-0">
          Reject Business Submission
        </h2>
      </div>

      <div class="mb-4">
        <p class="text-gray-700 mb-2">
          You are about to reject the business submission for:
        </p>
        <p class="font-semibold text-gray-900 bg-gray-100 p-3 rounded-lg">
          {{ data.businessName }}
        </p>
      </div>

      <mat-dialog-content class="p-0">
        <div class="mb-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Select a reason (optional)</mat-label>
            <mat-select [(value)]="selectedPresetReason" (selectionChange)="onPresetReasonChange()">
              <mat-option value="">Custom reason...</mat-option>
              <mat-option value="incomplete_information">Incomplete business information</mat-option>
              <mat-option value="invalid_documents">Invalid or missing required documents</mat-option>
              <mat-option value="unverifiable_business">Unable to verify business legitimacy</mat-option>
              <mat-option value="inappropriate_content">Inappropriate content or images</mat-option>
              <mat-option value="duplicate_business">Duplicate business already exists</mat-option>
              <mat-option value="policy_violation">Violates community guidelines or terms of service</mat-option>
              <mat-option value="incorrect_category">Incorrect business category or classification</mat-option>
              <mat-option value="spam_suspicious">Appears to be spam or suspicious activity</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="mb-6">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Detailed rejection reason *</mat-label>
            <textarea
              matInput
              [(ngModel)]="rejectionReason"
              placeholder="Please provide a clear explanation for why this business submission is being rejected. This will be sent to the business owner via email."
              rows="5"
              class="min-h-[120px]"
              required>
            </textarea>
            <mat-hint>
              Be specific and constructive. This message will help the business owner understand what needs to be corrected.
            </mat-hint>
          </mat-form-field>
        </div>

        <div class="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6">
          <div class="flex items-start">
            <mat-icon class="text-amber-600 mr-2 mt-0.5" style="font-size: 20px;">info</mat-icon>
            <div>
              <p class="font-medium text-amber-800 mb-1">Important Note:</p>
              <p class="text-amber-700 text-sm">
                The business owner will receive an email notification with your rejection reason. 
                They will be able to address the issues and resubmit their business for review.
              </p>
            </div>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="p-0 mt-6">
        <button mat-button (click)="onCancel()" class="mr-2">
          Cancel
        </button>
        <button 
          mat-raised-button 
          color="warn"
          (click)="onConfirm()"
          [disabled]="!rejectionReason.trim()"
          class="bg-red-600 hover:bg-red-700 text-white">
          <mat-icon class="mr-1">send</mat-icon>
          Reject & Send Notification
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class BusinessRejectionDialogComponent {
  rejectionReason = '';
  selectedPresetReason = '';

  // Preset reason templates
  private presetReasons: Record<string, string> = {
    incomplete_information: `Your business submission is incomplete. Please review and complete all required fields including business description, contact information, and service details. Ensure all mandatory information is provided before resubmitting.`,
    
    invalid_documents: `The documents or certifications provided are invalid, expired, or do not meet our requirements. Please upload valid, current documentation that clearly shows your business credentials and any required licenses or certifications.`,
    
    unverifiable_business: `We were unable to verify the legitimacy of your business through the information provided. Please ensure your business information matches official records and consider providing additional verification documents such as business registration or licenses.`,
    
    inappropriate_content: `Your business submission contains inappropriate content, images, or descriptions that do not meet our community standards. Please review our content guidelines and update your business information with professional, appropriate content.`,
    
    duplicate_business: `A business with similar details already exists in our platform. If this is your business, please contact support. If you're creating a new location or branch, please clearly indicate this in your business description.`,
    
    policy_violation: `Your business submission violates our community guidelines or terms of service. Please review our policies regarding acceptable business types, content standards, and platform rules before resubmitting.`,
    
    incorrect_category: `Your business has been placed in an incorrect category or subcategory. Please select the most appropriate category that accurately represents your primary business services or products.`,
    
    spam_suspicious: `Your submission appears to be spam or suspicious activity. If this is a legitimate business, please provide more detailed, authentic information about your services and ensure all content is original and accurate.`
  };

  constructor(
    public dialogRef: MatDialogRef<BusinessRejectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BusinessRejectionDialogData
  ) {}

  onPresetReasonChange(): void {
    if (this.selectedPresetReason && this.presetReasons[this.selectedPresetReason]) {
      this.rejectionReason = this.presetReasons[this.selectedPresetReason];
    }
  }

  onConfirm(): void {
    if (!this.rejectionReason.trim()) {
      return;
    }

    const result: BusinessRejectionResult = {
      reason: this.rejectionReason.trim()
    };

    this.dialogRef.close(result);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}