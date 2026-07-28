import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { OutletDetail, OutletListResponse } from '../models/outlet.models';

@Injectable({ providedIn: 'root' })
export class OutletsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/outlets`;

  list(params: Record<string, string | number | undefined>): Observable<OutletListResponse> {
    let hp = new HttpParams();
    for (const [k, v] of Object.entries(params)) {
      if (v != null && v !== '') hp = hp.set(k, String(v));
    }
    return this.http.get<OutletListResponse>(this.base, { params: hp });
  }

  getById(id: number): Observable<OutletDetail> {
    return this.http.get<OutletDetail>(`${this.base}/${id}`);
  }

  create(body: Record<string, unknown>): Observable<OutletDetail> {
    return this.http.post<OutletDetail>(this.base, body);
  }

  update(id: number, body: Record<string, unknown>): Observable<OutletDetail> {
    return this.http.put<OutletDetail>(`${this.base}/${id}`, body);
  }

  activate(id: number): Observable<OutletDetail> {
    return this.http.post<OutletDetail>(`${this.base}/${id}/activate`, {});
  }

  deactivate(id: number): Observable<OutletDetail> {
    return this.http.post<OutletDetail>(`${this.base}/${id}/deactivate`, {});
  }
}
