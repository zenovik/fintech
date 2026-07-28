import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface ApiResponse<T> { success: boolean; data?: T; }

@Injectable({ providedIn: 'root' })
export class SmartCollectApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1/smart-collect`;

  dashboard(merchantId?: number): Observable<unknown> {
    let params = new HttpParams();
    if (merchantId) params = params.set('merchantId', merchantId);
    return this.http.get<ApiResponse<unknown>>(`${this.base}/dashboard`, { params }).pipe(map((r) => r.data!));
  }

  listVirtualAccounts(params: { page: number; pageSize: number; status?: string; merchantId?: number }): Observable<unknown> {
    let p = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.status) p = p.set('status', params.status);
    if (params.merchantId) p = p.set('merchantId', params.merchantId);
    return this.http.get<ApiResponse<unknown>>(`${this.base}/virtual-accounts`, { params: p }).pipe(map((r) => r.data!));
  }

  listCollections(params: { page: number; pageSize: number; status?: string; merchantId?: number }): Observable<unknown> {
    let p = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.status) p = p.set('status', params.status);
    if (params.merchantId) p = p.set('merchantId', params.merchantId);
    return this.http.get<ApiResponse<unknown>>(`${this.base}/collections`, { params: p }).pipe(map((r) => r.data!));
  }

  getCollection(id: number): Observable<unknown> {
    return this.http.get<ApiResponse<unknown>>(`${this.base}/collections/${id}`).pipe(map((r) => r.data!));
  }

  matchCollection(id: number, body: { matchType?: string; transactionId?: number }): Observable<unknown> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/collections/${id}/match`, body).pipe(map((r) => r.data!));
  }

  createVirtualAccount(body: Record<string, unknown>): Observable<unknown> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/virtual-accounts`, body).pipe(map((r) => r.data!));
  }
}
