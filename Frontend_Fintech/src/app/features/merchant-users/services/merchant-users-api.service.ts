import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MerchantUserDetail, MerchantUserListResponse, MerchantRole } from '../models/merchant-user.models';

@Injectable({ providedIn: 'root' })
export class MerchantUsersApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/merchant-users`;

  list(params: Record<string, string | number | undefined>): Observable<MerchantUserListResponse> {
    let hp = new HttpParams();
    for (const [k, v] of Object.entries(params)) {
      if (v != null && v !== '') hp = hp.set(k, String(v));
    }
    return this.http.get<MerchantUserListResponse>(this.base, { params: hp });
  }

  listRoles(): Observable<MerchantRole[]> {
    return this.http.get<MerchantRole[]>(`${this.base}/roles`);
  }

  invite(body: Record<string, unknown>): Observable<MerchantUserDetail> {
    return this.http.post<MerchantUserDetail>(`${this.base}/invite`, body);
  }

  activate(id: number): Observable<MerchantUserDetail> {
    return this.http.post<MerchantUserDetail>(`${this.base}/${id}/activate`, {});
  }

  deactivate(id: number): Observable<MerchantUserDetail> {
    return this.http.post<MerchantUserDetail>(`${this.base}/${id}/deactivate`, {});
  }
}
