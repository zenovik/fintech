export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface AuditLogItem {
  id: number;
  uuid: string;
  correlationId: string;
  userId: number | null;
  actorName: string | null;
  sessionId: number | null;
  module: string;
  categoryCode: string;
  actionCode: string;
  entityType: string | null;
  entityId: string | null;
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
  riskLevel: string;
  beforeValues: Record<string, unknown>;
  afterValues: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLogDetail extends AuditLogItem {
  metadata: { key: string; value: string }[];
}

export interface AuditStats {
  total: number;
  critical24h: number;
  recent24h: number;
  riskScore: number;
}

export interface AuditListResponse {
  items: AuditLogItem[];
  total: number;
  page: number;
  pageSize: number;
  stats: AuditStats;
}

export interface AuditCategory {
  id: number;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
}

export interface AuditAction {
  id: number;
  code: string;
  name: string;
  categoryCode: string;
  riskLevel: string;
}

export interface AuditExportResponse {
  fileId: string;
  rowCount: number;
  downloadUrl: string;
}

export interface ApiLogItem {
  id: number;
  uuid: string;
  correlationId: string | null;
  userId: number | null;
  method: string;
  path: string;
  statusCode: number;
  ipAddress: string | null;
  responseTimeMs: number | null;
  createdAt: string;
}

export interface WebhookLogItem {
  id: number;
  uuid: string;
  correlationId: string | null;
  eventType: string;
  url: string;
  status: string;
  statusCode: number | null;
  attemptCount: number;
  deliveredAt: string | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
