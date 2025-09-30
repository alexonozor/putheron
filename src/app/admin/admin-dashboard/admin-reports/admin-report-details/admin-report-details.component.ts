import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReportsService, Report, ReportType, ReportReason } from '../../../../shared/services/reports.service';
import { StatusUpdateDialogComponent, StatusUpdateDialogData, StatusUpdateDialogResult } from './status-update-dialog.component';

@Component({
  selector: 'app-admin-report-details',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './admin-report-details.component.html'
})
export class AdminReportDetailsComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private reportsService = inject(ReportsService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // Signals
  reportId = signal<string>('');
  report = signal<Report | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  
  // Admin action states
  updatingStatus = signal(false);

  // Enum references for template
  ReportType = ReportType;
  ReportReason = ReportReason;

  ngOnInit() {
    this.route.params.subscribe(params => {
      const reportId = params['id'];
      if (reportId) {
        this.reportId.set(reportId);
        this.loadReportDetails(reportId);
      }
    });
  }

  async loadReportDetails(reportId: string) {
    try {
      this.loading.set(true);
      this.error.set(null);
      
      const reportData = await this.reportsService.getReportAsync(reportId);
      this.report.set(reportData);
    } catch (error) {
      console.error('Failed to load report details:', error);
      this.error.set('Failed to load report details. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  // Navigation
  goBack() {
    this.router.navigate(['/admin/reports']);
  }

  // Status management
  openStatusModal(status: 'pending' | 'under_review' | 'resolved' | 'dismissed') {
    const currentReport = this.report();
    if (!currentReport) return;

    const dialogData: StatusUpdateDialogData = {
      currentStatus: currentReport.status,
      newStatus: status,
      reportId: currentReport._id
    };

    const dialogRef = this.dialog.open(StatusUpdateDialogComponent, {
      width: '500px',
      data: dialogData,
      disableClose: false // Allow closing, but handle API call after dialog closes
    });

    dialogRef.afterClosed().subscribe(async (result: StatusUpdateDialogResult) => {
      if (result) {
        // Disable close during API call by setting disableClose on the main component
        await this.updateReportStatus(result);
      }
    });
  }

  async updateReportStatus(statusUpdate: StatusUpdateDialogResult) {
    const currentReport = this.report();
    if (!currentReport) return;

    try {
      this.updatingStatus.set(true);
      
      // Make actual API call to update the report status
      const statusData = {
        status: statusUpdate.status,
        admin_notes: statusUpdate.adminNotes,
        resolution_action: statusUpdate.resolutionAction
      };

      console.log('Updating report status:', {
        reportId: currentReport._id,
        ...statusData
      });

      // Call the backend API to update the report
      const updatedReport = await this.reportsService.updateReportStatusAsync(currentReport._id, statusData);
      
      // Update local state with the response from backend
      this.report.set(updatedReport);
      
      console.log('Report status updated successfully:', updatedReport);
      
      // Show success notification
      this.snackBar.open(
        `Report status updated to "${this.reportsService.getStatusDisplayText(statusUpdate.status)}"`,
        'Close',
        { duration: 5000, panelClass: ['success-snackbar'] }
      );
      
    } catch (error) {
      console.error('Failed to update report status:', error);
      
      // Handle different types of errors
      let errorMessage = 'Failed to update report status. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Show error notification
      this.snackBar.open(
        `Error: ${errorMessage}`,
        'Close',
        { duration: 8000, panelClass: ['error-snackbar'] }
      );
      
    } finally {
      this.updatingStatus.set(false);
    }
  }

  // Utility methods
  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusColorClass(status: string): string {
    return this.reportsService.getStatusColorClass(status);
  }

  getReasonDisplayText(reason: ReportReason): string {
    return this.reportsService.getReasonDisplayText(reason);
  }

  getStatusDisplayText(status: string): string {
    return this.reportsService.getStatusDisplayText(status);
  }

  getReportTypeIcon(type: ReportType): string {
    switch (type) {
      case ReportType.USER:
        return 'person';
      case ReportType.BUSINESS:
        return 'business';
      case ReportType.PROJECT:
        return 'work';
      case ReportType.MESSAGE:
        return 'chat';
      default:
        return 'report';
    }
  }

  getReportTypeDisplayText(type: ReportType): string {
    switch (type) {
      case ReportType.USER:
        return 'User Report';
      case ReportType.BUSINESS:
        return 'Business Report';
      case ReportType.PROJECT:
        return 'Project Report';
      case ReportType.MESSAGE:
        return 'Message Report';
      default:
        return 'Unknown Report';
    }
  }

  getReportedEntityName(): string {
    const currentReport = this.report();
    if (!currentReport) return 'Unknown Entity';

    if (currentReport.reported_user_id && typeof currentReport.reported_user_id === 'object') {
      const user = currentReport.reported_user_id as any;
      return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Unknown User';
    }
    
    if (currentReport.reported_business_id && typeof currentReport.reported_business_id === 'object') {
      const business = currentReport.reported_business_id as any;
      return business.name || 'Unknown Business';
    }
    
    return 'Unknown Entity';
  }

  getReporterName(): string {
    const currentReport = this.report();
    if (!currentReport) return 'Unknown';

    if (currentReport.is_anonymous) {
      return 'Anonymous User';
    }

    if (currentReport.reporter_id && typeof currentReport.reporter_id === 'object') {
      const reporter = currentReport.reporter_id as any;
      return `${reporter.first_name || ''} ${reporter.last_name || ''}`.trim() || reporter.email || 'Unknown User';
    }

    return 'Unknown User';
  }

  canUpdateStatus(): boolean {
    const currentReport = this.report();
    return currentReport !== null && !this.updatingStatus();
  }

  hasEvidenceUrls(): boolean {
    const currentReport = this.report();
    return currentReport !== null && 
           currentReport.evidence_urls !== undefined && 
           currentReport.evidence_urls.length > 0;
  }

  getEvidenceUrls(): string[] {
    const currentReport = this.report();
    return currentReport?.evidence_urls || [];
  }

  getReportedEntityId(): string {
    const currentReport = this.report();
    if (!currentReport) return 'N/A';

    // Check for user ID
    if (currentReport.reported_user_id) {
      if (typeof currentReport.reported_user_id === 'object') {
        return (currentReport.reported_user_id as any)._id || 'N/A';
      }
      return currentReport.reported_user_id;
    }

    // Check for business ID
    if (currentReport.reported_business_id) {
      if (typeof currentReport.reported_business_id === 'object') {
        return (currentReport.reported_business_id as any)._id || 'N/A';
      }
      return currentReport.reported_business_id;
    }

    // Check for project ID
    if (currentReport.reported_project_id) {
      if (typeof currentReport.reported_project_id === 'object') {
        return (currentReport.reported_project_id as any)._id || 'N/A';
      }
      return currentReport.reported_project_id;
    }

    // Check for message ID
    if (currentReport.reported_message_id) {
      if (typeof currentReport.reported_message_id === 'object') {
        return (currentReport.reported_message_id as any)._id || 'N/A';
      }
      return currentReport.reported_message_id;
    }

    return 'N/A';
  }

  getBusinessDetails() {
    const currentReport = this.report();
    if (!currentReport?.reported_business_id || typeof currentReport.reported_business_id !== 'object') {
      return null;
    }
    return currentReport.reported_business_id as any;
  }

  getBusinessLogoUrl(): string {
    const business = this.getBusinessDetails();
    return business?.logo_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iMjAiIGZpbGw9IiNGM0Y0RjYiLz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIxMiIgeT0iMTIiPgo8cGF0aCBkPSJNMTQgOEMxNCA5LjEgMTMuMSAxMCAxMiAxMEgxMEM4LjkgMTAgOCA5LjEgOCA4VjZDOCA0LjkgOC45IDQgMTAgNEgxMkMxMy4xIDQgMTQgNC45IDE0IDZWOFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIxMiIgeT0iMTIiPgo8L3N2Zz4K';
  }

  getBusinessName(): string {
    const business = this.getBusinessDetails();
    return business?.name || 'Unknown Business';
  }

  getBusinessSlug(): string {
    const business = this.getBusinessDetails();
    return business?.slug || '';
  }

  getBusinessStatus(): string {
    const business = this.getBusinessDetails();
    return business?.status || 'unknown';
  }

  isBusinessActive(): boolean {
    const business = this.getBusinessDetails();
    return business?.is_active === true;
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iMjAiIGZpbGw9IiNGM0Y0RjYiLz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIxMiIgeT0iMTIiPgo8cGF0aCBkPSJNMTQgOEMxNCA5LjEgMTMuMSAxMCAxMiAxMEgxMEM4LjkgMTAgOCA5LjEgOCA4VjZDOCA0LjkgOC45IDQgMTAgNEgxMkMxMy4xIDQgMTQgNC45IDE0IDZWOFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg==';
    }
  }

  viewEntityProfile(): void {
    const currentReport = this.report();
    if (!currentReport) {
      this.snackBar.open('No report data available', 'Close', { duration: 3000 });
      return;
    }

    const reportType = currentReport.report_type;
    let navigated = false;
    
    try {
      if (reportType === 'business' && currentReport.reported_business_id) {
        const businessId = typeof currentReport.reported_business_id === 'object' 
          ? (currentReport.reported_business_id as any)._id 
          : currentReport.reported_business_id;
        
        if (businessId) {
          this.router.navigate(['/admin/dashboard/businesses/details', businessId]);
          navigated = true;
        }
      } else if (reportType === 'user' && currentReport.reported_user_id) {
        const userId = typeof currentReport.reported_user_id === 'object'
          ? (currentReport.reported_user_id as any)._id
          : currentReport.reported_user_id;
        
        if (userId) {
          // Navigate to admin user details page (adjust route as needed)
          this.router.navigate(['/admin/dashboard/users/details', userId]);
          navigated = true;
        }
      } else if (reportType === 'project' && currentReport.reported_project_id) {
        const projectId = typeof currentReport.reported_project_id === 'object'
          ? (currentReport.reported_project_id as any)._id
          : currentReport.reported_project_id;
        
        if (projectId) {
          // Navigate to admin project details page (adjust route as needed)
          this.router.navigate(['/admin/dashboard/projects/details', projectId]);
          navigated = true;
        }
      }

      if (!navigated) {
        this.snackBar.open(
          `Unable to navigate to ${reportType} profile. Entity ID not available.`,
          'Close',
          { duration: 5000 }
        );
      }
    } catch (error) {
      console.error('Navigation error:', error);
      this.snackBar.open(
        `Failed to navigate to ${reportType} profile. Please try again.`,
        'Close',
        { duration: 5000 }
      );
    }
  }

  canViewEntityProfile(): boolean {
    const currentReport = this.report();
    if (!currentReport) return false;

    const reportType = currentReport.report_type;
    
    if (reportType === 'business' && currentReport.reported_business_id) {
      const businessId = typeof currentReport.reported_business_id === 'object' 
        ? (currentReport.reported_business_id as any)?._id 
        : currentReport.reported_business_id;
      return !!businessId;
    }
    
    if (reportType === 'user' && currentReport.reported_user_id) {
      const userId = typeof currentReport.reported_user_id === 'object'
        ? (currentReport.reported_user_id as any)?._id
        : currentReport.reported_user_id;
      return !!userId;
    }
    
    if (reportType === 'project' && currentReport.reported_project_id) {
      const projectId = typeof currentReport.reported_project_id === 'object'
        ? (currentReport.reported_project_id as any)?._id
        : currentReport.reported_project_id;
      return !!projectId;
    }

    return false;
  }

  getStatusActions(): Array<{status: 'pending' | 'under_review' | 'resolved' | 'dismissed', label: string, color: string}> {
    return [
      { status: 'under_review', label: 'Mark as Under Review', color: 'bg-blue-600 hover:bg-blue-700' },
      { status: 'resolved', label: 'Resolve Report', color: 'bg-green-600 hover:bg-green-700' },
      { status: 'dismissed', label: 'Dismiss Report', color: 'bg-gray-600 hover:bg-gray-700' },
      { status: 'pending', label: 'Mark as Pending', color: 'bg-yellow-600 hover:bg-yellow-700' }
    ];
  }
}