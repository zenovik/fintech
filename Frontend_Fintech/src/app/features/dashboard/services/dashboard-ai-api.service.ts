import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DASHBOARD_AI_API } from '../constants/dashboard-ai.constants';
import { ApiResponse, DashboardAiChatRequest, DashboardAiChatResponse } from '../models/dashboard-ai.models';

@Injectable({ providedIn: 'root' })
export class DashboardAiApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  chat(payload: DashboardAiChatRequest): Observable<DashboardAiChatResponse> {
    return this.http
      .post<ApiResponse<DashboardAiChatResponse>>(`${this.base}${DASHBOARD_AI_API.CHAT}`, payload)
      .pipe(map((r) => r.data!));
  }
}
