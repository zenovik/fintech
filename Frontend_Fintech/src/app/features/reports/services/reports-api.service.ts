import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { REPORTS_API } from '../constants/reports.constants';
import {
  ApiResponse,
  ExecutionLog,
  ReportCategory,
  ReportItem,
  ReportListResponse,
  ReportTemplate,
  ScheduledReport,
} from '../models/reports.models';

@Injectable({ providedIn: 'root' })
export class ReportsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  list(params: { page: number; pageSize: number; search?: string; status?: string; categoryId?: number }): Observable<ReportListResponse> {
    let p = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.search) p = p.set('search', params.search);
    if (params.status) p = p.set('status', params.status);
    if (params.categoryId) p = p.set('categoryId', params.categoryId);
    return this.http.get<ApiResponse<ReportListResponse>>(`${this.base}${REPORTS_API.BASE}`, { params: p }).pipe(map((r) => r.data));
  }

  getById(id: number): Observable<ReportItem> {
    return this.http.get<ApiResponse<ReportItem>>(`${this.base}${REPORTS_API.BASE}/${id}`).pipe(map((r) => r.data));
  }

  create(body: Partial<ReportItem>): Observable<ReportItem> {
    return this.http.post<ApiResponse<ReportItem>>(`${this.base}${REPORTS_API.BASE}`, body).pipe(map((r) => r.data));
  }

  update(id: number, body: Partial<ReportItem>): Observable<ReportItem> {
    return this.http.put<ApiResponse<ReportItem>>(`${this.base}${REPORTS_API.BASE}/${id}`, body).pipe(map((r) => r.data));
  }

  delete(id: number): Observable<{ success: boolean }> {
    return this.http.delete<ApiResponse<{ success: boolean }>>(`${this.base}${REPORTS_API.BASE}/${id}`).pipe(map((r) => r.data));
  }

  getTemplates(): Observable<ReportTemplate[]> {
    return this.http.get<ApiResponse<ReportTemplate[]>>(`${this.base}${REPORTS_API.TEMPLATES}`).pipe(map((r) => r.data));
  }

  getCategories(): Observable<ReportCategory[]> {
    return this.http.get<ApiResponse<ReportCategory[]>>(`${this.base}${REPORTS_API.CATEGORIES}`).pipe(map((r) => r.data));
  }

  run(body: { reportId?: number; templateId?: number; filters?: Record<string, unknown> }): Observable<unknown> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}${REPORTS_API.RUN}`, body).pipe(map((r) => r.data));
  }

  export(body: { reportId?: number; format: string; filters?: Record<string, unknown> }): Observable<{ exportId: string; message: string; downloadUrl?: string }> {
    return this.http.post<ApiResponse<{ exportId: string; message: string; downloadUrl?: string }>>(`${this.base}${REPORTS_API.EXPORT}`, body).pipe(map((r) => r.data));
  }

  getHistory(params: { page: number; pageSize: number }): Observable<{ items: ExecutionLog[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }> {
    const p = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    return this.http.get<ApiResponse<{ items: ExecutionLog[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>>(`${this.base}${REPORTS_API.HISTORY}`, { params: p }).pipe(map((r) => r.data));
  }

  getScheduled(): Observable<ScheduledReport[]> {
    return this.http.get<ApiResponse<ScheduledReport[]>>(`${this.base}${REPORTS_API.SCHEDULED}`).pipe(map((r) => r.data));
  }

  createScheduled(body: { reportId: number; name: string; cronExpression: string; format: string; recipients?: string[]; isActive?: boolean }): Observable<ScheduledReport> {
    return this.http.post<ApiResponse<ScheduledReport>>(`${this.base}${REPORTS_API.SCHEDULED}`, body).pipe(map((r) => r.data));
  }

  updateScheduled(id: number, body: Partial<ScheduledReport>): Observable<ScheduledReport> {
    return this.http.put<ApiResponse<ScheduledReport>>(`${this.base}${REPORTS_API.SCHEDULED}/${id}`, body).pipe(map((r) => r.data));
  }

  deleteScheduled(id: number): Observable<{ success: boolean }> {
    return this.http.delete<ApiResponse<{ success: boolean }>>(`${this.base}${REPORTS_API.SCHEDULED}/${id}`).pipe(map((r) => r.data));
  }

  getCenterCatalog(): Observable<{ code: string; name: string; category: string; description: string; sourceModule: string; exportFormats: string[] }[]> {
    return this.http.get<ApiResponse<{ code: string; name: string; category: string; description: string; sourceModule: string; exportFormats: string[] }[]>>(`${this.base}${REPORTS_API.CENTER_CATALOG}`).pipe(map((r) => r.data!));
  }

  getCenterSavedFilters(reportType?: string): Observable<{ id: number; reportType: string; filterName: string; filters: Record<string, unknown>; isDefault: boolean }[]> {
    let params = new HttpParams();
    if (reportType) params = params.set('reportType', reportType);
    return this.http.get<ApiResponse<{ id: number; reportType: string; filterName: string; filters: Record<string, unknown>; isDefault: boolean }[]>>(`${this.base}${REPORTS_API.CENTER_SAVED_FILTERS}`, { params }).pipe(map((r) => r.data!));
  }

  saveCenterFilter(body: { reportType: string; filterName: string; filters: Record<string, unknown>; isDefault?: boolean; id?: number }): Observable<unknown> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}${REPORTS_API.CENTER_SAVED_FILTERS}`, body).pipe(map((r) => r.data));
  }

  deleteCenterFilter(id: number): Observable<unknown> {
    return this.http.delete<ApiResponse<unknown>>(`${this.base}${REPORTS_API.CENTER_SAVED_FILTERS}/${id}`).pipe(map((r) => r.data));
  }

  generateCenterReport(reportType: string, filters?: Record<string, unknown>): Observable<{ reportType: string; rowCount: number; headers: string[]; rows: Record<string, unknown>[] }> {
    return this.http.post<ApiResponse<{ reportType: string; rowCount: number; headers: string[]; rows: Record<string, unknown>[] }>>(`${this.base}${REPORTS_API.CENTER_GENERATE}`, { reportType, filters }).pipe(map((r) => r.data!));
  }

  exportCenterReport(reportType: string, format: string, filters?: Record<string, unknown>): Observable<{ reportType: string; format: string; rowCount: number; downloadUrl: string }> {
    return this.http.post<ApiResponse<{ reportType: string; format: string; rowCount: number; downloadUrl: string }>>(`${this.base}${REPORTS_API.CENTER_EXPORT}`, { reportType, format, filters }).pipe(map((r) => r.data!));
  }

  getCenterExportHistory(): Observable<{ id: number; reportType: string; format: string; rowCount: number; downloadUrl: string | null; status: string; createdAt: string }[]> {
    return this.http.get<ApiResponse<{ id: number; reportType: string; format: string; rowCount: number; downloadUrl: string | null; status: string; createdAt: string }[]>>(`${this.base}${REPORTS_API.CENTER_EXPORT_HISTORY}`).pipe(map((r) => r.data!));
  }
}
