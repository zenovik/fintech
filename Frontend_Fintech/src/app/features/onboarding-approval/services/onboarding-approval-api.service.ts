import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OnboardingApprovalApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/onboarding-approval`;

  complianceQueue(params: Record<string, string | number | undefined>): Observable<unknown> {
    let hp = new HttpParams();
    for (const [k, v] of Object.entries(params)) {
      if (v != null && v !== '') hp = hp.set(k, String(v));
    }
    return this.http.get(`${this.base}/compliance-queue`, { params: hp });
  }

  dashboardStats(): Observable<unknown> {
    return this.http.get(`${environment.apiUrl}/api/v1/dashboard/executive/onboarding-stats`);
  }

  getWorkflow(applicationId: number): Observable<unknown> {
    return this.http.get(`${this.base}/${applicationId}/workflow`);
  }

  approve(applicationId: number, remarks?: string): Observable<unknown> {
    return this.http.post(`${this.base}/${applicationId}/approve`, { remarks });
  }

  reject(applicationId: number, remarks?: string): Observable<unknown> {
    return this.http.post(`${this.base}/${applicationId}/reject`, { remarks });
  }

  goLive(applicationId: number): Observable<unknown> {
    return this.http.post(`${this.base}/${applicationId}/go-live`, {});
  }
}
