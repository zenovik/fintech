import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { REFUNDS_API } from '../constants/refunds.constants';
import { ApiResponse, CreateRefundPayload, RefundDetail, RefundHistoryEntry, RefundListResponse } from '../models/refunds.models';

@Injectable({ providedIn: 'root' })
export class RefundsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  list(params: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    refundType?: string;
    merchantId?: number;
    transactionId?: number;
  }): Observable<RefundListResponse> {
    let httpParams = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.refundType) httpParams = httpParams.set('refundType', params.refundType);
    if (params.merchantId) httpParams = httpParams.set('merchantId', params.merchantId);
    if (params.transactionId) httpParams = httpParams.set('transactionId', params.transactionId);

    return this.http
      .get<ApiResponse<RefundListResponse>>(`${this.base}${REFUNDS_API.BASE}`, { params: httpParams })
      .pipe(map((r) => r.data!));
  }

  getById(id: number): Observable<RefundDetail> {
    return this.http.get<ApiResponse<RefundDetail>>(`${this.base}${REFUNDS_API.BASE}/${id}`).pipe(map((r) => r.data!));
  }

  create(payload: CreateRefundPayload): Observable<RefundDetail> {
    return this.http.post<ApiResponse<RefundDetail>>(`${this.base}${REFUNDS_API.BASE}`, payload).pipe(map((r) => r.data!));
  }

  approve(id: number): Observable<RefundDetail> {
    return this.http.post<ApiResponse<RefundDetail>>(`${this.base}${REFUNDS_API.BASE}/${id}/approve`, {}).pipe(map((r) => r.data!));
  }

  reject(id: number, reason: string): Observable<RefundDetail> {
    return this.http
      .post<ApiResponse<RefundDetail>>(`${this.base}${REFUNDS_API.BASE}/${id}/reject`, { reason })
      .pipe(map((r) => r.data!));
  }

  getHistory(id: number): Observable<RefundHistoryEntry[]> {
    return this.http
      .get<ApiResponse<RefundHistoryEntry[]>>(`${this.base}${REFUNDS_API.BASE}/${id}/history`)
      .pipe(map((r) => r.data!));
  }
}
