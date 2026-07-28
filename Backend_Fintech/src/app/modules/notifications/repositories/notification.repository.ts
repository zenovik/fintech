import { randomUUID } from 'node:crypto';
import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';
import {
  BroadcastListQueryDto,
  CreateBroadcastBodyDto,
  CreateTemplateBodyDto,
  DispatchNotificationDto,
  NotificationListQueryDto,
  TemplateListQueryDto,
  UpdateTemplateBodyDto,
} from '../dto';
import { NotificationCategory, NotificationStatus } from '../constants/notifications.constants';
import { mapEventCodeToNotificationPreferenceType } from '../../../shared/helpers/notification-preference.helper';

type Row = RowDataPacket & Record<string, unknown>;

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function mapNotification(row: Row) {
  return {
    id: row['id'] as number,
    uuid: row['uuid'] as string,
    userId: row['user_id'] as number,
    eventCode: row['event_code'] as string,
    category: row['category'] as NotificationCategory,
    title: row['title'] as string,
    body: row['body'] as string,
    priority: row['priority'] as string,
    status: row['status'] as NotificationStatus,
    icon: row['icon'] as string | null,
    actionUrl: row['action_url'] as string | null,
    actionLabel: row['action_label'] as string | null,
    metadata: parseJson<Record<string, unknown>>(row['metadata_json'], {}),
    relatedEntityType: row['related_entity_type'] as string | null,
    relatedEntityId: row['related_entity_id'] as number | null,
    groupId: row['group_id'] as number | null,
    broadcastId: row['broadcast_id'] as string | null,
    readAt: row['read_at'] as string | null,
    archivedAt: row['archived_at'] as string | null,
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
  };
}

function mapTemplate(row: Row) {
  return {
    id: row['id'] as number,
    uuid: row['uuid'] as string,
    code: row['code'] as string,
    name: row['name'] as string,
    eventCode: row['event_code'] as string,
    channel: row['channel'] as string,
    subject: row['subject'] as string | null,
    bodyTemplate: row['body_template'] as string,
    category: row['category'] as string,
    isActive: Boolean(row['is_active']),
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
  };
}

function mapChannel(row: Row) {
  return {
    id: row['id'] as number,
    uuid: row['uuid'] as string,
    code: row['code'] as string,
    name: row['name'] as string,
    description: row['description'] as string | null,
    isEnabled: Boolean(row['is_enabled']),
  };
}

function mapEvent(row: Row) {
  return {
    id: row['id'] as number,
    uuid: row['uuid'] as string,
    code: row['code'] as string,
    name: row['name'] as string,
    category: row['category'] as string,
    description: row['description'] as string | null,
    isEnabled: Boolean(row['is_enabled']),
  };
}

function mapGroup(row: Row) {
  return {
    id: row['id'] as number,
    uuid: row['uuid'] as string,
    code: row['code'] as string,
    name: row['name'] as string,
    description: row['description'] as string | null,
    isSystem: Boolean(row['is_system']),
  };
}

export class NotificationRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async findByUser(userId: number, query: NotificationListQueryDto) {
    const { page, pageSize, search, status, category, categories, priority, dateFrom, dateTo, sortBy, sortOrder } = query;
    const conditions = ['n.user_id = ?', 'n.deleted_at IS NULL'];
    const params: unknown[] = [userId];

    if (search) {
      conditions.push('(n.title LIKE ? OR n.body LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term);
    }
    if (status) {
      conditions.push('n.status = ?');
      params.push(status);
    }
    if (category) {
      conditions.push('n.category = ?');
      params.push(category);
    }
    if (categories) {
      const cats = categories.split(',').filter(Boolean);
      if (cats.length) {
        conditions.push(`n.category IN (${cats.map(() => '?').join(',')})`);
        params.push(...cats);
      }
    }
    if (priority) {
      conditions.push('n.priority = ?');
      params.push(priority);
    }
    if (dateFrom) {
      conditions.push('DATE(n.created_at) >= ?');
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push('DATE(n.created_at) <= ?');
      params.push(dateTo);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const allowedSort = ['created_at', 'priority', 'title'];
    const sortCol = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const offset = (page - 1) * pageSize;

    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM notifications n ${where}`,
      params,
    );
    const total = Number(countRows[0]?.total ?? 0);

    const [rows] = await this.pool.query<Row[]>(
      `SELECT n.* FROM notifications n ${where} ORDER BY n.${sortCol} ${order} LIMIT ? OFFSET ?`,
      [...params, pageSize, offset],
    );

    return { items: rows.map(mapNotification), total, page, pageSize };
  }

  async findByIdForUser(id: number, userId: number) {
    const [rows] = await this.pool.query<Row[]>(
      `SELECT n.* FROM notifications n WHERE n.id = ? AND n.user_id = ? AND n.deleted_at IS NULL`,
      [id, userId],
    );
    return rows[0] ? mapNotification(rows[0]) : null;
  }

  async hasEventNotification(userId: number, eventCode: string): Promise<boolean> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT 1 FROM notifications WHERE user_id = ? AND event_code = ? AND deleted_at IS NULL LIMIT 1`,
      [userId, eventCode],
    );
    return rows.length > 0;
  }

