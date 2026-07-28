import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { INVOICES_API } from '../constants/invoices.constants';
import { ApiResponse, CreateInvoicePayload, InvoiceDetail, InvoiceListResponse, UpdateInvoicePayload } from '../models/invoices.models';

@Injectable({ providedIn: 'root' })
export class InvoicesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  list(params: { page: number; pageSize: number; search?: string; status?: string; merchantId?: number; customerId?: number }): Observable<InvoiceListResponse> {
    let p = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.search) p = p.set('search', params.search);
    if (params.status) p = p.set('status', params.status);
    if (params.merchantId) p = p.set('merchantId', params.merchantId);
    if (params.customerId) p = p.set('customerId', params.customerId);
    return this.http.get<ApiResponse<InvoiceListResponse>>(`${this.base}${INVOICES_API.BASE}`, { params: p }).pipe(map((r) => r.data!));
  }

  getById(id: number): Observable<InvoiceDetail> {
    return this.http.get<ApiResponse<InvoiceDetail>>(`${this.base}${INVOICES_API.BASE}/${id}`).pipe(map((r) => r.data!));
  }

  create(payload: CreateInvoicePayload): Observable<InvoiceDetail> {
    return this.http.post<ApiResponse<InvoiceDetail>>(`${this.base}${INVOICES_API.BASE}`, payload).pipe(map((r) => r.data!));
  }

  update(id: number, payload: UpdateInvoicePayload): Observable<InvoiceDetail> {
    return this.http.put<ApiResponse<InvoiceDetail>>(`${this.base}${INVOICES_API.BASE}/${id}`, payload).pipe(map((r) => r.data!));
  }

  duplicate(id: number): Observable<InvoiceDetail> {
    return this.http.post<ApiResponse<InvoiceDetail>>(`${this.base}${INVOICES_API.BASE}/${id}/duplicate`, {}).pipe(map((r) => r.data!));
  }

  void(id: number): Observable<InvoiceDetail> {
    return this.http.post<ApiResponse<InvoiceDetail>>(`${this.base}${INVOICES_API.BASE}/${id}/void`, {}).pipe(map((r) => r.data!));
  }

  cancel(id: number): Observable<InvoiceDetail> {
    return this.http.post<ApiResponse<InvoiceDetail>>(`${this.base}${INVOICES_API.BASE}/${id}/cancel`, {}).pipe(map((r) => r.data!));
  }

  markSent(id: number): Observable<InvoiceDetail> {
    return this.http.post<ApiResponse<InvoiceDetail>>(`${this.base}${INVOICES_API.BASE}/${id}/send`, {}).pipe(map((r) => r.data!));
  }

  markOverdue(id: number): Observable<InvoiceDetail> {
    return this.http.post<ApiResponse<InvoiceDetail>>(`${this.base}${INVOICES_API.BASE}/${id}/mark-overdue`, {}).pipe(map((r) => r.data!));
  }

  markPaid(id: number, amount?: number): Observable<InvoiceDetail> {
    return this.http.post<ApiResponse<InvoiceDetail>>(`${this.base}${INVOICES_API.BASE}/${id}/mark-paid`, { amount }).pipe(map((r) => r.data!));
  }

  email(id: number, recipientEmail?: string): Observable<{ queued: boolean; recipient: string }> {
    return this.http.post<ApiResponse<{ queued: boolean; recipient: string }>>(`${this.base}${INVOICES_API.BASE}/${id}/email`, { recipientEmail }).pipe(map((r) => r.data!));
  }

  downloadPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.base}${INVOICES_API.BASE}/${id}/pdf`, { responseType: 'blob' });
  }

  generatePaymentLink(id: number): Observable<InvoiceDetail> {
    return this.http.post<ApiResponse<InvoiceDetail>>(`${this.base}${INVOICES_API.BASE}/${id}/payment-link`, {}).pipe(map((r) => r.data!));
  }

  regeneratePaymentLink(id: number): Observable<InvoiceDetail> {
    return this.http.post<ApiResponse<InvoiceDetail>>(`${this.base}${INVOICES_API.BASE}/${id}/payment-link/regenerate`, {}).pipe(map((r) => r.data!));
  }

  disablePaymentLink(id: number): Observable<InvoiceDetail> {
    return this.http.post<ApiResponse<InvoiceDetail>>(`${this.base}${INVOICES_API.BASE}/${id}/payment-link/disable`, {}).pipe(map((r) => r.data!));
  }
}
