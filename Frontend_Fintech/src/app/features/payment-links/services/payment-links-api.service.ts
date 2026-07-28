import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PAYMENT_LINKS_API } from '../constants/payment-links.constants';
import {
  ApiResponse,
  CreatePaymentLinkPayload,
  PaymentLinkDetail,
  PaymentLinkListResponse,
  PaymentLinkStats,
  PublicPayPayload,
  PublicPayResponse,
  PublicPaymentLink,
  QrCodeResponse,
  UpdatePaymentLinkPayload,
} from '../models/payment-links.models';

@Injectable({ providedIn: 'root' })
export class PaymentLinksApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  list(params: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    merchantId?: number;
    customerId?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Observable<PaymentLinkListResponse> {
    let httpParams = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.merchantId) httpParams = httpParams.set('merchantId', params.merchantId);
    if (params.customerId) httpParams = httpParams.set('customerId', params.customerId);
    if (params.dateFrom) httpParams = httpParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) httpParams = httpParams.set('dateTo', params.dateTo);

    return this.http
      .get<ApiResponse<PaymentLinkListResponse>>(`${this.base}${PAYMENT_LINKS_API.BASE}`, { params: httpParams })
      .pipe(map((r) => r.data!));
  }

  statistics(): Observable<PaymentLinkStats> {
    return this.http
      .get<ApiResponse<PaymentLinkStats>>(`${this.base}${PAYMENT_LINKS_API.STATISTICS}`)
      .pipe(map((r) => r.data!));
  }

  getById(id: number): Observable<PaymentLinkDetail> {
    return this.http.get<ApiResponse<PaymentLinkDetail>>(`${this.base}${PAYMENT_LINKS_API.BASE}/${id}`).pipe(map((r) => r.data!));
  }

  create(payload: CreatePaymentLinkPayload): Observable<PaymentLinkDetail> {
    return this.http.post<ApiResponse<PaymentLinkDetail>>(`${this.base}${PAYMENT_LINKS_API.BASE}`, payload).pipe(map((r) => r.data!));
  }

  update(id: number, payload: UpdatePaymentLinkPayload): Observable<PaymentLinkDetail> {
    return this.http.put<ApiResponse<PaymentLinkDetail>>(`${this.base}${PAYMENT_LINKS_API.BASE}/${id}`, payload).pipe(map((r) => r.data!));
  }

  enable(id: number): Observable<PaymentLinkDetail> {
    return this.http.post<ApiResponse<PaymentLinkDetail>>(`${this.base}${PAYMENT_LINKS_API.BASE}/${id}/enable`, {}).pipe(map((r) => r.data!));
  }

  disable(id: number): Observable<PaymentLinkDetail> {
    return this.http.post<ApiResponse<PaymentLinkDetail>>(`${this.base}${PAYMENT_LINKS_API.BASE}/${id}/disable`, {}).pipe(map((r) => r.data!));
  }

  expire(id: number): Observable<PaymentLinkDetail> {
    return this.http.post<ApiResponse<PaymentLinkDetail>>(`${this.base}${PAYMENT_LINKS_API.BASE}/${id}/expire`, {}).pipe(map((r) => r.data!));
  }

  regenerateToken(id: number): Observable<PaymentLinkDetail> {
    return this.http
      .post<ApiResponse<PaymentLinkDetail>>(`${this.base}${PAYMENT_LINKS_API.BASE}/${id}/regenerate-token`, {})
      .pipe(map((r) => r.data!));
  }

  getQrCode(id: number): Observable<QrCodeResponse> {
    return this.http.get<ApiResponse<QrCodeResponse>>(`${this.base}${PAYMENT_LINKS_API.BASE}/${id}/qr`).pipe(map((r) => r.data!));
  }

  getPublicLink(token: string): Observable<PublicPaymentLink> {
    return this.http
      .get<ApiResponse<PublicPaymentLink>>(`${this.base}${PAYMENT_LINKS_API.PUBLIC}/${token}`)
      .pipe(map((r) => r.data!));
  }

  pay(token: string, payload: PublicPayPayload): Observable<PublicPayResponse> {
    return this.http
      .post<ApiResponse<PublicPayResponse>>(`${this.base}${PAYMENT_LINKS_API.PUBLIC}/${token}/pay`, payload)
      .pipe(map((r) => r.data!));
  }
}