  async getUnreadCount(userId: number): Promise<number> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = ? AND status = 'unread' AND deleted_at IS NULL`,
      [userId],
    );
    return Number(rows[0]?.cnt ?? 0);
  }

  async getStatusCounts(userId: number) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT status, COUNT(*) AS cnt FROM notifications WHERE user_id = ? AND deleted_at IS NULL GROUP BY status`,
      [userId],
    );
    const counts = { all: 0, unread: 0, read: 0, archived: 0 };
    for (const row of rows) {
      const status = row['status'] as string;
      const cnt = Number(row['cnt']);
      counts.all += cnt;
      if (status in counts) counts[status as keyof typeof counts] = cnt;
    }
    return counts;
  }

  async markRead(id: number, userId: number): Promise<boolean> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `UPDATE notifications SET status = 'read', read_at = NOW(6) WHERE id = ? AND user_id = ? AND status = 'unread' AND deleted_at IS NULL`,
      [id, userId],
    );
    return result.affectedRows > 0;
  }

  async markAllRead(userId: number): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `UPDATE notifications SET status = 'read', read_at = NOW(6) WHERE user_id = ? AND status = 'unread' AND deleted_at IS NULL`,
      [userId],
    );
    return result.affectedRows;
  }

  async archive(id: number, userId: number): Promise<boolean> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `UPDATE notifications SET status = 'archived', archived_at = NOW(6) WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      [id, userId],
    );
    return result.affectedRows > 0;
  }

  async archiveAll(userId: number): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `UPDATE notifications SET status = 'archived', archived_at = NOW(6) WHERE user_id = ? AND status != 'archived' AND deleted_at IS NULL`,
      [userId],
    );
    return result.affectedRows;
  }

  async softDelete(id: number, userId: number): Promise<boolean> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `UPDATE notifications SET deleted_at = NOW(6) WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      [id, userId],
    );
    return result.affectedRows > 0;
  }

  async createNotification(dto: DispatchNotificationDto & { title: string; body: string; category: NotificationCategory; broadcastId?: string }) {
    const uuid = randomUUID();
    const broadcastId = dto.broadcastId ?? (dto.metadata as Record<string, unknown> | undefined)?.broadcastId as string | undefined ?? null;
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO notifications (uuid, user_id, event_code, category, title, body, priority, status, icon, action_url, action_label, metadata_json, related_entity_type, related_entity_id, broadcast_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'unread', ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuid,
        dto.userId,
        dto.eventCode,
        dto.category,
        dto.title,
        dto.body,
        dto.priority ?? 'normal',
        dto.icon ?? null,
        dto.actionUrl ?? null,
        dto.actionLabel ?? null,
        dto.metadata ? JSON.stringify(dto.metadata) : null,
        dto.relatedEntityType ?? null,
        dto.relatedEntityId ?? null,
        broadcastId,
      ],
    );
    const notificationId = result.insertId;
    await this.pool.query(
      `INSERT INTO notification_deliveries (uuid, notification_id, user_id, channel, status, delivered_at)
       VALUES (?, ?, ?, 'in_app', 'delivered', NOW(6))`,
      [randomUUID(), notificationId, dto.userId],
    );

    if (await this.isEmailNotificationEnabled(dto.userId, dto.eventCode)) {
      await this.pool.query(
        `INSERT INTO notification_deliveries (uuid, notification_id, user_id, channel, status)
         VALUES (?, ?, ?, 'email', 'pending')`,
        [randomUUID(), notificationId, dto.userId],
      );
    }

    return this.findByIdForUser(notificationId, dto.userId);
  }

  private async isEmailNotificationEnabled(userId: number, eventCode: string): Promise<boolean> {
    const notificationType = mapEventCodeToNotificationPreferenceType(eventCode);
    const [userPrefs] = await this.pool.query<RowDataPacket[]>(
      `SELECT is_enabled FROM notification_preferences
       WHERE user_id = ? AND notification_type = ? AND channel = 'email' LIMIT 1`,
      [userId, notificationType],
    );
    if (userPrefs[0]) return Boolean(userPrefs[0].is_enabled);

    const [defaults] = await this.pool.query<RowDataPacket[]>(
      `SELECT is_enabled FROM notification_preferences
       WHERE user_id IS NULL AND notification_type = ? AND channel = 'email' LIMIT 1`,
      [notificationType],
    );
    if (defaults[0]) return Boolean(defaults[0].is_enabled);
    return true;
  }

  async findTemplates(query: TemplateListQueryDto) {
    const { page, pageSize, search, eventCode, channel, category, isActive } = query;
    const conditions = ['t.deleted_at IS NULL'];
    const params: unknown[] = [];

    if (search) {
      conditions.push('(t.name LIKE ? OR t.code LIKE ? OR t.event_code LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    if (eventCode) {
      conditions.push('t.event_code = ?');
      params.push(eventCode);
    }
    if (channel) {
      conditions.push('t.channel = ?');
      params.push(channel);
    }
    if (category) {
      conditions.push('t.category = ?');
      params.push(category);
    }
    if (isActive !== undefined) {
      conditions.push('t.is_active = ?');
      params.push(isActive ? 1 : 0);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const offset = (page - 1) * pageSize;

    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM notification_templates t ${where}`,
      params,
    );
    const total = Number(countRows[0]?.total ?? 0);

    const [rows] = await this.pool.query<Row[]>(
      `SELECT t.* FROM notification_templates t ${where} ORDER BY t.updated_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset],
    );

    return { items: rows.map(mapTemplate), total, page, pageSize };
  }

  async findTemplateById(id: number) {
    const [rows] = await this.pool.query<Row[]>(
      `SELECT t.* FROM notification_templates t WHERE t.id = ? AND t.deleted_at IS NULL`,
      [id],
    );
    return rows[0] ? mapTemplate(rows[0]) : null;
  }

  async createTemplate(dto: CreateTemplateBodyDto, userId?: number) {
    const uuid = randomUUID();
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO notification_templates (uuid, code, name, event_code, channel, subject, body_template, category, is_active, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuid, dto.code, dto.name, dto.eventCode, dto.channel, dto.subject ?? null, dto.bodyTemplate, dto.category, dto.isActive ? 1 : 0, userId ?? null, userId ?? null],
    );
    return this.findTemplateById(result.insertId);
  }

  async updateTemplate(id: number, dto: UpdateTemplateBodyDto, userId?: number) {
    const fields: string[] = [];
    const params: unknown[] = [];

    if (dto.name !== undefined) { fields.push('name = ?'); params.push(dto.name); }
    if (dto.eventCode !== undefined) { fields.push('event_code = ?'); params.push(dto.eventCode); }
    if (dto.channel !== undefined) { fields.push('channel = ?'); params.push(dto.channel); }
    if (dto.subject !== undefined) { fields.push('subject = ?'); params.push(dto.subject); }
    if (dto.bodyTemplate !== undefined) { fields.push('body_template = ?'); params.push(dto.bodyTemplate); }
    if (dto.category !== undefined) { fields.push('category = ?'); params.push(dto.category); }
    if (dto.isActive !== undefined) { fields.push('is_active = ?'); params.push(dto.isActive ? 1 : 0); }
    if (userId) { fields.push('updated_by = ?'); params.push(userId); }

    if (!fields.length) return this.findTemplateById(id);

    params.push(id);
    await this.pool.query(`UPDATE notification_templates SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`, params);
    return this.findTemplateById(id);
  }

  async deleteTemplate(id: number): Promise<boolean> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `UPDATE notification_templates SET deleted_at = NOW(6) WHERE id = ? AND deleted_at IS NULL`,
      [id],
    );
    return result.affectedRows > 0;
  }

  async findBroadcasts(query: BroadcastListQueryDto) {
    const { page, pageSize, search } = query;
    const conditions = ['n.broadcast_id IS NOT NULL', 'n.deleted_at IS NULL'];
    const params: unknown[] = [];

    if (search) {
      conditions.push('(n.title LIKE ? OR n.body LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const offset = (page - 1) * pageSize;

    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT n.broadcast_id) AS total FROM notifications n ${where}`,
      params,
    );
    const total = Number(countRows[0]?.total ?? 0);

    const [rows] = await this.pool.query<Row[]>(
      `SELECT n.broadcast_id, MIN(n.title) AS title, MIN(n.body) AS body, MIN(n.priority) AS priority,
              MIN(n.category) AS category, MIN(n.created_at) AS created_at,
              COUNT(DISTINCT n.user_id) AS recipient_count
       FROM notifications n ${where}
       GROUP BY n.broadcast_id
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset],
    );

    return {
      items: rows.map((r) => ({
        broadcastId: r['broadcast_id'] as string,
        title: r['title'] as string,
        body: r['body'] as string,
        priority: r['priority'] as string,
        category: r['category'] as string,
        recipientCount: Number(r['recipient_count']),
        createdAt: r['created_at'] as string,
      })),
      total,
      page,
      pageSize,
    };
  }

  async getUserIdsForGroup(groupCode: string): Promise<number[]> {
    if (groupCode === 'all_users') {
      const [rows] = await this.pool.query<RowDataPacket[]>(
        `SELECT id FROM users WHERE deleted_at IS NULL AND status = 'active'`,
      );
      return rows.map((r) => Number(r['id']));
    }
    if (groupCode === 'admins') {
      const [rows] = await this.pool.query<RowDataPacket[]>(
        `SELECT DISTINCT ur.user_id AS id FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
         WHERE r.code IN ('super_admin', 'admin')`,
      );
      return rows.map((r) => Number(r['id']));
    }
    if (groupCode === 'operations') {
      const [rows] = await this.pool.query<RowDataPacket[]>(
        `SELECT DISTINCT ur.user_id AS id FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
         WHERE r.code = 'operations_manager'`,
      );
      return rows.map((r) => Number(r['id']));
    }
    return [];
  }

  async getChannels() {
    const [rows] = await this.pool.query<Row[]>(`SELECT * FROM notification_channels ORDER BY id`);
    return rows.map(mapChannel);
  }

  async getEvents() {
    const [rows] = await this.pool.query<Row[]>(`SELECT * FROM notification_events WHERE is_enabled = 1 ORDER BY name`);
    return rows.map(mapEvent);
  }

  async getGroups() {
    const [rows] = await this.pool.query<Row[]>(`SELECT * FROM notification_groups WHERE deleted_at IS NULL ORDER BY name`);
    return rows.map(mapGroup);
  }

  async getDeliveriesForNotification(notificationId: number) {
    const [rows] = await this.pool.query<Row[]>(
      `SELECT d.* FROM notification_deliveries d WHERE d.notification_id = ? ORDER BY d.created_at`,
      [notificationId],
    );
    return rows.map((r) => ({
      id: r['id'] as number,
      uuid: r['uuid'] as string,
      channel: r['channel'] as string,
      status: r['status'] as string,
      errorMessage: r['error_message'] as string | null,
      sentAt: r['sent_at'] as string | null,
      deliveredAt: r['delivered_at'] as string | null,
      createdAt: r['created_at'] as string,
    }));
  }

  async listCampaigns(query: { page: number; pageSize: number; status?: string }) {
    const orgId = getOrganizationId();
    const conditions = ['1=1'];
    const params: unknown[] = [];
    if (orgId) { conditions.push('organization_id = ?'); params.push(orgId); }
    if (query.status) { conditions.push('status = ?'); params.push(query.status); }
    const where = conditions.join(' AND ');
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<Row[]>(`SELECT COUNT(*) AS total FROM communication_campaigns WHERE ${where}`, params);
    const [rows] = await this.pool.query<Row[]>(
      `SELECT * FROM communication_campaigns WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.['total'] ?? 0) };
  }

  async findCampaign(id: number) {
    const orgId = getOrganizationId();
    const params: unknown[] = [id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND organization_id = ?'; params.push(orgId); }
    const [rows] = await this.pool.query<Row[]>(`SELECT * FROM communication_campaigns WHERE id = ?${orgClause}`, params);
    return rows[0] ?? null;
  }

  async createCampaign(data: Record<string, unknown>, orgId: number, userId?: number) {
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO communication_campaigns (uuid, organization_id, name, channel, template_id, status, scheduled_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), orgId, data.name, data.channel, data.templateId ?? null, data.status ?? 'draft', data.scheduledAt ?? null, userId ?? null],
    );
    return result.insertId;
  }

  async updateCampaign(id: number, data: Record<string, unknown>) {
    const orgId = getOrganizationId();
    const params: unknown[] = [data.name, data.channel, data.templateId ?? null, data.status, data.scheduledAt ?? null, id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND organization_id = ?'; params.push(orgId); }
    await this.pool.query(
      `UPDATE communication_campaigns SET name = ?, channel = ?, template_id = ?, status = ?, scheduled_at = ? WHERE id = ?${orgClause}`, params,
    );
  }

  async deleteCampaign(id: number) {
    const orgId = getOrganizationId();
    const params: unknown[] = [id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND organization_id = ?'; params.push(orgId); }
    await this.pool.query(`DELETE FROM communication_campaigns WHERE id = ?${orgClause}`, params);
  }

  async getTemplateVariables(templateId: number) {
    const [rows] = await this.pool.query<Row[]>(
      `SELECT variables_json FROM notification_templates WHERE id = ? AND deleted_at IS NULL`, [templateId],
    );
    const raw = rows[0]?.['variables_json'];
    if (!raw) return [];
    return typeof raw === 'string' ? JSON.parse(raw as string) : raw;
  }
}
