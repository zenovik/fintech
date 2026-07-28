import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ANALYTICS_API } from '../constants/reports.constants';
import { ReportPeriod } from '../constants/reports.constants';
import {
  AnalyticsOverview,
  ApiResponse,
  PaymentSegment,
  RegionalItem,
  RevenueChartData,
  TopMerchant,
} from '../models/reports.models';

@Injectable({ providedIn: 'root' })
export class AnalyticsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  getOverview(period: ReportPeriod = 'monthly'): Observable<AnalyticsOverview> {
    return this.http.get<ApiResponse<AnalyticsOverview>>(`${this.base}${ANALYTICS_API.OVERVIEW}`, { params: { period } }).pipe(map((r) => r.data));
  }

  getRevenue(period: ReportPeriod = 'monthly'): Observable<RevenueChartData> {
    return this.http.get<ApiResponse<RevenueChartData>>(`${this.base}${ANALYTICS_API.REVENUE}`, { params: { period } }).pipe(map((r) => r.data));
  }

  getTransactions(period: ReportPeriod = 'monthly'): Observable<{ totalCount: number; totalVolume: number; settledCount: number; trend: number[] }> {
    return this.http.get<ApiResponse<{ totalCount: number; totalVolume: number; settledCount: number; trend: number[] }>>(`${this.base}${ANALYTICS_API.TRANSACTIONS}`, { params: { period } }).pipe(map((r) => r.data));
  }

  getSettlements(period: ReportPeriod = 'monthly'): Observable<{ byStatus: { status: string; count: number; volume: number }[]; summary: Record<string, number> }> {
    return this.http.get<ApiResponse<{ byStatus: { status: string; count: number; volume: number }[]; summary: Record<string, number> }>>(`${this.base}${ANALYTICS_API.SETTLEMENTS}`, { params: { period } }).pipe(map((r) => r.data));
  }

  getMerchants(period: ReportPeriod = 'monthly'): Observable<{ total: number; active: number; new30d: number; growthPct: number; topMerchants: TopMerchant[] }> {
    return this.http.get<ApiResponse<{ total: number; active: number; new30d: number; growthPct: number; topMerchants: TopMerchant[] }>>(`${this.base}${ANALYTICS_API.MERCHANTS}`, { params: { period } }).pipe(map((r) => r.data));
  }

  getCustomers(period: ReportPeriod = 'monthly'): Observable<{ uniqueCustomers: number; totalTransactions: number }> {
    return this.http.get<ApiResponse<{ uniqueCustomers: number; totalTransactions: number }>>(`${this.base}${ANALYTICS_API.CUSTOMERS}`, { params: { period } }).pipe(map((r) => r.data));
  }

  getPaymentMethods(period: ReportPeriod = 'monthly'): Observable<{ segments: PaymentSegment[] }> {
    return this.http.get<ApiResponse<{ segments: PaymentSegment[] }>>(`${this.base}${ANALYTICS_API.PAYMENT_METHODS}`, { params: { period } }).pipe(map((r) => r.data));
  }

  getRegional(period: ReportPeriod = 'monthly'): Observable<{ regions: RegionalItem[] }> {
    return this.http.get<ApiResponse<{ regions: RegionalItem[] }>>(`${this.base}${ANALYTICS_API.REGIONAL}`, { params: { period } }).pipe(map((r) => r.data));
  }

  export(format: string, period: ReportPeriod = 'monthly'): Observable<{ exportId: string; message: string; downloadUrl?: string }> {
    const params = new HttpParams().set('format', format).set('period', period);
    return this.http.get<ApiResponse<{ exportId: string; message: string; downloadUrl?: string }>>(`${this.base}${ANALYTICS_API.EXPORT}`, { params }).pipe(map((r) => r.data));
  }
}
