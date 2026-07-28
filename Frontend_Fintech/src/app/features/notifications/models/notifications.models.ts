export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface NotificationItem {
  id: number;
  uuid: string;
  userId: number;
  eventCode: string;
  category: string;
  title: string;
  body: string;
  priority: string;
  status: 'unread' | 'read' | 'archived';
  icon: string | null;
  actionUrl: string | null;
  actionLabel: string | null;
  metadata: Record<string, unknown>;
  relatedEntityType: string | null;
  relatedEntityId: number | null;
  readAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationDetail extends NotificationItem {
  deliveries: DeliveryRecord[];
}

export interface DeliveryRecord {
  id: number;
  uuid: string;
  channel: string;
  status: string;
  errorMessage: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  pageSize: number;
  counts: {
    all: number;
    unread: number;
    read: number;
    archived: number;
  };
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface NotificationTemplate {
  id: number;
  uuid: string;
  code: string;
  name: string;
  eventCode: string;
  channel: string;
  subject: string | null;
  bodyTemplate: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateListResponse {
  items: NotificationTemplate[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BroadcastItem {
  broadcastId: string;
  title: string;
  body: string;
  priority: string;
  category: string;
  recipientCount: number;
  createdAt: string;
}

export interface BroadcastListResponse {
  items: BroadcastItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface NotificationGroup {
  id: number;
  uuid: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

export interface NotificationChannel {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isEnabled: boolean;
}

export interface NotificationEvent {
  id: number;
  code: string;
  name: string;
  category: string;
  description: string | null;
  isEnabled: boolean;
}
