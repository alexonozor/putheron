import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReportsService, Report, ReportType, ReportReason } from '../../../../shared/services/reports.service';

@Component({
  selector: 'app-admin-reports-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-reports-list.component.html'
})
export class AdminReportsListComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private reportsService = inject(ReportsService);
  
  // Signals for reactive state management
  reports = signal<Report[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  selectedReports = signal<Set<string>>(new Set());
  showBulkActionModal = signal(false);
  bulkActionType = signal<'resolve' | 'dismiss' | 'review' | null>(null);
  
  // Pagination and filters
  currentPage = signal(1);
  totalPages = signal(1);
  totalReports = signal(0);
  pageSize = signal(20);
  
  // Filter states
  searchTerm = signal('');
  selectedReportType = signal<ReportType | 'all'>('all');
  selectedReason = signal<ReportReason | 'all'>('all');
  selectedStatus = signal<'pending' | 'under_review' | 'resolved' | 'dismissed' | 'all'>('all');
  sortBy = signal<'createdAt' | 'status' | 'reason'>('createdAt');
  sortOrder = signal<'asc' | 'desc'>('desc');

  // Computed properties
  filteredReports = computed(() => {
    let filtered = this.reports();
    
    // Apply search filter
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(report => 
        report._id.toLowerCase().includes(search) ||
        report.reason.toLowerCase().includes(search) ||
        report.custom_reason?.toLowerCase().includes(search) ||
        report.description?.toLowerCase().includes(search)
      );
    }
    
    // Apply type filter
    if (this.selectedReportType() !== 'all') {
      filtered = filtered.filter(report => report.report_type === this.selectedReportType());
    }
    
    // Apply reason filter
    if (this.selectedReason() !== 'all') {
      filtered = filtered.filter(report => report.reason === this.selectedReason());
    }
    
    // Apply status filter
    if (this.selectedStatus() !== 'all') {
      filtered = filtered.filter(report => report.status === this.selectedStatus());
    }
    
    return filtered;
  });

  hasSelectedReports = computed(() => this.selectedReports().size > 0);
  
  // Enum references for template
  ReportType = ReportType;
  ReportReason = ReportReason;

  ngOnInit() {
    this.loadReports();
  }

  async loadReports() {
    try {
      this.loading.set(true);
      this.error.set(null);
      
      // For now, we'll use the existing method and adapt it
      // In a real implementation, you'd create an admin-specific endpoint
      const response = await this.reportsService.getMyReportsAsync(
        this.currentPage(), 
        this.pageSize()
      );
      
      this.reports.set(response.reports);
      this.totalReports.set(response.total);
      this.totalPages.set(response.totalPages);
    } catch (error) {
      console.error('Failed to load reports:', error);
      this.error.set('Failed to load reports. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  // Navigation methods
  goToReportDetails(reportId: string) {
    this.router.navigate(['../reports', reportId, { relativeTo: this.route }]).catch(err => {
      console.error('Navigation error:', err);
      this.error.set('Failed to navigate to report details.');
    });
  }

  // Selection methods
  toggleReportSelection(reportId: string) {
    const selected = new Set(this.selectedReports());
    if (selected.has(reportId)) {
      selected.delete(reportId);
    } else {
      selected.add(reportId);
    }
    this.selectedReports.set(selected);
  }

  toggleSelectAll() {
    const filteredIds = this.filteredReports().map(report => report._id);
    const currentSelected = this.selectedReports();
    
    if (filteredIds.every(id => currentSelected.has(id))) {
      // All are selected, unselect all
      this.selectedReports.set(new Set());
    } else {
      // Not all are selected, select all
      this.selectedReports.set(new Set(filteredIds));
    }
  }

  isReportSelected(reportId: string): boolean {
    return this.selectedReports().has(reportId);
  }

  areAllSelected(): boolean {
    const filteredIds = this.filteredReports().map(report => report._id);
    return filteredIds.length > 0 && filteredIds.every(id => this.selectedReports().has(id));
  }

  // Filter methods
  clearFilters() {
    this.searchTerm.set('');
    this.selectedReportType.set('all');
    this.selectedReason.set('all');
    this.selectedStatus.set('all');
  }

  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadReports();
    }
  }

  previousPage() {
    this.goToPage(this.currentPage() - 1);
  }

  nextPage() {
    this.goToPage(this.currentPage() + 1);
  }

  // Bulk actions
  openBulkActionModal(action: 'resolve' | 'dismiss' | 'review') {
    this.bulkActionType.set(action);
    this.showBulkActionModal.set(true);
  }

  closeBulkActionModal() {
    this.showBulkActionModal.set(false);
    this.bulkActionType.set(null);
  }

  async executeBulkAction() {
    // TODO: Implement bulk actions when backend supports it
    console.log('Bulk action:', this.bulkActionType(), 'on reports:', Array.from(this.selectedReports()));
    this.closeBulkActionModal();
  }

  // Utility methods
  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  getReportedEntityName(report: Report): string {
    if (report.reported_user_id && typeof report.reported_user_id === 'object') {
      const user = report.reported_user_id as any;
      return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Unknown User';
    }
    
    if (report.reported_business_id && typeof report.reported_business_id === 'object') {
      const business = report.reported_business_id as any;
      return business.name || 'Unknown Business';
    }
    
    return 'Unknown Entity';
  }

  trackByReportId(index: number, report: Report): string {
    return report._id;
  }
}