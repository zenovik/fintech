import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SETTLEMENT_API } from '../constants/settlement.constants';
import { ApiResponse, SettlementBatch, SettlementDetail, SettlementListResponse, SettlementStatistics } from '../models/settlement.models';
import { SettlementStatus } from '../constants/settlement.constants';

@Injectable({ providedIn: 'root' })
export class SettlementApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  list(params: {
    page: number; pageSize: number; search?: string; status?: SettlementStatus | string;
    merchantId?: number; dateFrom?: string; dateTo?: string; batchId?: number;
  }): Observable<SettlementListResponse> {
    let p = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.search) p = p.set('search', params.search);
    if (params.status) p = p.set('status', params.status);
    if (params.merchantId) p = p.set('merchantId', params.merchantId);
    if (params.dateFrom) p = p.set('dateFrom', params.dateFrom);
    if (params.dateTo) p = p.set('dateTo', params.dateTo);
    if (params.batchId) p = p.set('batchId', params.batchId);
    return this.http.get<ApiResponse<SettlementListResponse>>(`${this.base}${SETTLEMENT_API.BASE}`, { params: p }).pipe(map((r) => r.data));
  }

  getStatistics(params?: { merchantId?: number }): Observable<SettlementStatistics> {
    let p = new HttpParams();
    if (params?.merchantId) p = p.set('merchantId', params.merchantId);
    return this.http.get<ApiResponse<SettlementStatistics>>(`${this.base}${SETTLEMENT_API.STATISTICS}`, { params: p }).pipe(map((r) => r.data));
  }

  getById(id: number): Observable<SettlementDetail> {
    return this.http.get<ApiResponse<SettlementDetail>>(`${this.base}${SETTLEMENT_API.BASE}/${id}`).pipe(map((r) => r.data));
  }

  getBatches(): Observable<{ items: SettlementBatch[] }> {
    return this.http.get<ApiResponse<{ items: SettlementBatch[] }>>(`${this.base}${SETTLEMENT_API.BATCHES}`).pipe(map((r) => r.data));
  }

  getBatchById(id: number): Observable<SettlementBatch & { settlements: SettlementListResponse['items'] }> {
    return this.http.get<ApiResponse<SettlementBatch & { settlements: SettlementListResponse['items'] }>>(`${this.base}${SETTLEMENT_API.BATCHES}/${id}`).pipe(map((r) => r.data));
  }

  updateStatus(id: number, status: string, reason?: string): Observable<SettlementDetail> {
    return this.http.patch<ApiResponse<SettlementDetail>>(`${this.base}${SETTLEMENT_API.BASE}/${id}/status`, { status, reason }).pipe(map((r) => r.data));
  }

  reversal(id: number, amount: number, reason: string): Observable<unknown> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}${SETTLEMENT_API.BASE}/${id}/reversal`, { amount, reason }).pipe(map((r) => r.data));
  }

  export(params: { format?: string; status?: string; merchantId?: number }): Observable<{ jobId: string; message: string; downloadUrl?: string }> {
    let p = new HttpParams();
    if (params.format) p = p.set('format', params.format);
    if (params.status) p = p.set('status', params.status);
    if (params.merchantId) p = p.set('merchantId', params.merchantId);
    return this.http.get<ApiResponse<{ jobId: string; message: string; downloadUrl?: string }>>(`${this.base}${SETTLEMENT_API.EXPORT}`, { params: p }).pipe(map((r) => r.data));
  }
}
