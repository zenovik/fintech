import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SUBSCRIPTIONS_API } from '../constants/subscriptions.constants';
import {
  ApiResponse,
  CreatePlanPayload,
  CreateSubscriptionPayload,
  PlanListResponse,
  SubscriptionDetail,
  SubscriptionListResponse,
  SubscriptionPlan,
  SubscriptionStats,
} from '../models/subscriptions.models';

@Injectable({ providedIn: 'root' })
export class SubscriptionsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  list(params: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    merchantId?: number;
    customerId?: number;
  }): Observable<SubscriptionListResponse> {
    let httpParams = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.merchantId) httpParams = httpParams.set('merchantId', params.merchantId);
    if (params.customerId) httpParams = httpParams.set('customerId', params.customerId);

    return this.http
      .get<ApiResponse<SubscriptionListResponse>>(`${this.base}${SUBSCRIPTIONS_API.BASE}`, { params: httpParams })
      .pipe(map((r) => r.data!));
  }

  statistics(): Observable<SubscriptionStats> {
    return this.http
      .get<ApiResponse<SubscriptionStats>>(`${this.base}${SUBSCRIPTIONS_API.STATISTICS}`)
      .pipe(map((r) => r.data!));
  }

  listPlans(params: { page: number; pageSize: number; search?: string; merchantId?: number }): Observable<PlanListResponse> {
    let httpParams = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.merchantId) httpParams = httpParams.set('merchantId', params.merchantId);

    return this.http
      .get<ApiResponse<PlanListResponse>>(`${this.base}${SUBSCRIPTIONS_API.PLANS}`, { params: httpParams })
      .pipe(map((r) => r.data!));
  }

  createPlan(payload: CreatePlanPayload): Observable<SubscriptionPlan> {
    return this.http
      .post<ApiResponse<SubscriptionPlan>>(`${this.base}${SUBSCRIPTIONS_API.PLANS}`, payload)
      .pipe(map((r) => r.data!));
  }

  getById(id: number): Observable<SubscriptionDetail> {
    return this.http
      .get<ApiResponse<SubscriptionDetail>>(`${this.base}${SUBSCRIPTIONS_API.BASE}/${id}`)
      .pipe(map((r) => r.data!));
  }

  create(payload: CreateSubscriptionPayload): Observable<SubscriptionDetail> {
    return this.http
      .post<ApiResponse<SubscriptionDetail>>(`${this.base}${SUBSCRIPTIONS_API.BASE}`, payload)
      .pipe(map((r) => r.data!));
  }

  pause(id: number): Observable<SubscriptionDetail> {
    return this.http
      .post<ApiResponse<SubscriptionDetail>>(`${this.base}${SUBSCRIPTIONS_API.BASE}/${id}/pause`, {})
      .pipe(map((r) => r.data!));
  }

  cancel(id: number): Observable<SubscriptionDetail> {
    return this.http
      .post<ApiResponse<SubscriptionDetail>>(`${this.base}${SUBSCRIPTIONS_API.BASE}/${id}/cancel`, {})
      .pipe(map((r) => r.data!));
  }

  renew(id: number): Observable<SubscriptionDetail> {
    return this.http
      .post<ApiResponse<SubscriptionDetail>>(`${this.base}${SUBSCRIPTIONS_API.BASE}/${id}/renew`, {})
      .pipe(map((r) => r.data!));
  }

  markFailed(id: number): Observable<SubscriptionDetail> {
    return this.http
      .post<ApiResponse<SubscriptionDetail>>(`${this.base}${SUBSCRIPTIONS_API.BASE}/${id}/fail`, {})
      .pipe(map((r) => r.data!));
  }
}
