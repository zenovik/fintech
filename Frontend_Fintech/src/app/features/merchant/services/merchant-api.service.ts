import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MERCHANT_API } from '../constants/merchant.constants';
import {
  ApiResponse,
  CreateMerchantPayload,
  MerchantDetail,
  MerchantDocument,
  MerchantListResponse,
  MerchantStatistics,
  MerchantListItem,
  MerchantTransaction,
} from '../models/merchant.models';
import {
  MerchantBusinessType,
  MerchantKycStatus,
  MerchantRiskLevel,
  MerchantStatus,
} from '../constants/merchant.constants';

@Injectable({ providedIn: 'root' })
export class MerchantApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  list(params: {
    page: number;
    pageSize: number;
    search?: string;
    status?: MerchantStatus;
    kycStatus?: MerchantKycStatus;
    riskLevel?: MerchantRiskLevel;
    businessType?: MerchantBusinessType;
    dateFrom?: string;
    dateTo?: string;
  }): Observable<MerchantListResponse> {
    let httpParams = new HttpParams()
      .set('page', params.page)
      .set('pageSize', params.pageSize);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.kycStatus) httpParams = httpParams.set('kycStatus', params.kycStatus);
    if (params.riskLevel) httpParams = httpParams.set('riskLevel', params.riskLevel);
    if (params.businessType) httpParams = httpParams.set('businessType', params.businessType);
    if (params.dateFrom) httpParams = httpParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) httpParams = httpParams.set('dateTo', params.dateTo);

    return this.http
      .get<ApiResponse<MerchantListResponse>>(`${this.base}${MERCHANT_API.BASE}`, { params: httpParams })
      .pipe(map((r) => r.data));
  }

  search(q: string): Observable<{ items: MerchantListItem[] }> {
    return this.http
      .get<ApiResponse<{ items: MerchantListItem[] }>>(`${this.base}${MERCHANT_API.SEARCH}`, {
        params: { q },
      })
      .pipe(map((r) => r.data));
  }

  getStatistics(): Observable<MerchantStatistics> {
    return this.http
      .get<ApiResponse<MerchantStatistics>>(`${this.base}${MERCHANT_API.STATISTICS}`)
      .pipe(map((r) => r.data));
  }

  getById(id: number): Observable<MerchantDetail> {
    return this.http
      .get<ApiResponse<MerchantDetail>>(`${this.base}${MERCHANT_API.BASE}/${id}`)
      .pipe(map((r) => r.data));
  }

  create(payload: CreateMerchantPayload): Observable<MerchantDetail> {
    return this.http
      .post<ApiResponse<MerchantDetail>>(`${this.base}${MERCHANT_API.BASE}`, payload)
      .pipe(map((r) => r.data));
  }

  update(id: number, payload: Partial<CreateMerchantPayload>): Observable<MerchantDetail> {
    return this.http
      .put<ApiResponse<MerchantDetail>>(`${this.base}${MERCHANT_API.BASE}/${id}`, payload)
      .pipe(map((r) => r.data));
  }

  updateStatus(id: number, status: MerchantStatus, reason?: string): Observable<MerchantDetail> {
    return this.http
      .patch<ApiResponse<MerchantDetail>>(`${this.base}${MERCHANT_API.BASE}/${id}/status`, { status, reason })
      .pipe(map((r) => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.base}${MERCHANT_API.BASE}/${id}`)
      .pipe(map(() => undefined));
  }

  getTransactions(id: number, page: number, pageSize: number): Observable<{ items: MerchantTransaction[]; pagination: { total: number } }> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return this.http
      .get<ApiResponse<{ items: MerchantTransaction[]; pagination: { total: number } }>>(
        `${this.base}${MERCHANT_API.BASE}/${id}/transactions`,
        { params },
      )
      .pipe(map((r) => r.data));
  }

  getDocuments(id: number): Observable<{ items: MerchantDocument[] }> {
    return this.http
      .get<ApiResponse<{ items: MerchantDocument[] }>>(`${this.base}${MERCHANT_API.BASE}/${id}/documents`)
      .pipe(map((r) => r.data));
  }

  uploadDocument(id: number, payload: { documentType: string; fileName: string; fileUrl?: string }): Observable<MerchantDocument> {
    return this.http
      .post<ApiResponse<MerchantDocument>>(`${this.base}${MERCHANT_API.BASE}/${id}/documents`, payload)
      .pipe(map((r) => r.data));
  }

  deleteDocument(merchantId: number, documentId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.base}${MERCHANT_API.BASE}/${merchantId}/documents/${documentId}`)
      .pipe(map(() => undefined));
  }
}
