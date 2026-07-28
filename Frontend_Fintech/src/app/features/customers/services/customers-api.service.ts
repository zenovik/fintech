import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CUSTOMERS_API } from '../constants/customers.constants';
import {
  ApiResponse,
  CreateCustomerPayload,
  CustomerDetail,
  CustomerListResponse,
  CustomerMerchantLink,
  CustomerTransaction,
  UpdateCustomerPayload,
} from '../models/customers.models';

@Injectable({ providedIn: 'root' })
export class CustomersApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  list(params: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    kycStatus?: string;
    riskLevel?: string;
    customerType?: string;
    organizationId?: number;
    merchantId?: number;
  }): Observable<CustomerListResponse> {
    let httpParams = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.kycStatus) httpParams = httpParams.set('kycStatus', params.kycStatus);
    if (params.riskLevel) httpParams = httpParams.set('riskLevel', params.riskLevel);
    if (params.customerType) httpParams = httpParams.set('customerType', params.customerType);
    if (params.organizationId) httpParams = httpParams.set('organizationId', params.organizationId);
    if (params.merchantId) httpParams = httpParams.set('merchantId', params.merchantId);

    return this.http
      .get<ApiResponse<CustomerListResponse>>(`${this.base}${CUSTOMERS_API.BASE}`, { params: httpParams })
      .pipe(map((r) => r.data!));
  }

  getById(id: number): Observable<CustomerDetail> {
    return this.http
      .get<ApiResponse<CustomerDetail>>(`${this.base}${CUSTOMERS_API.BASE}/${id}`)
      .pipe(map((r) => r.data!));
  }

  create(payload: CreateCustomerPayload): Observable<CustomerDetail> {
    return this.http
      .post<ApiResponse<CustomerDetail>>(`${this.base}${CUSTOMERS_API.BASE}`, payload)
      .pipe(map((r) => r.data!));
  }

  update(id: number, payload: UpdateCustomerPayload): Observable<CustomerDetail> {
    return this.http
      .put<ApiResponse<CustomerDetail>>(`${this.base}${CUSTOMERS_API.BASE}/${id}`, payload)
      .pipe(map((r) => r.data!));
  }

  updateStatus(id: number, status: string, reason?: string): Observable<CustomerDetail> {
    return this.http
      .patch<ApiResponse<CustomerDetail>>(`${this.base}${CUSTOMERS_API.BASE}/${id}/status`, { status, reason })
      .pipe(map((r) => r.data!));
  }

  delete(id: number): Observable<{ id: number; deleted: boolean }> {
    return this.http
      .delete<ApiResponse<{ id: number; deleted: boolean }>>(`${this.base}${CUSTOMERS_API.BASE}/${id}`)
      .pipe(map((r) => r.data!));
  }

  getTransactions(id: number, page = 1, pageSize = 10): Observable<{ items: CustomerTransaction[]; pagination: CustomerListResponse['pagination'] }> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return this.http
      .get<ApiResponse<{ items: CustomerTransaction[]; pagination: CustomerListResponse['pagination'] }>>(
        `${this.base}${CUSTOMERS_API.BASE}/${id}/transactions`,
        { params },
      )
      .pipe(map((r) => r.data!));
  }

  getMerchants(id: number): Observable<CustomerMerchantLink[]> {
    return this.http
      .get<ApiResponse<CustomerMerchantLink[]>>(`${this.base}${CUSTOMERS_API.BASE}/${id}/merchants`)
      .pipe(map((r) => r.data!));
  }
}
