import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface GlobalSearchResult {
  entityType: string;
  id: number;
  label: string;
  sublabel: string | null;
  route: string;
  score: number;
}

export interface GlobalSearchResponse {
  query: string;
  count: number;
  results: GlobalSearchResult[];
}

@Injectable({ providedIn: 'root' })
export class SearchApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1/search`;

  search(query: string, limit = 15): Observable<GlobalSearchResponse> {
    const params = new HttpParams().set('q', query).set('limit', limit);
    return this.http.get<GlobalSearchResponse>(this.base, { params });
  }
}
