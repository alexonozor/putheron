import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ReportConfirmationDialogData {
  entityType: string;
  entityName: string;
}

@Component({
  selector: 'app-report-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './report-confirmation-dialog.component.html',
  styleUrls: ['./report-confirmation-dialog.component.scss']
})
export class ReportConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ReportConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReportConfirmationDialogData
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}