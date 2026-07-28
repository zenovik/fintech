import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { QR_PAYMENTS_API } from '../constants/qr-payments.constants';
import {
  ApiResponse,
  CreateQrPayload,
  PublicQrCode,
  PublicQrPayPayload,
  PublicQrPayResponse,
  QrCodeDetail,
  QrDownloadResponse,
  QrListResponse,
  QrStats,
  UpdateQrPayload,
} from '../models/qr-payments.models';

@Injectable({ providedIn: 'root' })
export class QrPaymentsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  list(params: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    qrType?: string;
    merchantId?: number;
    customerId?: number;
  }): Observable<QrListResponse> {
    let httpParams = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.qrType) httpParams = httpParams.set('qrType', params.qrType);
    if (params.merchantId) httpParams = httpParams.set('merchantId', params.merchantId);
    if (params.customerId) httpParams = httpParams.set('customerId', params.customerId);

    return this.http
      .get<ApiResponse<QrListResponse>>(`${this.base}${QR_PAYMENTS_API.BASE}`, { params: httpParams })
      .pipe(map((r) => r.data!));
  }

  statistics(): Observable<QrStats> {
    return this.http
      .get<ApiResponse<QrStats>>(`${this.base}${QR_PAYMENTS_API.STATISTICS}`)
      .pipe(map((r) => r.data!));
  }

  getById(id: number): Observable<QrCodeDetail> {
    return this.http.get<ApiResponse<QrCodeDetail>>(`${this.base}${QR_PAYMENTS_API.BASE}/${id}`).pipe(map((r) => r.data!));
  }

  create(payload: CreateQrPayload): Observable<QrCodeDetail> {
    return this.http.post<ApiResponse<QrCodeDetail>>(`${this.base}${QR_PAYMENTS_API.BASE}`, payload).pipe(map((r) => r.data!));
  }

  update(id: number, payload: UpdateQrPayload): Observable<QrCodeDetail> {
    return this.http.put<ApiResponse<QrCodeDetail>>(`${this.base}${QR_PAYMENTS_API.BASE}/${id}`, payload).pipe(map((r) => r.data!));
  }

  enable(id: number): Observable<QrCodeDetail> {
    return this.http.post<ApiResponse<QrCodeDetail>>(`${this.base}${QR_PAYMENTS_API.BASE}/${id}/enable`, {}).pipe(map((r) => r.data!));
  }

  disable(id: number): Observable<QrCodeDetail> {
    return this.http.post<ApiResponse<QrCodeDetail>>(`${this.base}${QR_PAYMENTS_API.BASE}/${id}/disable`, {}).pipe(map((r) => r.data!));
  }

  regenerate(id: number): Observable<QrCodeDetail> {
    return this.http.post<ApiResponse<QrCodeDetail>>(`${this.base}${QR_PAYMENTS_API.BASE}/${id}/regenerate`, {}).pipe(map((r) => r.data!));
  }

  download(id: number): Observable<QrDownloadResponse> {
    return this.http
      .get<ApiResponse<QrDownloadResponse>>(`${this.base}${QR_PAYMENTS_API.BASE}/${id}/download`)
      .pipe(map((r) => r.data!));
  }

  getPublicQr(token: string): Observable<PublicQrCode> {
    return this.http
      .get<ApiResponse<PublicQrCode>>(`${this.base}${QR_PAYMENTS_API.PUBLIC}/${token}`)
      .pipe(map((r) => r.data!));
  }

  pay(token: string, payload: PublicQrPayPayload): Observable<PublicQrPayResponse> {
    return this.http
      .post<ApiResponse<PublicQrPayResponse>>(`${this.base}${QR_PAYMENTS_API.PUBLIC}/${token}/pay`, payload)
      .pipe(map((r) => r.data!));
  }
}
