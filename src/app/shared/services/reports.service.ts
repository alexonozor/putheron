import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { ConfigService } from './config.service';

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

export interface CreateReportDto {
  reported_user_id?: string;
  reported_business_id?: string;
  reported_project_id?: string;
  reported_message_id?: string;
  report_type: ReportType;
  reason: ReportReason;
  custom_reason?: string;
  description?: string;
  evidence_urls?: string[];
  is_anonymous?: boolean;
}

export interface Report {
  _id: string;
  reporter_id: string;
  reported_user_id?: any;
  reported_business_id?: any;
  reported_project_id?: string;
  reported_message_id?: string;
  report_type: ReportType;
  reason: ReportReason;
  custom_reason?: string;
  description?: string;
  status: string;
  evidence_urls?: string[];
  reviewed_by?: any;
  reviewed_at?: Date;
  admin_notes?: string;
  resolution_action?: string;
  is_anonymous: boolean;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  /**
   * Submit a new report
   */
  submitReport(reportData: CreateReportDto): Observable<ApiResponse<Report>> {
    return this.http.post<ApiResponse<Report>>(`${this.config.apiBaseUrl}/reports`, reportData);
  }

  /**
   * Submit a report (async version)
   */
  async submitReportAsync(reportData: CreateReportDto): Promise<Report> {
    const response = await firstValueFrom(this.submitReport(reportData));
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to submit report');
    }
    return response.data;
  }

  /**
   * Report a user
   */
  reportUser(userId: string, reason: ReportReason, customReason?: string, description?: string, isAnonymous = false): Observable<ApiResponse<Report>> {
    const reportData: CreateReportDto = {
      reported_user_id: userId,
      report_type: ReportType.USER,
      reason,
      custom_reason: customReason,
      description,
      is_anonymous: isAnonymous
    };
    return this.submitReport(reportData);
  }

  /**
   * Report a user (async version)
   */
  async reportUserAsync(userId: string, reason: ReportReason, customReason?: string, description?: string, isAnonymous = false): Promise<Report> {
    const response = await firstValueFrom(this.reportUser(userId, reason, customReason, description, isAnonymous));
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to report user');
    }
    return response.data;
  }

  /**
   * Report a business
   */
  reportBusiness(businessId: string, reason: ReportReason, customReason?: string, description?: string, isAnonymous = false): Observable<ApiResponse<Report>> {
    const reportData: CreateReportDto = {
      reported_business_id: businessId,
      report_type: ReportType.BUSINESS,
      reason,
      custom_reason: customReason,
      description,
      is_anonymous: isAnonymous
    };
    return this.submitReport(reportData);
  }

  /**
   * Report a business (async version)
   */
  async reportBusinessAsync(businessId: string, reason: ReportReason, customReason?: string, description?: string, isAnonymous = false): Promise<Report> {
    const response = await firstValueFrom(this.reportBusiness(businessId, reason, customReason, description, isAnonymous));
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to report business');
    }
    return response.data;
  }

  /**
   * Get user's submitted reports
   */
  getMyReports(page = 1, limit = 20): Observable<ApiResponse<{ reports: Report[]; total: number; page: number; totalPages: number }>> {
    return this.http.get<ApiResponse<any>>(`${this.config.apiBaseUrl}/reports/my-reports`, {
      params: { page: page.toString(), limit: limit.toString() }
    });
  }

  /**
   * Get user's submitted reports (async version)
   */
  async getMyReportsAsync(page = 1, limit = 20): Promise<{ reports: Report[]; total: number; page: number; totalPages: number }> {
    const response = await firstValueFrom(this.getMyReports(page, limit));
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get reports');
    }
    return response.data;
  }

  /**
   * Get a specific report by ID
   */
  getReport(reportId: string): Observable<ApiResponse<Report>> {
    return this.http.get<ApiResponse<Report>>(`${this.config.apiBaseUrl}/reports/${reportId}`);
  }

  /**
   * Get a specific report by ID (async version)
   */
  async getReportAsync(reportId: string): Promise<Report> {
    const response = await firstValueFrom(this.getReport(reportId));
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get report');
    }
    return response.data;
  }

  /**
   * Admin: Update report status
   */
  updateReportStatus(reportId: string, statusData: {
    status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
    admin_notes?: string;
    resolution_action?: string;
  }): Observable<ApiResponse<Report>> {
    return this.http.patch<ApiResponse<Report>>(`${this.config.apiBaseUrl}/reports/${reportId}/status`, statusData);
  }

  /**
   * Admin: Update report status (async version)
   */
  async updateReportStatusAsync(reportId: string, statusData: {
    status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
    admin_notes?: string;
    resolution_action?: string;
  }): Promise<Report> {
    const response = await firstValueFrom(this.updateReportStatus(reportId, statusData));
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update report status');
    }
    return response.data;
  }

  // Helper methods for common report scenarios

  /**
   * Check if we should show report button (user is authenticated and not reporting themselves)
   */
  canReport(targetUserId: string, currentUserId: string | null): boolean {
    return currentUserId !== null && targetUserId !== currentUserId;
  }

  /**
   * Get display text for report reason
   */
  getReasonDisplayText(reason: ReportReason): string {
    const reasonLabels: Record<ReportReason, string> = {
      [ReportReason.HARASSMENT]: 'Harassment or bullying',
      [ReportReason.INAPPROPRIATE_CONTENT]: 'Inappropriate content',
      [ReportReason.SPAM]: 'Spam',
      [ReportReason.FRAUD]: 'Fraud or scam',
      [ReportReason.FAKE_PROFILE]: 'Fake profile',
      [ReportReason.OFFENSIVE_LANGUAGE]: 'Offensive language',
      [ReportReason.DISCRIMINATION]: 'Discrimination',
      [ReportReason.VIOLATION_OF_TERMS]: 'Violation of terms',
      [ReportReason.IMPERSONATION]: 'Impersonation',
      [ReportReason.INTELLECTUAL_PROPERTY]: 'Intellectual property violation',
      [ReportReason.SAFETY_CONCERNS]: 'Safety concerns',
      [ReportReason.OTHER]: 'Other'
    };
    return reasonLabels[reason] || reason;
  }

  /**
   * Get display text for report status
   */
  getStatusDisplayText(status: string): string {
    const statusLabels: Record<string, string> = {
      'pending': 'Pending Review',
      'under_review': 'Under Review',
      'resolved': 'Resolved',
      'dismissed': 'Dismissed'
    };
    return statusLabels[status] || status;
  }

  /**
   * Get status color class
   */
  getStatusColorClass(status: string): string {
    const statusColors: Record<string, string> = {
      'pending': 'text-yellow-600 bg-yellow-100',
      'under_review': 'text-blue-600 bg-blue-100',
      'resolved': 'text-green-600 bg-green-100',
      'dismissed': 'text-gray-600 bg-gray-100'
    };
    return statusColors[status] || 'text-gray-600 bg-gray-100';
  }
}