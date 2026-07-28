import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { OPERATIONS_API } from '../constants/operations.constants';

interface ApiResponse<T> { success: boolean; data?: T; }

@Injectable({ providedIn: 'root' })
export class OperationsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  dashboard(): Observable<Record<string, number>> {
    return this.http.get<ApiResponse<Record<string, number>>>(`${this.base}${OPERATIONS_API.DASHBOARD}`).pipe(map((r) => r.data!));
  }

  health(): Observable<{ database: string; api: string; timestamp: string }> {
    return this.http.get<ApiResponse<{ database: string; api: string; timestamp: string }>>(`${this.base}${OPERATIONS_API.HEALTH}`).pipe(map((r) => r.data!));
  }

  alerts(page = 1): Observable<{ items: unknown[]; pagination: { total: number } }> {
    return this.http.get<ApiResponse<{ items: unknown[]; pagination: { total: number } }>>(`${this.base}${OPERATIONS_API.BASE}/alerts`, { params: { page, pageSize: 10 } }).pipe(map((r) => r.data!));
  }

  incidents(page = 1): Observable<{ items: unknown[]; pagination: { total: number } }> {
    return this.http.get<ApiResponse<{ items: unknown[]; pagination: { total: number } }>>(`${this.base}${OPERATIONS_API.BASE}/incidents`, { params: { page, pageSize: 10 } }).pipe(map((r) => r.data!));
  }

  retryQueue(page = 1): Observable<{ items: unknown[]; pagination: { total: number } }> {
    return this.http.get<ApiResponse<{ items: unknown[]; pagination: { total: number } }>>(`${this.base}${OPERATIONS_API.BASE}/retry-queue`, { params: { page, pageSize: 10 } }).pipe(map((r) => r.data!));
  }

  jobs(page = 1): Observable<{ items: unknown[]; pagination: { total: number } }> {
    return this.http.get<ApiResponse<{ items: unknown[]; pagination: { total: number } }>>(`${this.base}${OPERATIONS_API.BASE}/jobs`, { params: { page, pageSize: 10 } }).pipe(map((r) => r.data!));
  }

  failedPayments(): Observable<unknown[]> {
    return this.http.get<ApiResponse<unknown[]>>(`${this.base}${OPERATIONS_API.BASE}/failed-payments`).pipe(map((r) => r.data!));
  }

  failedPayouts(): Observable<unknown[]> {
    return this.http.get<ApiResponse<unknown[]>>(`${this.base}${OPERATIONS_API.BASE}/failed-payouts`).pipe(map((r) => r.data!));
  }

  failedWebhooks(): Observable<unknown[]> {
    return this.http.get<ApiResponse<unknown[]>>(`${this.base}${OPERATIONS_API.BASE}/failed-webhooks`).pipe(map((r) => r.data!));
  }

  retryQueueItem(id: number): Observable<unknown> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}${OPERATIONS_API.BASE}/retry-queue/${id}/retry`, {}).pipe(map((r) => r.data!));
  }

  retryJob(id: number): Observable<unknown> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}${OPERATIONS_API.BASE}/jobs/${id}/retry`, {}).pipe(map((r) => r.data!));
  }

  loadAll() {
    return forkJoin({
      dashboard: this.dashboard(), health: this.health(), alerts: this.alerts(),
      incidents: this.incidents(), retryQueue: this.retryQueue(), jobs: this.jobs(),
      failedPayments: this.failedPayments(), failedPayouts: this.failedPayouts(), failedWebhooks: this.failedWebhooks(),
      pendingTasks: this.pendingTasks(),
    });
  }

  pendingTasks(): Observable<Record<string, number>> {
    return this.http.get<ApiResponse<Record<string, number>>>(`${this.base}${OPERATIONS_API.PENDING_TASKS}`).pipe(map((r) => r.data!));
  }
}
