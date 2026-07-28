import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SYSTEM_API } from '../constants/system.constants';
import { ApiResponse, SystemHealth, SystemReadiness, SystemVersion } from '../models/system.models';

@Injectable({ providedIn: 'root' })
export class SystemApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  getHealth(): Observable<SystemHealth> {
    return this.getWithOperationalStatus(`${this.base}${SYSTEM_API.HEALTH}`);
  }

  getReadiness(): Observable<SystemReadiness> {
    return this.getWithOperationalStatus(`${this.base}${SYSTEM_API.READINESS}`);
  }

  getVersion(): Observable<SystemVersion> {
    return this.http
      .get<ApiResponse<SystemVersion>>(`${this.base}${SYSTEM_API.VERSION}`)
      .pipe(map((response) => response.data!));
  }

  private getWithOperationalStatus<T>(url: string): Observable<T> {
    return this.http.get<ApiResponse<T>>(url).pipe(
      map((response) => response.data!),
      catchError((error: HttpErrorResponse) => {
        const payload = error.error?.data;
        if (error.status === 503 && payload) {
          return of(payload as T);
        }
        return throwError(() => error);
      }),
    );
  }
}
