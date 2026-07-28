import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ONBOARDING_API } from '../constants/merchant-onboarding.constants';
import {
  ApiResponse, BankDetails, BusinessInfo, OnboardingAddress, OnboardingDetail,
  OnboardingListResponse, OnboardingStatistics, KycDocument, PaymentConfig, SettlementConfig, TimelineEvent,
} from '../models/merchant-onboarding.models';

@Injectable({ providedIn: 'root' })
export class MerchantOnboardingApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  statistics(): Observable<OnboardingStatistics> {
    return this.http.get<ApiResponse<OnboardingStatistics>>(`${this.base}${ONBOARDING_API.STATISTICS}`).pipe(map((r) => r.data));
  }

  list(params: { page: number; pageSize: number; search?: string; status?: string }): Observable<OnboardingListResponse> {
    let p = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.search) p = p.set('search', params.search);
    if (params.status) p = p.set('status', params.status);
    return this.http.get<ApiResponse<OnboardingListResponse>>(`${this.base}${ONBOARDING_API.BASE}`, { params: p }).pipe(map((r) => r.data));
  }

  getById(id: number): Observable<OnboardingDetail> {
    return this.http.get<ApiResponse<OnboardingDetail>>(`${this.base}${ONBOARDING_API.BASE}/${id}`).pipe(map((r) => r.data));
  }

  create(): Observable<OnboardingDetail> {
    return this.http.post<ApiResponse<OnboardingDetail>>(`${this.base}${ONBOARDING_API.BASE}`, {}).pipe(map((r) => r.data));
  }

  saveBusiness(id: number, payload: BusinessInfo): Observable<OnboardingDetail> {
    return this.http.put<ApiResponse<OnboardingDetail>>(`${this.base}${ONBOARDING_API.BASE}/${id}/business`, payload).pipe(map((r) => r.data));
  }

  saveAddresses(id: number, addresses: OnboardingAddress[]): Observable<OnboardingDetail> {
    return this.http.put<ApiResponse<OnboardingDetail>>(`${this.base}${ONBOARDING_API.BASE}/${id}/addresses`, { addresses }).pipe(map((r) => r.data));
  }

  saveKyc(id: number, documents: KycDocument[]): Observable<OnboardingDetail> {
    return this.http.put<ApiResponse<OnboardingDetail>>(`${this.base}${ONBOARDING_API.BASE}/${id}/kyc`, { documents }).pipe(map((r) => r.data));
  }

  saveBank(id: number, payload: BankDetails): Observable<OnboardingDetail> {
    return this.http.put<ApiResponse<OnboardingDetail>>(`${this.base}${ONBOARDING_API.BASE}/${id}/bank`, payload).pipe(map((r) => r.data));
  }

  saveSettlement(id: number, payload: SettlementConfig): Observable<OnboardingDetail> {
    return this.http.put<ApiResponse<OnboardingDetail>>(`${this.base}${ONBOARDING_API.BASE}/${id}/settlement`, payload).pipe(map((r) => r.data));
  }

  savePayment(id: number, payload: PaymentConfig): Observable<OnboardingDetail> {
    return this.http.put<ApiResponse<OnboardingDetail>>(`${this.base}${ONBOARDING_API.BASE}/${id}/payment`, payload).pipe(map((r) => r.data));
  }

  submit(id: number): Observable<OnboardingDetail> {
    return this.http.post<ApiResponse<OnboardingDetail>>(`${this.base}${ONBOARDING_API.BASE}/${id}/submit`, {}).pipe(map((r) => r.data));
  }

  approve(id: number): Observable<OnboardingDetail> {
    return this.http.post<ApiResponse<OnboardingDetail>>(`${this.base}${ONBOARDING_API.BASE}/${id}/approve`, {}).pipe(map((r) => r.data));
  }

  reject(id: number, reason: string): Observable<OnboardingDetail> {
    return this.http.post<ApiResponse<OnboardingDetail>>(`${this.base}${ONBOARDING_API.BASE}/${id}/reject`, { reason }).pipe(map((r) => r.data));
  }

  goLive(id: number): Observable<OnboardingDetail> {
    return this.http.post<ApiResponse<OnboardingDetail>>(`${this.base}${ONBOARDING_API.BASE}/${id}/go-live`, {}).pipe(map((r) => r.data));
  }

  suspend(id: number, reason?: string): Observable<OnboardingDetail> {
    return this.http.post<ApiResponse<OnboardingDetail>>(`${this.base}${ONBOARDING_API.BASE}/${id}/suspend`, { reason }).pipe(map((r) => r.data));
  }

  timeline(id: number): Observable<{ items: TimelineEvent[] }> {
    return this.http.get<ApiResponse<{ items: TimelineEvent[] }>>(`${this.base}${ONBOARDING_API.BASE}/${id}/timeline`).pipe(map((r) => r.data));
  }
}
