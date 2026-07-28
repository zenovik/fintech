import { randomUUID } from 'node:crypto';
import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';
import {
  ApiLogListQueryDto,
  AuditExportQueryDto,
  AuditListQueryDto,
  WebhookLogListQueryDto,
} from '../dto';
import { DATE_RANGE_PRESETS } from '../constants/audit.constants';

type Row = RowDataPacket & Record<string, unknown>;

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { return fallback; }
  }
  return value as T;
}

function applyDateRange(dateRange: string | undefined, conditions: string[], params: unknown[]): void {
  if (!dateRange || dateRange === 'all') return;
  const preset = DATE_RANGE_PRESETS.find((p) => p.key === dateRange);
  if (preset && preset.hours > 0) {
    conditions.push('created_at >= DATE_SUB(NOW(6), INTERVAL ? HOUR)');
    params.push(preset.hours);
  }
}

function mapAuditLog(row: Row) {
  return {
    id: row['id'] as number,
    uuid: row['uuid'] as string,
    correlationId: row['correlation_id'] as string,
    userId: row['user_id'] as number | null,
    actorName: row['actor_name'] as string | null,
    sessionId: row['session_id'] as number | null,
    module: row['module'] as string,
    categoryCode: row['category_code'] as string,
    actionCode: row['action_code'] as string,
    entityType: row['entity_type'] as string | null,
    entityId: row['entity_id'] as string | null,
    description: row['description'] as string,
    ipAddress: row['ip_address'] as string | null,
    userAgent: row['user_agent'] as string | null,
    riskLevel: row['risk_level'] as string,
    beforeValues: parseJson<Record<string, unknown>>(row['before_values'], {}),
    afterValues: parseJson<Record<string, unknown>>(row['after_values'], {}),
    createdAt: row['created_at'] as string,
  };
}

export interface RecordAuditInput {
  correlationId?: string;
  userId?: number;
  actorName?: string;
  sessionId?: number;
  module: string;
  categoryCode: string;
  actionCode: string;
  entityType?: string;
  entityId?: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  riskLevel?: string;
  beforeValues?: Record<string, unknown>;
  afterValues?: Record<string, unknown>;
  metadata?: Record<string, string>;
}

