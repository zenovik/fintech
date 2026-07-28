import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
}

@Injectable({ providedIn: 'root' })
export class ReconciliationApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1/reconciliation`;

  dashboard(merchantId?: number): Observable<unknown> {
    let params = new HttpParams();
    if (merchantId) params = params.set('merchantId', merchantId);
    return this.http.get<ApiResponse<unknown>>(`${this.base}/dashboard`, { params }).pipe(map((r) => r.data!));
  }

  listImports(params: { page: number; pageSize: number; merchantId?: number }): Observable<unknown> {
    let p = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.merchantId) p = p.set('merchantId', params.merchantId);
    return this.http.get<ApiResponse<unknown>>(`${this.base}/imports`, { params: p }).pipe(map((r) => r.data!));
  }

  listRecords(params: {
    page: number;
    pageSize: number;
    matchStatus?: string;
    merchantId?: number;
  }): Observable<unknown> {
    let p = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.matchStatus) p = p.set('matchStatus', params.matchStatus);
    if (params.merchantId) p = p.set('merchantId', params.merchantId);
    return this.http.get<ApiResponse<unknown>>(`${this.base}/records`, { params: p }).pipe(map((r) => r.data!));
  }

  listUnmatched(params: { page: number; pageSize: number; merchantId?: number }): Observable<unknown> {
    let p = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.merchantId) p = p.set('merchantId', params.merchantId);
    return this.http.get<ApiResponse<unknown>>(`${this.base}/records/unmatched`, { params: p }).pipe(map((r) => r.data!));
  }
}
