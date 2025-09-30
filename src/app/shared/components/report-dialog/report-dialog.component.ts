import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';

export enum ReportType {
  USER = 'user',
  BUSINESS = 'business',
  PROJECT = 'project',
  MESSAGE = 'message',
}

export enum ReportReason {
  HARASSMENT = 'harassment',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  SPAM = 'spam',
  FRAUD = 'fraud',
  FAKE_PROFILE = 'fake_profile',
  OFFENSIVE_LANGUAGE = 'offensive_language',
  DISCRIMINATION = 'discrimination',
  VIOLATION_OF_TERMS = 'violation_of_terms',
  IMPERSONATION = 'impersonation',
  INTELLECTUAL_PROPERTY = 'intellectual_property',
  SAFETY_CONCERNS = 'safety_concerns',
  OTHER = 'other',
}

export interface ReportDialogData {
  reportType: ReportType;
  targetName: string;
  targetId: string;
  contextInfo?: string;
}

export interface ReportDialogResult {
  reason: ReportReason;
  customReason?: string;
  description?: string;
  isAnonymous: boolean;
}

@Component({
  selector: 'app-report-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatCheckboxModule
  ],
  templateUrl: './report-dialog.component.html',
  styleUrls: ['./report-dialog.component.scss']
})
export class ReportDialogComponent {
  readonly ReportReason = ReportReason;
  
  selectedReason = '';
  customReason = '';
  description = '';
  isAnonymous = false;
  
  readonly reasonOptions: Array<{ value: ReportReason; label: string; description: string }>;
  readonly entityType: string;
  readonly entityTypeLowercase: string;

  constructor(
    public dialogRef: MatDialogRef<ReportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReportDialogData
  ) {
    this.reasonOptions = this.buildReasonOptions();
    this.entityType = this.getEntityType();
    this.entityTypeLowercase = this.entityType.toLowerCase();
  }

  private getEntityType(): string {
    switch (this.data.reportType) {
      case ReportType.USER:
        return 'User';
      case ReportType.BUSINESS:
        return 'Business';
      case ReportType.PROJECT:
        return 'Project';
      case ReportType.MESSAGE:
        return 'Message';
      default:
        return 'Entity';
    }
  }

  private buildReasonOptions() {
    const commonReasons = [
      {
        value: ReportReason.HARASSMENT,
        label: 'Harassment or bullying',
        description: 'Threatening, intimidating, or abusive behavior'
      },
      {
        value: ReportReason.INAPPROPRIATE_CONTENT,
        label: 'Inappropriate content',
        description: 'Sexual, violent, or disturbing content'
      },
      {
        value: ReportReason.SPAM,
        label: 'Spam',
        description: 'Repetitive, unwanted, or promotional content'
      },
      {
        value: ReportReason.OFFENSIVE_LANGUAGE,
        label: 'Offensive language',
        description: 'Hate speech, profanity, or offensive language'
      },
      {
        value: ReportReason.DISCRIMINATION,
        label: 'Discrimination',
        description: 'Content targeting race, gender, religion, etc.'
      }
    ];

    const businessSpecificReasons = [
      {
        value: ReportReason.FRAUD,
        label: 'Fraud or scam',
        description: 'Deceptive business practices or fraudulent services'
      },
      {
        value: ReportReason.FAKE_PROFILE,
        label: 'Fake business profile',
        description: 'Business profile with false or misleading information'
      }
    ];

    const userSpecificReasons = [
      {
        value: ReportReason.IMPERSONATION,
        label: 'Impersonation',
        description: 'Pretending to be someone else'
      },
      {
        value: ReportReason.FAKE_PROFILE,
        label: 'Fake profile',
        description: 'Profile with false or misleading information'
      }
    ];

    const additionalReasons = [
      {
        value: ReportReason.VIOLATION_OF_TERMS,
        label: 'Violation of terms',
        description: 'Breaking platform rules or terms of service'
      },
      {
        value: ReportReason.INTELLECTUAL_PROPERTY,
        label: 'Intellectual property violation',
        description: 'Copyright or trademark infringement'
      },
      {
        value: ReportReason.SAFETY_CONCERNS,
        label: 'Safety concerns',
        description: 'Content that poses safety or security risks'
      },
      {
        value: ReportReason.OTHER,
        label: 'Other',
        description: 'Something else that violates our community guidelines'
      }
    ];

    let reasons = [...commonReasons];

    if (this.data.reportType === ReportType.BUSINESS) {
      reasons = [...reasons, ...businessSpecificReasons];
    } else if (this.data.reportType === ReportType.USER) {
      reasons = [...reasons, ...userSpecificReasons];
    }

    return [...reasons, ...additionalReasons];
  }

  canSubmit(): boolean {
    if (!this.selectedReason) {
      return false;
    }
    
    if (this.selectedReason === ReportReason.OTHER && (!this.customReason || this.customReason.trim().length === 0)) {
      return false;
    }
    
    return true;
  }

  onSubmit(): void {
    if (!this.canSubmit()) {
      return;
    }

    const result: ReportDialogResult = {
      reason: this.selectedReason as ReportReason,
      customReason: this.selectedReason === ReportReason.OTHER ? this.customReason.trim() : undefined,
      description: this.description.trim() || undefined,
      isAnonymous: this.isAnonymous
    };

    this.dialogRef.close(result);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}