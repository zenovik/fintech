import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, RoleListItem } from '../models/role.models';

@Injectable({ providedIn: 'root' })
export class RoleApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1/roles`;

  list(): Observable<{ items: RoleListItem[] }> {
    return this.http.get<ApiResponse<{ items: RoleListItem[] }>>(this.base).pipe(map((r) => r.data));
  }

  getById(id: number): Observable<RoleListItem> {
    return this.http.get<ApiResponse<RoleListItem>>(`${this.base}/${id}`).pipe(map((r) => r.data));
  }

  create(body: Record<string, unknown>): Observable<RoleListItem> {
    return this.http.post<ApiResponse<RoleListItem>>(this.base, body).pipe(map((r) => r.data));
  }

  update(id: number, body: Record<string, unknown>): Observable<RoleListItem> {
    return this.http.put<ApiResponse<RoleListItem>>(`${this.base}/${id}`, body).pipe(map((r) => r.data));
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.base}/${id}`).pipe(map((r) => r.data!));
  }

  assignPermissions(id: number, permissionIds: number[]): Observable<RoleListItem> {
    return this.http.put<ApiResponse<RoleListItem>>(`${this.base}/${id}/permissions`, { permissionIds }).pipe(map((r) => r.data));
  }
}
