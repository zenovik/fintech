import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface ApiResponse<T> { success: boolean; data?: T; }

@Injectable({ providedIn: 'root' })
export class AcceptanceApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1/acceptance`;

  analytics(merchantId?: number, days?: number): Observable<unknown> {
    let params = new HttpParams();
    if (merchantId) params = params.set('merchantId', merchantId);
    if (days) params = params.set('days', days);
    return this.http.get<ApiResponse<unknown>>(`${this.base}/analytics`, { params }).pipe(map((r) => r.data!));
  }

  topMerchants(limit?: number): Observable<unknown> {
    let params = new HttpParams();
    if (limit) params = params.set('limit', limit);
    return this.http.get<ApiResponse<unknown>>(`${this.base}/top-merchants`, { params }).pipe(map((r) => r.data!));
  }

  failureInsights(merchantId?: number): Observable<unknown> {
    let params = new HttpParams();
    if (merchantId) params = params.set('merchantId', merchantId);
    return this.http.get<ApiResponse<unknown>>(`${this.base}/failure-insights`, { params }).pipe(map((r) => r.data!));
  }

  merchantPortal(merchantId: number): Observable<unknown> {
    return this.http.get<ApiResponse<unknown>>(`${this.base}/merchant-portal/${merchantId}`).pipe(map((r) => r.data!));
  }
}
