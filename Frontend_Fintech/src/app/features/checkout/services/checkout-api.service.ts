import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CHECKOUT_API } from '../constants/checkout.constants';
import {
  ApiResponse,
  CheckoutAnalytics,
  CheckoutPayPayload,
  CheckoutPayResult,
  CheckoutSessionDetail,
  CheckoutSessionListResponse,
  CheckoutTheme,
  CreateCheckoutSessionPayload,
  CreateCheckoutSessionResult,
  PublicCheckout,
  UpdateBrandingPayload,
  CheckoutBranding,
} from '../models/checkout.models';

@Injectable({ providedIn: 'root' })
export class CheckoutApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  listSessions(params: {
    page: number;
    pageSize: number;
    status?: string;
    merchantId?: number;
  }): Observable<CheckoutSessionListResponse> {
    let httpParams = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.merchantId) httpParams = httpParams.set('merchantId', params.merchantId);
    return this.http
      .get<ApiResponse<CheckoutSessionListResponse>>(`${this.base}${CHECKOUT_API.BASE}/sessions`, { params: httpParams })
      .pipe(map((r) => r.data!));
  }

  getSession(id: number): Observable<CheckoutSessionDetail> {
    return this.http
      .get<ApiResponse<CheckoutSessionDetail>>(`${this.base}${CHECKOUT_API.BASE}/sessions/${id}`)
      .pipe(map((r) => r.data!));
  }

  createSession(payload: CreateCheckoutSessionPayload): Observable<CreateCheckoutSessionResult> {
    return this.http
      .post<ApiResponse<CreateCheckoutSessionResult>>(`${this.base}${CHECKOUT_API.BASE}/sessions`, payload)
      .pipe(map((r) => r.data!));
  }

  getAnalytics(merchantId?: number, days?: number): Observable<CheckoutAnalytics> {
    let params = new HttpParams();
    if (merchantId) params = params.set('merchantId', merchantId);
    if (days) params = params.set('days', days);
    return this.http
      .get<ApiResponse<CheckoutAnalytics>>(`${this.base}${CHECKOUT_API.BASE}/analytics`, { params })
      .pipe(map((r) => r.data!));
  }

  listThemes(): Observable<CheckoutTheme[]> {
    return this.http
      .get<ApiResponse<CheckoutTheme[]>>(`${this.base}${CHECKOUT_API.BASE}/themes`)
      .pipe(map((r) => r.data!));
  }

  getBranding(merchantId: number): Observable<{ branding: CheckoutBranding }> {
    return this.http
      .get<ApiResponse<{ branding: CheckoutBranding }>>(`${this.base}${CHECKOUT_API.BASE}/branding/${merchantId}`)
      .pipe(map((r) => r.data!));
  }

  updateBranding(merchantId: number, payload: UpdateBrandingPayload): Observable<{ branding: CheckoutBranding }> {
    return this.http
      .put<ApiResponse<{ branding: CheckoutBranding }>>(`${this.base}${CHECKOUT_API.BASE}/branding/${merchantId}`, payload)
      .pipe(map((r) => r.data!));
  }

  getPublicCheckout(ref: string, clientSecret: string): Observable<PublicCheckout> {
    const headers = new HttpHeaders({ 'X-Client-Secret': clientSecret });
    return this.http
      .get<ApiResponse<PublicCheckout>>(`${this.base}${CHECKOUT_API.PUBLIC}/${ref}`, { headers })
      .pipe(map((r) => r.data!));
  }

  pay(ref: string, clientSecret: string, payload: CheckoutPayPayload): Observable<CheckoutPayResult> {
    const headers = new HttpHeaders({ 'X-Client-Secret': clientSecret });
    return this.http
      .post<ApiResponse<CheckoutPayResult>>(`${this.base}${CHECKOUT_API.PUBLIC}/${ref}/pay`, payload, { headers })
      .pipe(map((r) => r.data!));
  }

  retry(ref: string, clientSecret: string, payload: CheckoutPayPayload): Observable<CheckoutPayResult> {
    const headers = new HttpHeaders({ 'X-Client-Secret': clientSecret });
    return this.http
      .post<ApiResponse<CheckoutPayResult>>(`${this.base}${CHECKOUT_API.PUBLIC}/${ref}/retry`, payload, { headers })
      .pipe(map((r) => r.data!));
  }

  cancel(ref: string, clientSecret: string): Observable<{ redirectUrl?: string | null }> {
    const headers = new HttpHeaders({ 'X-Client-Secret': clientSecret });
    return this.http
      .post<ApiResponse<{ redirectUrl?: string | null }>>(`${this.base}${CHECKOUT_API.PUBLIC}/${ref}/cancel`, {}, { headers })
      .pipe(map((r) => r.data!));
  }

  recover(token: string): Observable<{ checkoutRef: string; clientSecret: string; hostedCheckoutUrl: string; expiresAt: string }> {
    return this.http
      .get<ApiResponse<{ checkoutRef: string; clientSecret: string; hostedCheckoutUrl: string; expiresAt: string }>>(
        `${this.base}${CHECKOUT_API.PUBLIC}/recover/${token}`,
      )
      .pipe(map((r) => r.data!));
  }
}
