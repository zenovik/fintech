import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PermissionListResponse } from '../../roles/models/role.models';

@Injectable({ providedIn: 'root' })
export class PermissionApiService {
  private readonly http = inject(HttpClient);

  list(): Observable<PermissionListResponse> {
    return this.http.get<ApiResponse<PermissionListResponse>>(`${environment.apiUrl}/v1/permissions`).pipe(map((r) => r.data));
  }
}
