import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TRANSACTION_API } from '../constants/transaction.constants';
import {
  ApiResponse,
  ExportResult,
  TransactionDetail,
  TransactionDispute,
  TransactionListResponse,
  TransactionStatistics,
} from '../models/transaction.models';
import { TransactionPeriod, TransactionStatus } from '../constants/transaction.constants';

@Injectable({ providedIn: 'root' })
export class TransactionApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  list(params: {
    page: number;
    pageSize: number;
    search?: string;
    status?: TransactionStatus | string;
    merchantId?: number;
    dateFrom?: string;
    dateTo?: string;
    minAmount?: number;
    maxAmount?: number;
    isHighValue?: boolean;
    period?: TransactionPeriod;
  }): Observable<TransactionListResponse> {
    let httpParams = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.merchantId) httpParams = httpParams.set('merchantId', params.merchantId);
    if (params.dateFrom) httpParams = httpParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) httpParams = httpParams.set('dateTo', params.dateTo);
    if (params.minAmount !== undefined) httpParams = httpParams.set('minAmount', params.minAmount);
    if (params.maxAmount !== undefined) httpParams = httpParams.set('maxAmount', params.maxAmount);
    if (params.isHighValue) httpParams = httpParams.set('isHighValue', 'true');
    if (params.period) httpParams = httpParams.set('period', params.period);

    return this.http
      .get<ApiResponse<TransactionListResponse>>(`${this.base}${TRANSACTION_API.BASE}`, { params: httpParams })
      .pipe(map((r) => r.data));
  }

  getStatistics(params?: { period?: TransactionPeriod; merchantId?: number }): Observable<TransactionStatistics> {
    let httpParams = new HttpParams();
    if (params?.period) httpParams = httpParams.set('period', params.period);
    if (params?.merchantId) httpParams = httpParams.set('merchantId', params.merchantId);
    return this.http
      .get<ApiResponse<TransactionStatistics>>(`${this.base}${TRANSACTION_API.STATISTICS}`, { params: httpParams })
      .pipe(map((r) => r.data));
  }

  getById(id: number): Observable<TransactionDetail> {
    return this.http
      .get<ApiResponse<TransactionDetail>>(`${this.base}${TRANSACTION_API.BASE}/${id}`)
      .pipe(map((r) => r.data));
  }

  updateStatus(id: number, statusCode: string, reason?: string): Observable<TransactionDetail> {
    return this.http
      .patch<ApiResponse<TransactionDetail>>(`${this.base}${TRANSACTION_API.BASE}/${id}/status`, { statusCode, reason })
      .pipe(map((r) => r.data));
  }

  refund(id: number, amount: number, reason?: string): Observable<unknown> {
    return this.http
      .post<ApiResponse<unknown>>(`${this.base}${TRANSACTION_API.BASE}/${id}/refund`, { amount, reason })
      .pipe(map((r) => r.data));
  }

  export(params: { format?: string; status?: string; merchantId?: number; dateFrom?: string; dateTo?: string; isHighValue?: boolean }): Observable<ExportResult> {
    let httpParams = new HttpParams();
    if (params.format) httpParams = httpParams.set('format', params.format);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.merchantId) httpParams = httpParams.set('merchantId', params.merchantId);
    if (params.dateFrom) httpParams = httpParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) httpParams = httpParams.set('dateTo', params.dateTo);
    if (params.isHighValue) httpParams = httpParams.set('isHighValue', 'true');
    return this.http
      .get<ApiResponse<ExportResult>>(`${this.base}${TRANSACTION_API.EXPORT}`, { params: httpParams })
      .pipe(map((r) => r.data));
  }

  getDisputes(): Observable<{ items: TransactionDispute[] }> {
    return this.http
      .get<ApiResponse<{ items: TransactionDispute[] }>>(`${this.base}${TRANSACTION_API.DISPUTES}`)
      .pipe(map((r) => r.data));
  }

  createDispute(transactionId: number, reason: string, amount?: number): Observable<TransactionDispute> {
    return this.http
      .post<ApiResponse<TransactionDispute>>(`${this.base}${TRANSACTION_API.DISPUTES}`, { transactionId, reason, amount })
      .pipe(map((r) => r.data));
  }
}
