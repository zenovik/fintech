import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface CsrfResponse {
  success: boolean;
  data: { csrfToken: string };
}

@Injectable({ providedIn: 'root' })
export class CsrfService {
  private readonly http = inject(HttpClient);
  private token: string | null = null;
  private pending: Promise<string> | null = null;

  async getToken(): Promise<string> {
    if (this.token) {
      return this.token;
    }
    if (!this.pending) {
      this.pending = firstValueFrom(
        this.http.get<CsrfResponse>(`${environment.apiUrl}/auth/csrf-token`, { withCredentials: true }),
      ).then((res) => {
        this.token = res.data.csrfToken;
        return this.token;
      }).finally(() => {
        this.pending = null;
      });
    }
    return this.pending;
  }

  clear(): void {
    this.token = null;
  }
}
