import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
}

@Injectable({ providedIn: 'root' })
export class SandboxApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1/sandbox`;

  dashboard(merchantId?: number): Observable<unknown> {
    let params = new HttpParams();
    if (merchantId) params = params.set('merchantId', merchantId);
    return this.http.get<ApiResponse<unknown>>(`${this.base}/dashboard`, { params }).pipe(map((r) => r.data!));
  }

  listAccounts(params: { page: number; pageSize: number; merchantId?: number }): Observable<unknown> {
    let p = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.merchantId) p = p.set('merchantId', params.merchantId);
    return this.http.get<ApiResponse<unknown>>(`${this.base}/accounts`, { params: p }).pipe(map((r) => r.data!));
  }

  listTestCards(): Observable<unknown> {
    return this.http.get<ApiResponse<unknown>>(`${this.base}/test-cards`).pipe(map((r) => r.data!));
  }

  listSimulations(params: { page: number; pageSize: number }): Observable<unknown> {
    const p = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    return this.http.get<ApiResponse<unknown>>(`${this.base}/simulations`, { params: p }).pipe(map((r) => r.data!));
  }
}
