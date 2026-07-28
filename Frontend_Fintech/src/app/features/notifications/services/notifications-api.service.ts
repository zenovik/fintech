import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { NOTIFICATIONS_API } from '../constants/notifications.constants';
import {
  ApiResponse,
  BroadcastItem,
  BroadcastListResponse,
  NotificationChannel,
  NotificationDetail,
  NotificationEvent,
  NotificationGroup,
  NotificationItem,
  NotificationListResponse,
  NotificationTemplate,
  TemplateListResponse,
  UnreadCountResponse,
} from '../models/notifications.models';

@Injectable({ providedIn: 'root' })
export class NotificationsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  list(params: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    category?: string;
    categories?: string;
    priority?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Observable<NotificationListResponse> {
    let httpParams = new HttpParams()
      .set('page', params.page)
      .set('pageSize', params.pageSize);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.categories) httpParams = httpParams.set('categories', params.categories);
    if (params.priority) httpParams = httpParams.set('priority', params.priority);
    if (params.dateFrom) httpParams = httpParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) httpParams = httpParams.set('dateTo', params.dateTo);

    return this.http
      .get<ApiResponse<NotificationListResponse>>(`${this.base}${NOTIFICATIONS_API.BASE}`, { params: httpParams })
      .pipe(map((r) => r.data!));
  }

  getById(id: number): Observable<NotificationDetail> {
    return this.http
      .get<ApiResponse<NotificationDetail>>(`${this.base}${NOTIFICATIONS_API.BASE}/${id}`)
      .pipe(map((r) => r.data!));
  }

  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.http
      .get<ApiResponse<UnreadCountResponse>>(`${this.base}${NOTIFICATIONS_API.UNREAD_COUNT}`)
      .pipe(map((r) => r.data!));
  }

  markRead(id: number): Observable<NotificationItem> {
    return this.http
      .patch<ApiResponse<NotificationItem>>(`${this.base}${NOTIFICATIONS_API.BASE}/${id}/read`, {})
      .pipe(map((r) => r.data!));
  }

  markAllRead(): Observable<{ updated: number }> {
    return this.http
      .patch<ApiResponse<{ updated: number }>>(`${this.base}${NOTIFICATIONS_API.READ_ALL}`, {})
      .pipe(map((r) => r.data!));
  }

  archive(id: number): Observable<NotificationItem> {
    return this.http
      .patch<ApiResponse<NotificationItem>>(`${this.base}${NOTIFICATIONS_API.BASE}/${id}/archive`, {})
      .pipe(map((r) => r.data!));
  }

  archiveAll(): Observable<{ updated: number }> {
    return this.http
      .patch<ApiResponse<{ updated: number }>>(`${this.base}${NOTIFICATIONS_API.ARCHIVE_ALL}`, {})
      .pipe(map((r) => r.data!));
  }

  delete(id: number): Observable<{ deleted: boolean }> {
    return this.http
      .delete<ApiResponse<{ deleted: boolean }>>(`${this.base}${NOTIFICATIONS_API.BASE}/${id}`)
      .pipe(map((r) => r.data!));
  }

  listTemplates(params: {
    page: number;
    pageSize: number;
    search?: string;
    eventCode?: string;
    channel?: string;
    category?: string;
    isActive?: boolean;
  }): Observable<TemplateListResponse> {
    let httpParams = new HttpParams()
      .set('page', params.page)
      .set('pageSize', params.pageSize);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.eventCode) httpParams = httpParams.set('eventCode', params.eventCode);
    if (params.channel) httpParams = httpParams.set('channel', params.channel);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.isActive !== undefined) httpParams = httpParams.set('isActive', params.isActive);

    return this.http
      .get<ApiResponse<TemplateListResponse>>(`${this.base}${NOTIFICATIONS_API.TEMPLATES}`, { params: httpParams })
      .pipe(map((r) => r.data!));
  }

  getTemplate(id: number): Observable<NotificationTemplate> {
    return this.http
      .get<ApiResponse<NotificationTemplate>>(`${this.base}${NOTIFICATIONS_API.TEMPLATES}/${id}`)
      .pipe(map((r) => r.data!));
  }

  createTemplate(payload: Partial<NotificationTemplate>): Observable<NotificationTemplate> {
    return this.http
      .post<ApiResponse<NotificationTemplate>>(`${this.base}${NOTIFICATIONS_API.TEMPLATES}`, payload)
      .pipe(map((r) => r.data!));
  }

  updateTemplate(id: number, payload: Partial<NotificationTemplate>): Observable<NotificationTemplate> {
    return this.http
      .put<ApiResponse<NotificationTemplate>>(`${this.base}${NOTIFICATIONS_API.TEMPLATES}/${id}`, payload)
      .pipe(map((r) => r.data!));
  }

  deleteTemplate(id: number): Observable<{ deleted: boolean }> {
    return this.http
      .delete<ApiResponse<{ deleted: boolean }>>(`${this.base}${NOTIFICATIONS_API.TEMPLATES}/${id}`)
      .pipe(map((r) => r.data!));
  }

  listBroadcasts(params: { page: number; pageSize: number; search?: string }): Observable<BroadcastListResponse> {
    let httpParams = new HttpParams()
      .set('page', params.page)
      .set('pageSize', params.pageSize);
    if (params.search) httpParams = httpParams.set('search', params.search);

    return this.http
      .get<ApiResponse<BroadcastListResponse>>(`${this.base}${NOTIFICATIONS_API.BROADCASTS}`, { params: httpParams })
      .pipe(map((r) => r.data!));
  }

  createBroadcast(payload: {
    title: string;
    message: string;
    groupCode: string;
    priority?: string;
    category?: string;
  }): Observable<BroadcastItem & { recipientCount: number }> {
    return this.http
      .post<ApiResponse<BroadcastItem & { recipientCount: number }>>(`${this.base}${NOTIFICATIONS_API.BROADCASTS}`, payload)
      .pipe(map((r) => r.data!));
  }

  getGroups(): Observable<NotificationGroup[]> {
    return this.http
      .get<ApiResponse<NotificationGroup[]>>(`${this.base}${NOTIFICATIONS_API.GROUPS}`)
      .pipe(map((r) => r.data!));
  }

  getChannels(): Observable<NotificationChannel[]> {
    return this.http
      .get<ApiResponse<NotificationChannel[]>>(`${this.base}${NOTIFICATIONS_API.CHANNELS}`)
      .pipe(map((r) => r.data!));
  }

  getEvents(): Observable<NotificationEvent[]> {
    return this.http
      .get<ApiResponse<NotificationEvent[]>>(`${this.base}${NOTIFICATIONS_API.EVENTS}`)
      .pipe(map((r) => r.data!));
  }
}
