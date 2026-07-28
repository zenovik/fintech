import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ActivityTimelineItem {
  source: string;
  id: string;
  title: string;
  description: string | null;
  actorName: string | null;
  entityType: string | null;
  entityId: string | null;
  occurredAt: string;
  metadata: Record<string, unknown> | null;
}

export interface ActivityTimelineResponse {
  items: ActivityTimelineItem[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

@Injectable({ providedIn: 'root' })
export class ActivityApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1/activity/timeline`;

  getTimeline(params: { page: number; pageSize: number; source?: string }): Observable<ActivityTimelineResponse> {
    let p = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.source) p = p.set('source', params.source);
    return this.http.get<ActivityTimelineResponse>(this.base, { params: p });
  }
}
