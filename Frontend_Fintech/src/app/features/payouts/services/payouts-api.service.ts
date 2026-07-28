import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PAYOUTS_API } from '../constants/payouts.constants';
import {
  ApiResponse,
  BankAccountSummary,
  CreateBankAccountPayload,
  CreatePayoutPayload,
  PayoutDetail,
  PayoutListResponse,
} from '../models/payouts.models';

@Injectable({ providedIn: 'root' })
export class PayoutsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  list(params: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    payoutType?: string;
    payoutMethod?: string;
    merchantId?: number;
  }): Observable<PayoutListResponse> {
    let httpParams = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.payoutType) httpParams = httpParams.set('payoutType', params.payoutType);
    if (params.payoutMethod) httpParams = httpParams.set('payoutMethod', params.payoutMethod);
    if (params.merchantId) httpParams = httpParams.set('merchantId', params.merchantId);

    return this.http
      .get<ApiResponse<PayoutListResponse>>(`${this.base}${PAYOUTS_API.BASE}`, { params: httpParams })
      .pipe(map((r) => r.data!));
  }

  getById(id: number): Observable<PayoutDetail> {
    return this.http.get<ApiResponse<PayoutDetail>>(`${this.base}${PAYOUTS_API.BASE}/${id}`).pipe(map((r) => r.data!));
  }

  create(payload: CreatePayoutPayload): Observable<PayoutDetail> {
    return this.http.post<ApiResponse<PayoutDetail>>(`${this.base}${PAYOUTS_API.BASE}`, payload).pipe(map((r) => r.data!));
  }

  approve(id: number): Observable<PayoutDetail> {
    return this.http.post<ApiResponse<PayoutDetail>>(`${this.base}${PAYOUTS_API.BASE}/${id}/approve`, {}).pipe(map((r) => r.data!));
  }

  reject(id: number, reason: string): Observable<PayoutDetail> {
    return this.http.post<ApiResponse<PayoutDetail>>(`${this.base}${PAYOUTS_API.BASE}/${id}/reject`, { reason }).pipe(map((r) => r.data!));
  }

  retry(id: number): Observable<PayoutDetail> {
    return this.http.post<ApiResponse<PayoutDetail>>(`${this.base}${PAYOUTS_API.BASE}/${id}/retry`, {}).pipe(map((r) => r.data!));
  }

  listBankAccounts(merchantId?: number): Observable<BankAccountSummary[]> {
    let params = new HttpParams();
    if (merchantId) params = params.set('merchantId', merchantId);
    return this.http
      .get<ApiResponse<BankAccountSummary[]>>(`${this.base}${PAYOUTS_API.BANK_ACCOUNTS}`, { params })
      .pipe(map((r) => r.data!));
  }

  createBankAccount(payload: CreateBankAccountPayload): Observable<BankAccountSummary> {
    return this.http
      .post<ApiResponse<BankAccountSummary>>(`${this.base}${PAYOUTS_API.BANK_ACCOUNTS}`, payload)
      .pipe(map((r) => r.data!));
  }

  setPrimaryBankAccount(id: number): Observable<BankAccountSummary> {
    return this.http
      .patch<ApiResponse<BankAccountSummary>>(`${this.base}${PAYOUTS_API.BANK_ACCOUNTS}/${id}`, { isPrimary: true })
      .pipe(map((r) => r.data!));
  }
}
