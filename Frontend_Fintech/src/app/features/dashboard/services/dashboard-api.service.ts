import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DASHBOARD_API } from '../constants/dashboard.constants';
import {
  ActivityItem,
  ApiResponse,
  DashboardPreferences,
  ExecutiveSummary,
  FraudAlertItem,
  HighValueTransactionsData,
  PaymentMethodsData,
  RegionalDistributionData,
  RevenueChartData,
} from '../models/dashboard.models';
import { DashboardPeriod } from '../constants/dashboard.constants';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  getSummary(period: DashboardPeriod): Observable<ExecutiveSummary> {
    return this.http
      .get<ApiResponse<ExecutiveSummary>>(`${this.base}${DASHBOARD_API.SUMMARY}`, {
        params: { period },
      })
      .pipe(map((r) => r.data));
  }

  getRevenueChart(): Observable<RevenueChartData> {
    return this.http
      .get<ApiResponse<RevenueChartData>>(`${this.base}${DASHBOARD_API.REVENUE}`)
      .pipe(map((r) => r.data));
  }

  getPaymentMethods(period: DashboardPeriod): Observable<PaymentMethodsData> {
    return this.http
      .get<ApiResponse<PaymentMethodsData>>(`${this.base}${DASHBOARD_API.PAYMENT_METHODS}`, {
        params: { period },
      })
      .pipe(map((r) => r.data));
  }

  getRegionalDistribution(period: DashboardPeriod): Observable<RegionalDistributionData> {
    return this.http
      .get<ApiResponse<RegionalDistributionData>>(`${this.base}${DASHBOARD_API.REGIONAL}`, {
        params: { period },
      })
      .pipe(map((r) => r.data));
  }

  getHighValueTransactions(params: {
    period: DashboardPeriod;
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
  }): Observable<HighValueTransactionsData> {
    let httpParams = new HttpParams()
      .set('period', params.period)
      .set('page', params.page)
      .set('pageSize', params.pageSize);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);

    return this.http
      .get<ApiResponse<HighValueTransactionsData>>(`${this.base}${DASHBOARD_API.HIGH_VALUE}`, {
        params: httpParams,
      })
      .pipe(map((r) => r.data));
  }

  getActivities(): Observable<{ items: ActivityItem[] }> {
    return this.http
      .get<ApiResponse<{ items: ActivityItem[] }>>(`${this.base}${DASHBOARD_API.ACTIVITIES}`)
      .pipe(map((r) => r.data));
  }

  getFraudAlerts(): Observable<{ items: FraudAlertItem[] }> {
    return this.http
      .get<ApiResponse<{ items: FraudAlertItem[] }>>(`${this.base}${DASHBOARD_API.FRAUD_ALERTS}`)
      .pipe(map((r) => r.data));
  }

  exportReport(period: DashboardPeriod, format: string): Observable<{ jobId: string; status: string; message: string; downloadUrl?: string; rowCount?: number }> {
    return this.http
      .post<ApiResponse<{ jobId: string; status: string; message: string; downloadUrl?: string; rowCount?: number }>>(
        `${this.base}${DASHBOARD_API.EXPORT}`,
        { format, period },
      )
      .pipe(map((r) => r.data));
  }

  getPreferences(): Observable<DashboardPreferences> {
    return this.http
      .get<ApiResponse<DashboardPreferences>>(`${this.base}${DASHBOARD_API.PREFERENCES}`)
      .pipe(map((r) => r.data));
  }

  getOperationsStats(): Observable<Record<string, number>> {
    return this.http
      .get<ApiResponse<Record<string, number>>>(`${this.base}${DASHBOARD_API.OPERATIONS_STATS}`)
      .pipe(map((r) => r.data));
  }
}
