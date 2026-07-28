import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DevicesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/devices`;

  list(params: Record<string, string | number | undefined>) {
    let hp = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') hp = hp.set(k, String(v)); });
    return this.http.get(`${this.base}`, { params: hp });
  }

  provision(body: Record<string, unknown>) {
    return this.http.post(`${this.base}`, body);
  }

  activate(id: number, body: Record<string, unknown>) {
    return this.http.post(`${this.base}/${id}/activate`, body);
  }
}
