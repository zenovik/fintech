import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ORGANIZATIONS_API } from '../constants/organizations.constants';
import {
  ApiResponse,
  OrganizationApiKey,
  OrganizationBilling,
  OrganizationBranding,
  OrganizationDetail,
  OrganizationDomain,
  OrganizationListResponse,
  OrganizationMember,
  OrganizationMembership,
  OrganizationRole,
} from '../models/organizations.models';

@Injectable({ providedIn: 'root' })
export class OrganizationsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  list(params: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Observable<OrganizationListResponse> {
    let httpParams = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
    return this.http
      .get<ApiResponse<OrganizationListResponse>>(`${this.base}${ORGANIZATIONS_API.BASE}`, { params: httpParams })
      .pipe(map((r) => r.data!));
  }

  getMine(): Observable<OrganizationMembership[]> {
    return this.http
      .get<ApiResponse<OrganizationMembership[]>>(`${this.base}${ORGANIZATIONS_API.MINE}`)
      .pipe(map((r) => r.data!));
  }

  getRoles(): Observable<OrganizationRole[]> {
    return this.http
      .get<ApiResponse<OrganizationRole[]>>(`${this.base}${ORGANIZATIONS_API.ROLES}`)
      .pipe(map((r) => r.data!));
  }

  getById(id: number): Observable<OrganizationDetail> {
    return this.http
      .get<ApiResponse<OrganizationDetail>>(`${this.base}${ORGANIZATIONS_API.BASE}/${id}`)
      .pipe(map((r) => r.data!));
  }

  create(payload: Record<string, unknown>): Observable<OrganizationDetail> {
    return this.http
      .post<ApiResponse<OrganizationDetail>>(`${this.base}${ORGANIZATIONS_API.BASE}`, payload)
      .pipe(map((r) => r.data!));
  }

  update(id: number, payload: Record<string, unknown>): Observable<OrganizationDetail> {
    return this.http
      .put<ApiResponse<OrganizationDetail>>(`${this.base}${ORGANIZATIONS_API.BASE}/${id}`, payload)
      .pipe(map((r) => r.data!));
  }

  archive(id: number): Observable<OrganizationDetail> {
    return this.http
      .post<ApiResponse<OrganizationDetail>>(`${this.base}${ORGANIZATIONS_API.BASE}/${id}/archive`, {})
      .pipe(map((r) => r.data!));
  }

  restore(id: number): Observable<OrganizationDetail> {
    return this.http
      .post<ApiResponse<OrganizationDetail>>(`${this.base}${ORGANIZATIONS_API.BASE}/${id}/restore`, {})
      .pipe(map((r) => r.data!));
  }

  updateMembers(id: number, memberId: number, payload: Record<string, unknown>): Observable<OrganizationMember> {
    return this.http
      .put<ApiResponse<OrganizationMember>>(`${this.base}${ORGANIZATIONS_API.BASE}/${id}/members/${memberId}`, payload)
      .pipe(map((r) => r.data!));
  }

  addMember(id: number, payload: { userId: number; orgRoleId: number; status?: string }): Observable<OrganizationMember> {
    return this.http
      .post<ApiResponse<OrganizationMember>>(`${this.base}${ORGANIZATIONS_API.BASE}/${id}/members`, payload)
      .pipe(map((r) => r.data!));
  }

  removeMember(id: number, memberId: number): Observable<{ removed: boolean }> {
    return this.http
      .delete<ApiResponse<{ removed: boolean }>>(`${this.base}${ORGANIZATIONS_API.BASE}/${id}/members/${memberId}`)
      .pipe(map((r) => r.data!));
  }

  addDomain(id: number, payload: { domain: string; isPrimary?: boolean }): Observable<OrganizationDomain> {
    return this.http
      .post<ApiResponse<OrganizationDomain>>(`${this.base}${ORGANIZATIONS_API.BASE}/${id}/domains`, payload)
      .pipe(map((r) => r.data!));
  }

  updateDomain(id: number, domainId: number, payload: Record<string, unknown>): Observable<OrganizationDomain> {
    return this.http
      .put<ApiResponse<OrganizationDomain>>(`${this.base}${ORGANIZATIONS_API.BASE}/${id}/domains/${domainId}`, payload)
      .pipe(map((r) => r.data!));
  }

  deleteDomain(id: number, domainId: number): Observable<{ deleted: boolean }> {
    return this.http
      .delete<ApiResponse<{ deleted: boolean }>>(`${this.base}${ORGANIZATIONS_API.BASE}/${id}/domains/${domainId}`)
      .pipe(map((r) => r.data!));
  }

  updateBranding(id: number, payload: Partial<OrganizationBranding>): Observable<OrganizationBranding> {
    return this.http
      .put<ApiResponse<OrganizationBranding>>(`${this.base}${ORGANIZATIONS_API.BASE}/${id}/branding`, payload)
      .pipe(map((r) => r.data!));
  }

  updatePreferences(id: number, preferences: Record<string, unknown>): Observable<Record<string, unknown>> {
    return this.http
      .put<ApiResponse<Record<string, unknown>>>(`${this.base}${ORGANIZATIONS_API.BASE}/${id}/preferences`, { preferences })
      .pipe(map((r) => r.data!));
  }

  createApiKey(id: number, payload: { name: string; environment?: string }): Observable<OrganizationApiKey> {
    return this.http
      .post<ApiResponse<OrganizationApiKey>>(`${this.base}${ORGANIZATIONS_API.BASE}/${id}/api-keys`, payload)
      .pipe(map((r) => r.data!));
  }

  revokeApiKey(id: number, keyId: number): Observable<{ revoked: boolean }> {
    return this.http
      .delete<ApiResponse<{ revoked: boolean }>>(`${this.base}${ORGANIZATIONS_API.BASE}/${id}/api-keys/${keyId}`)
      .pipe(map((r) => r.data!));
  }

  updateBilling(id: number, payload: Partial<OrganizationBilling>): Observable<OrganizationBilling> {
    return this.http
      .put<ApiResponse<OrganizationBilling>>(`${this.base}${ORGANIZATIONS_API.BASE}/${id}/billing`, payload)
      .pipe(map((r) => r.data!));
  }
}
