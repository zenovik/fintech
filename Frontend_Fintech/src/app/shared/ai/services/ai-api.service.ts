import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AI_API } from '../constants/ai.constants';
import { AiChatRequest, AiChatResponse, ApiResponse } from '../models/ai.models';

@Injectable({ providedIn: 'root' })
export class AiApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  chat(payload: AiChatRequest): Observable<AiChatResponse> {
    return this.http
      .post<ApiResponse<AiChatResponse>>(`${this.base}${AI_API.CHAT}`, payload)
      .pipe(map((r) => r.data!));
  }
}
