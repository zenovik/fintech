import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, UserDetail, UserListResponse } from '../models/user.models';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1/users`;

  list(params: { page: number; pageSize: number; search?: string; status?: string; roleId?: number }): Observable<UserListResponse> {
    let p = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.search) p = p.set('search', params.search);
    if (params.status) p = p.set('status', params.status);
    if (params.roleId) p = p.set('roleId', params.roleId);
    return this.http.get<ApiResponse<UserListResponse>>(this.base, { params: p }).pipe(map((r) => r.data));
  }

  getById(id: number): Observable<UserDetail> {
    return this.http.get<ApiResponse<UserDetail>>(`${this.base}/${id}`).pipe(map((r) => r.data));
  }

  create(body: Record<string, unknown>): Observable<UserDetail> {
    return this.http.post<ApiResponse<UserDetail>>(this.base, body).pipe(map((r) => r.data));
  }

  update(id: number, body: Record<string, unknown>): Observable<UserDetail> {
    return this.http.put<ApiResponse<UserDetail>>(`${this.base}/${id}`, body).pipe(map((r) => r.data));
  }

  updateStatus(id: number, status: string, reason?: string): Observable<UserDetail> {
    return this.http.patch<ApiResponse<UserDetail>>(`${this.base}/${id}/status`, { status, reason }).pipe(map((r) => r.data));
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.base}/${id}`).pipe(map((r) => r.data!));
  }

  assignRoles(id: number, roleIds: number[]): Observable<UserDetail> {
    return this.http.put<ApiResponse<UserDetail>>(`${this.base}/${id}/roles`, { roleIds }).pipe(map((r) => r.data));
  }
}
