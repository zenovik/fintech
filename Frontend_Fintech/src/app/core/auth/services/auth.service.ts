import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  MfaChallenge,
  VerifyOtpRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UserProfile,
  SessionItem,
  ResendOtpResponse,
} from '../models/auth.models';
import { HTTP_ERROR_MESSAGES } from '../constants/auth.constants';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  login(payload: LoginRequest): Observable<LoginResponse | MfaChallenge> {
    const body = {
      ...payload,
      email: payload.email.trim().toLowerCase(),
    };
    return this.http
      .post<ApiResponse<LoginResponse | MfaChallenge>>(`${this.baseUrl}/login`, body, {
        withCredentials: true,
        observe: 'response',
      })
      .pipe(
        map((response) => {
          const body = response.body!;
          if (response.status === 202) {
            return body.data as MfaChallenge;
          }
          return body.data as LoginResponse;
        }),
        catchError(this.handleError),
      );
  }

  verifyOtp(payload: VerifyOtpRequest): Observable<LoginResponse> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${this.baseUrl}/verify-otp`, payload, {
        withCredentials: true,
      })
      .pipe(
        map((res) => res.data!),
        catchError(this.handleError),
      );
  }

  resendOtp(challengeId: string): Observable<ResendOtpResponse> {
    return this.http
      .post<ApiResponse<ResendOtpResponse>>(
        `${this.baseUrl}/resend-otp`,
        { challengeId },
        {
          withCredentials: true,
        },
      )
      .pipe(
        map((res) => res.data!),
        catchError(this.handleError),
      );
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<string> {
    return this.http
      .post<ApiResponse>(`${this.baseUrl}/forgot-password`, {
        email: payload.email.trim().toLowerCase(),
      })
      .pipe(
        map((res) => res.message ?? 'Request submitted'),
        catchError(this.handleError),
      );
  }

  resetPassword(payload: ResetPasswordRequest): Observable<string> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/reset-password`, payload).pipe(
      map((res) => res.message ?? 'Password reset successful'),
      catchError(this.handleError),
    );
  }

  refreshToken(): Observable<LoginResponse> {
    return this.http
      .post<ApiResponse<LoginResponse>>(
        `${this.baseUrl}/refresh-token`,
        {},
        {
          withCredentials: true,
        },
      )
      .pipe(
        map((res) => res.data!),
        catchError(this.handleError),
      );
  }

  logout(): Observable<void> {
    return this.http
      .post<ApiResponse>(`${this.baseUrl}/logout`, {}, { withCredentials: true })
      .pipe(
        map(() => undefined),
        catchError(() => {
          return throwError(() => new Error('Logout failed'));
        }),
      );
  }

  getMe(): Observable<UserProfile> {
    return this.http
      .get<ApiResponse<UserProfile>>(`${this.baseUrl}/me`, { withCredentials: true })
      .pipe(
        map((res) => res.data!),
        catchError(this.handleError),
      );
  }

  selectOrganization(organizationId: number): Observable<{ accessToken: string; expiresIn: string; organizationId: number; organizationRoleCode: string }> {
    return this.http
      .post<ApiResponse<{ accessToken: string; expiresIn: string; organizationId: number; organizationRoleCode: string }>>(
        `${this.baseUrl}/select-organization`,
        { organizationId },
        { withCredentials: true },
      )
      .pipe(
        map((res) => res.data!),
        catchError(this.handleError),
      );
  }

  getSessions(): Observable<SessionItem[]> {
    return this.http
      .get<ApiResponse<SessionItem[]>>(`${this.baseUrl}/sessions`, { withCredentials: true })
      .pipe(
        map((res) => res.data ?? []),
        catchError(this.handleError),
      );
  }

  revokeSession(sessionId: string): Observable<void> {
    return this.http
      .delete<ApiResponse>(`${this.baseUrl}/session/${sessionId}`, { withCredentials: true })
      .pipe(
        map(() => undefined),
        catchError(this.handleError),
      );
  }

  revokeOtherSessions(): Observable<{ revokedCount: number; message: string }> {
    return this.http
      .delete<ApiResponse<{ revokedCount: number; message: string }>>(
        `${this.baseUrl}/sessions/others`,
        { withCredentials: true },
      )
      .pipe(
        map((res) => res.data!),
        catchError(this.handleError),
      );
  }

  extractErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Unable to connect to the server. Please check your network connection.';
    }
    const body = error.error as ApiResponse | undefined;
    if (body?.message) return body.message;
    if (body?.errors && typeof body.errors === 'object') {
      const fieldErrors = Object.values(body.errors as Record<string, string[]>).flat();
      if (fieldErrors.length) return fieldErrors.join('. ');
    }
    return HTTP_ERROR_MESSAGES[error.status] ?? 'An unexpected error occurred.';
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    return throwError(() => error);
  };
}
