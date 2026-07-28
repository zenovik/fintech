import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CHARGEBACKS_API } from '../constants/chargebacks.constants';
import {
  AddEvidencePayload,
  ApiResponse,
  ChargebackDetail,
  ChargebackListResponse,
  CreateChargebackPayload,
  RepresentmentPayload,
  ResolveChargebackPayload,
} from '../models/chargebacks.models';

@Injectable({ providedIn: 'root' })
export class ChargebacksApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  list(params: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    reasonCode?: string;
    cardNetwork?: string;
    merchantId?: number;
    transactionId?: number;
  }): Observable<ChargebackListResponse> {
    let httpParams = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.reasonCode) httpParams = httpParams.set('reasonCode', params.reasonCode);
    if (params.cardNetwork) httpParams = httpParams.set('cardNetwork', params.cardNetwork);
    if (params.merchantId) httpParams = httpParams.set('merchantId', params.merchantId);
    if (params.transactionId) httpParams = httpParams.set('transactionId', params.transactionId);

    return this.http
      .get<ApiResponse<ChargebackListResponse>>(`${this.base}${CHARGEBACKS_API.BASE}`, { params: httpParams })
      .pipe(map((r) => r.data!));
  }

  getById(id: number): Observable<ChargebackDetail> {
    return this.http.get<ApiResponse<ChargebackDetail>>(`${this.base}${CHARGEBACKS_API.BASE}/${id}`).pipe(map((r) => r.data!));
  }

  create(payload: CreateChargebackPayload): Observable<ChargebackDetail> {
    return this.http.post<ApiResponse<ChargebackDetail>>(`${this.base}${CHARGEBACKS_API.BASE}`, payload).pipe(map((r) => r.data!));
  }

  addEvidence(id: number, payload: AddEvidencePayload): Observable<ChargebackDetail> {
    return this.http
      .post<ApiResponse<ChargebackDetail>>(`${this.base}${CHARGEBACKS_API.BASE}/${id}/evidence`, payload)
      .pipe(map((r) => r.data!));
  }

  submitRepresentment(id: number, payload: RepresentmentPayload): Observable<ChargebackDetail> {
    return this.http
      .post<ApiResponse<ChargebackDetail>>(`${this.base}${CHARGEBACKS_API.BASE}/${id}/representment`, payload)
      .pipe(map((r) => r.data!));
  }

  resolve(id: number, payload: ResolveChargebackPayload): Observable<ChargebackDetail> {
    return this.http
      .post<ApiResponse<ChargebackDetail>>(`${this.base}${CHARGEBACKS_API.BASE}/${id}/resolve`, payload)
      .pipe(map((r) => r.data!));
  }
}
