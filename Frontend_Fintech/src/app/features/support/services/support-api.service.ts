import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SUPPORT_API } from '../constants/support.constants';
import { ApiResponse, CreateTicketPayload, TicketDetail, TicketListResponse, TicketStats, UpdateTicketPayload } from '../models/support.models';

@Injectable({ providedIn: 'root' })
export class SupportApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  list(params: { page: number; pageSize: number; search?: string; status?: string; priority?: string; assignedTo?: number; merchantId?: number }): Observable<TicketListResponse> {
    let p = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.search) p = p.set('search', params.search);
    if (params.status) p = p.set('status', params.status);
    if (params.priority) p = p.set('priority', params.priority);
    if (params.assignedTo) p = p.set('assignedTo', params.assignedTo);
    if (params.merchantId) p = p.set('merchantId', params.merchantId);
    return this.http.get<ApiResponse<TicketListResponse>>(`${this.base}${SUPPORT_API.BASE}`, { params: p }).pipe(map((r) => r.data!));
  }

  statistics(): Observable<TicketStats> {
    return this.http.get<ApiResponse<TicketStats>>(`${this.base}${SUPPORT_API.STATISTICS}`).pipe(map((r) => r.data!));
  }

  getById(id: number): Observable<TicketDetail> {
    return this.http.get<ApiResponse<TicketDetail>>(`${this.base}${SUPPORT_API.BASE}/${id}`).pipe(map((r) => r.data!));
  }

  create(payload: CreateTicketPayload): Observable<TicketDetail> {
    return this.http.post<ApiResponse<TicketDetail>>(`${this.base}${SUPPORT_API.BASE}`, payload).pipe(map((r) => r.data!));
  }

  update(id: number, payload: UpdateTicketPayload): Observable<TicketDetail> {
    return this.http.put<ApiResponse<TicketDetail>>(`${this.base}${SUPPORT_API.BASE}/${id}`, payload).pipe(map((r) => r.data!));
  }

  assign(id: number, assigneeId: number): Observable<TicketDetail> {
    return this.http.post<ApiResponse<TicketDetail>>(`${this.base}${SUPPORT_API.BASE}/${id}/assign`, { assigneeId }).pipe(map((r) => r.data!));
  }

  escalate(id: number, assigneeId?: number, reason?: string): Observable<TicketDetail> {
    return this.http.post<ApiResponse<TicketDetail>>(`${this.base}${SUPPORT_API.BASE}/${id}/escalate`, { assigneeId, reason }).pipe(map((r) => r.data!));
  }

  close(id: number): Observable<TicketDetail> {
    return this.http.post<ApiResponse<TicketDetail>>(`${this.base}${SUPPORT_API.BASE}/${id}/close`, {}).pipe(map((r) => r.data!));
  }

  reopen(id: number): Observable<TicketDetail> {
    return this.http.post<ApiResponse<TicketDetail>>(`${this.base}${SUPPORT_API.BASE}/${id}/reopen`, {}).pipe(map((r) => r.data!));
  }

  addNote(id: number, body: string, isInternal = true): Observable<TicketDetail> {
    return this.http.post<ApiResponse<TicketDetail>>(`${this.base}${SUPPORT_API.BASE}/${id}/notes`, { body, isInternal }).pipe(map((r) => r.data!));
  }
}