export class AuditRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async record(input: RecordAuditInput): Promise<number> {
    const uuid = randomUUID();
    const correlationId = input.correlationId ?? randomUUID();
    const orgId = getOrganizationId() ?? null;
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO audit_logs (uuid, correlation_id, organization_id, user_id, actor_name, session_id, module, category_code, action_code, entity_type, entity_id, description, ip_address, user_agent, risk_level, before_values, after_values)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuid, correlationId, orgId, input.userId ?? null, input.actorName ?? null, input.sessionId ?? null,
        input.module, input.categoryCode, input.actionCode, input.entityType ?? null, input.entityId ?? null,
        input.description, input.ipAddress ?? null, input.userAgent ?? null,
        input.riskLevel ?? 'low',
        input.beforeValues ? JSON.stringify(input.beforeValues) : null,
        input.afterValues ? JSON.stringify(input.afterValues) : null,
      ],
    );
    const auditLogId = result.insertId;
    if (input.metadata) {
      for (const [key, value] of Object.entries(input.metadata)) {
        await this.pool.query(
          `INSERT INTO audit_metadata (audit_log_id, meta_key, meta_value) VALUES (?, ?, ?)`,
          [auditLogId, key, value],
        );
      }
    }
    return auditLogId;
  }

  async findAll(query: AuditListQueryDto) {
    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];
    this.buildAuditFilters(query, conditions, params);
    const where = `WHERE ${conditions.join(' AND ')}`;
    const offset = (query.page - 1) * query.pageSize;
    const sortCol = ['created_at', 'risk_level', 'module'].includes(query.sortBy) ? query.sortBy : 'created_at';
    const order = query.sortOrder === 'asc' ? 'ASC' : 'DESC';

    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM audit_logs ${where}`, params);
    const total = Number(countRows[0]?.total ?? 0);

    const [rows] = await this.pool.query<Row[]>(
      `SELECT * FROM audit_logs ${where} ORDER BY ${sortCol} ${order} LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows.map(mapAuditLog), total, page: query.page, pageSize: query.pageSize };
  }

  async findById(id: number) {
    const orgId = getOrganizationId();
    const orgClause = orgId ? ' AND organization_id = ?' : '';
    const params: unknown[] = [id];
    if (orgId) params.push(orgId);
    const [rows] = await this.pool.query<Row[]>(`SELECT * FROM audit_logs WHERE id = ?${orgClause}`, params);
    if (!rows[0]) return null;
    const log = mapAuditLog(rows[0]);
    const [metaRows] = await this.pool.query<Row[]>(
      `SELECT meta_key, meta_value FROM audit_metadata WHERE audit_log_id = ?`, [id],
    );
    const metadata = metaRows.map((r) => ({ key: r['meta_key'] as string, value: r['meta_value'] as string }));
    return { ...log, metadata };
  }

  async findForExport(query: AuditExportQueryDto) {
    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];
    this.buildAuditFilters(query, conditions, params);
    const where = `WHERE ${conditions.join(' AND ')}`;
    const [rows] = await this.pool.query<Row[]>(
      `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT 10000`, params,
    );
    return rows.map(mapAuditLog);
  }

  async getCategories() {
    const [rows] = await this.pool.query<Row[]>(
      `SELECT * FROM audit_categories WHERE is_active = 1 ORDER BY sort_order, name`,
    );
    return rows.map((r) => ({
      id: r['id'] as number, code: r['code'] as string, name: r['name'] as string,
      description: r['description'] as string | null, icon: r['icon'] as string | null,
    }));
  }

  async getActions(categoryCode?: string) {
    const conditions = ['is_active = 1'];
    const params: unknown[] = [];
    if (categoryCode) { conditions.push('category_code = ?'); params.push(categoryCode); }
    const [rows] = await this.pool.query<Row[]>(
      `SELECT * FROM audit_actions WHERE ${conditions.join(' AND ')} ORDER BY name`, params,
    );
    return rows.map((r) => ({
      id: r['id'] as number, code: r['code'] as string, name: r['name'] as string,
      categoryCode: r['category_code'] as string, riskLevel: r['risk_level'] as string,
    }));
  }

  async getStats() {
    const orgId = getOrganizationId();
    const orgClause = orgId ? ' AND organization_id = ?' : '';
    const orgParams = orgId ? [orgId] : [];
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN risk_level = 'critical' AND created_at >= DATE_SUB(NOW(6), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) AS critical24h,
         SUM(CASE WHEN created_at >= DATE_SUB(NOW(6), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) AS recent24h
       FROM audit_logs WHERE 1=1${orgClause}`,
      orgParams,
    );
    const total = Number(rows[0]?.total ?? 0);
    const critical24h = Number(rows[0]?.critical24h ?? 0);
    const recent24h = Number(rows[0]?.recent24h ?? 0);
    const riskScore = Math.max(0, Math.min(100, 100 - critical24h * 15 - Math.floor(recent24h / 10)));
    return { total, critical24h, recent24h, riskScore };
  }

  async findApiLogs(query: ApiLogListQueryDto) {
    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) {
      conditions.push(`(user_id IS NULL OR user_id IN (
        SELECT om.user_id FROM organization_members om
        WHERE om.organization_id = ? AND om.status = 'active'
      ))`);
      params.push(orgId);
    }
    if (query.search) {
      conditions.push('(path LIKE ? OR ip_address LIKE ?)');
      const term = `%${query.search}%`;
      params.push(term, term);
    }
    if (query.method) { conditions.push('method = ?'); params.push(query.method.toUpperCase()); }
    if (query.statusCode) { conditions.push('status_code = ?'); params.push(query.statusCode); }
    if (query.userId) { conditions.push('user_id = ?'); params.push(query.userId); }
    if (query.dateFrom) { conditions.push('DATE(created_at) >= ?'); params.push(query.dateFrom); }
    if (query.dateTo) { conditions.push('DATE(created_at) <= ?'); params.push(query.dateTo); }
    applyDateRange(query.dateRange, conditions, params);
    const where = `WHERE ${conditions.join(' AND ')}`;
    const offset = (query.page - 1) * query.pageSize;

    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM api_logs ${where}`, params);
    const total = Number(countRows[0]?.total ?? 0);
    const [rows] = await this.pool.query<Row[]>(
      `SELECT * FROM api_logs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return {
      items: rows.map((r) => ({
        id: r['id'] as number, uuid: r['uuid'] as string, correlationId: r['correlation_id'] as string | null,
        userId: r['user_id'] as number | null, method: r['method'] as string, path: r['path'] as string,
        statusCode: r['status_code'] as number, ipAddress: r['ip_address'] as string | null,
        responseTimeMs: r['response_time_ms'] as number | null, createdAt: r['created_at'] as string,
      })),
      total, page: query.page, pageSize: query.pageSize,
    };
  }

  async findWebhookLogs(query: WebhookLogListQueryDto) {
    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) {
      conditions.push(`url IN (
        SELECT mw.url FROM merchant_webhooks mw
        JOIN merchants m ON m.id = mw.merchant_id
        WHERE m.organization_id = ? AND mw.deleted_at IS NULL
      )`);
      params.push(orgId);
    }
    if (query.search) {
      conditions.push('(event_type LIKE ? OR url LIKE ?)');
      const term = `%${query.search}%`;
      params.push(term, term);
    }
    if (query.eventType) { conditions.push('event_type = ?'); params.push(query.eventType); }
    if (query.status) { conditions.push('status = ?'); params.push(query.status); }
    if (query.dateFrom) { conditions.push('DATE(created_at) >= ?'); params.push(query.dateFrom); }
    if (query.dateTo) { conditions.push('DATE(created_at) <= ?'); params.push(query.dateTo); }
    applyDateRange(query.dateRange, conditions, params);
    const where = `WHERE ${conditions.join(' AND ')}`;
    const offset = (query.page - 1) * query.pageSize;

    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM webhook_logs ${where}`, params);
    const total = Number(countRows[0]?.total ?? 0);
    const [rows] = await this.pool.query<Row[]>(
      `SELECT * FROM webhook_logs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return {
      items: rows.map((r) => ({
        id: r['id'] as number, uuid: r['uuid'] as string, correlationId: r['correlation_id'] as string | null,
        eventType: r['event_type'] as string, url: r['url'] as string, status: r['status'] as string,
        statusCode: r['status_code'] as number | null, attemptCount: r['attempt_count'] as number,
        deliveredAt: r['delivered_at'] as string | null, createdAt: r['created_at'] as string,
      })),
      total, page: query.page, pageSize: query.pageSize,
    };
  }

  async logApi(data: {
    correlationId?: string; userId?: number; method: string; path: string;
    statusCode: number; ipAddress?: string; userAgent?: string;
    requestBody?: Record<string, unknown>; responseTimeMs?: number; errorMessage?: string;
  }): Promise<void> {
    await this.pool.query(
      `INSERT INTO api_logs (uuid, correlation_id, user_id, method, path, status_code, ip_address, user_agent, request_body, response_time_ms, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(), data.correlationId ?? null, data.userId ?? null,
        data.method.toUpperCase(), data.path, data.statusCode,
        data.ipAddress ?? null, data.userAgent ?? null,
        data.requestBody ? JSON.stringify(data.requestBody) : null,
        data.responseTimeMs ?? null, data.errorMessage ?? null,
      ],
    );
  }

  private buildAuditFilters(query: AuditListQueryDto | AuditExportQueryDto, conditions: string[], params: unknown[]): void {
    const orgId = getOrganizationId();
    if (orgId) {
      conditions.push('organization_id = ?');
      params.push(orgId);
    }
    if (query.search) {
      conditions.push('(description LIKE ? OR actor_name LIKE ? OR entity_id LIKE ? OR ip_address LIKE ?)');
      const term = `%${query.search}%`;
      params.push(term, term, term, term);
    }
    if (query.module) { conditions.push('module = ?'); params.push(query.module); }
    if (query.categoryCode) { conditions.push('category_code = ?'); params.push(query.categoryCode); }
    if (query.actionCode) { conditions.push('action_code = ?'); params.push(query.actionCode); }
    if (query.userId) { conditions.push('user_id = ?'); params.push(query.userId); }
    if (query.entityType) { conditions.push('entity_type = ?'); params.push(query.entityType); }
    if (query.entityId) { conditions.push('entity_id = ?'); params.push(query.entityId); }
    if (query.riskLevel) { conditions.push('risk_level = ?'); params.push(query.riskLevel); }
    if (query.dateFrom) { conditions.push('created_at >= ?'); params.push(`${query.dateFrom} 00:00:00`); }
    if (query.dateTo) { conditions.push('created_at < DATE_ADD(?, INTERVAL 1 DAY)'); params.push(query.dateTo); }
    applyDateRange(query.dateRange, conditions, params);
  }
}
