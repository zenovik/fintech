import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AUDIT_API } from '../constants/audit.constants';
import {
  ApiLogItem,
  ApiResponse,
  AuditAction,
  AuditCategory,
  AuditExportResponse,
  AuditListResponse,
  AuditLogDetail,
  PaginatedResponse,
  WebhookLogItem,
} from '../models/audit.models';

@Injectable({ providedIn: 'root' })
export class AuditApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  list(params: {
    page: number;
    pageSize: number;
    search?: string;
    module?: string;
    categoryCode?: string;
    actionCode?: string;
    userId?: number;
    entityType?: string;
    entityId?: string;
    riskLevel?: string;
    dateFrom?: string;
    dateTo?: string;
    dateRange?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Observable<AuditListResponse> {
    let httpParams = new HttpParams()
      .set('page', params.page)
      .set('pageSize', params.pageSize);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.module) httpParams = httpParams.set('module', params.module);
    if (params.categoryCode) httpParams = httpParams.set('categoryCode', params.categoryCode);
    if (params.actionCode) httpParams = httpParams.set('actionCode', params.actionCode);
    if (params.userId) httpParams = httpParams.set('userId', params.userId);
    if (params.entityType) httpParams = httpParams.set('entityType', params.entityType);
    if (params.entityId) httpParams = httpParams.set('entityId', params.entityId);
    if (params.riskLevel) httpParams = httpParams.set('riskLevel', params.riskLevel);
    if (params.dateFrom) httpParams = httpParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) httpParams = httpParams.set('dateTo', params.dateTo);
    if (params.dateRange) httpParams = httpParams.set('dateRange', params.dateRange);
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);

    return this.http
      .get<ApiResponse<AuditListResponse>>(`${this.base}${AUDIT_API.BASE}`, { params: httpParams })
      .pipe(map((r) => r.data!));
  }

  getById(id: number): Observable<AuditLogDetail> {
    return this.http
      .get<ApiResponse<AuditLogDetail>>(`${this.base}${AUDIT_API.BASE}/${id}`)
      .pipe(map((r) => r.data!));
  }

  getCategories(): Observable<AuditCategory[]> {
    return this.http
      .get<ApiResponse<AuditCategory[]>>(`${this.base}${AUDIT_API.CATEGORIES}`)
      .pipe(map((r) => r.data!));
  }

  getActions(categoryCode?: string): Observable<AuditAction[]> {
    let params = new HttpParams();
    if (categoryCode) params = params.set('categoryCode', categoryCode);
    return this.http
      .get<ApiResponse<AuditAction[]>>(`${this.base}${AUDIT_API.ACTIONS}`, { params })
      .pipe(map((r) => r.data!));
  }

  export(params: Record<string, string | number | undefined>): Observable<AuditExportResponse> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') httpParams = httpParams.set(key, String(value));
    }
    return this.http
      .get<ApiResponse<AuditExportResponse>>(`${this.base}${AUDIT_API.EXPORT}`, { params: httpParams })
      .pipe(map((r) => r.data!));
  }

  listApiLogs(params: {
    page: number;
    pageSize: number;
    search?: string;
    method?: string;
    statusCode?: number;
    userId?: number;
    dateFrom?: string;
    dateTo?: string;
    dateRange?: string;
  }): Observable<PaginatedResponse<ApiLogItem>> {
    let httpParams = new HttpParams()
      .set('page', params.page)
      .set('pageSize', params.pageSize);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.method) httpParams = httpParams.set('method', params.method);
    if (params.statusCode) httpParams = httpParams.set('statusCode', params.statusCode);
    if (params.userId) httpParams = httpParams.set('userId', params.userId);
    if (params.dateFrom) httpParams = httpParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) httpParams = httpParams.set('dateTo', params.dateTo);
    if (params.dateRange) httpParams = httpParams.set('dateRange', params.dateRange);

    return this.http
      .get<ApiResponse<PaginatedResponse<ApiLogItem>>>(`${this.base}${AUDIT_API.API_LOGS}`, { params: httpParams })
      .pipe(map((r) => r.data!));
  }

  listWebhookLogs(params: {
    page: number;
    pageSize: number;
    search?: string;
    eventType?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    dateRange?: string;
  }): Observable<PaginatedResponse<WebhookLogItem>> {
    let httpParams = new HttpParams()
      .set('page', params.page)
      .set('pageSize', params.pageSize);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.eventType) httpParams = httpParams.set('eventType', params.eventType);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.dateFrom) httpParams = httpParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) httpParams = httpParams.set('dateTo', params.dateTo);
    if (params.dateRange) httpParams = httpParams.set('dateRange', params.dateRange);

    return this.http
      .get<ApiResponse<PaginatedResponse<WebhookLogItem>>>(`${this.base}${AUDIT_API.WEBHOOK_LOGS}`, { params: httpParams })
      .pipe(map((r) => r.data!));
  }
}
