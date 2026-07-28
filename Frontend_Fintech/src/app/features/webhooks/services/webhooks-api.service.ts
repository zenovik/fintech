import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
}

@Injectable({ providedIn: 'root' })
export class WebhooksApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1/webhooks`;

  dashboard(merchantId?: number): Observable<unknown> {
    let params = new HttpParams();
    if (merchantId) params = params.set('merchantId', merchantId);
    return this.http.get<ApiResponse<unknown>>(`${this.base}/dashboard`, { params }).pipe(map((r) => r.data!));
  }

  listEndpoints(params: { page: number; pageSize: number; merchantId?: number }): Observable<unknown> {
    let p = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.merchantId) p = p.set('merchantId', params.merchantId);
    return this.http.get<ApiResponse<unknown>>(`${this.base}/endpoints`, { params: p }).pipe(map((r) => r.data!));
  }

  listDeliveries(params: {
    page: number;
    pageSize: number;
    status?: string;
    merchantId?: number;
  }): Observable<unknown> {
    let p = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.status) p = p.set('status', params.status);
    if (params.merchantId) p = p.set('merchantId', params.merchantId);
    return this.http.get<ApiResponse<unknown>>(`${this.base}/deliveries`, { params: p }).pipe(map((r) => r.data!));
  }

  replayDelivery(id: number): Observable<unknown> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/deliveries/${id}/replay`, {}).pipe(map((r) => r.data!));
  }
}
