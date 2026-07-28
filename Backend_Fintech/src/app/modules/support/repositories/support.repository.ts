import { randomUUID } from 'crypto';
import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';
import {
  AddAttachmentBodyDto, AddNoteBodyDto, CreateTicketBodyDto, TicketListQueryDto, UpdateTicketBodyDto,
} from '../dto';
import { computeSlaDueAt, formatDateTime, TicketPriority } from '../constants/support.constants';

export type TicketRow = RowDataPacket & {
  id: number; uuid: string; organization_id: number; merchant_id: number | null; customer_id: number | null;
  ticket_ref: string; subject: string; description: string; category: string; status: string; priority: string;
  sla_due_at: string | null; sla_breached: number; assigned_to: number | null; escalated_at: string | null;
  escalated_to: number | null; escalation_level: number; related_entity_type: string | null;
  related_entity_id: string | null; resolved_at: string | null; closed_at: string | null;
  created_by: number | null; updated_by: number | null; created_at: string; updated_at: string;
  organization_name?: string; merchant_name?: string; customer_name?: string;
  assignee_name?: string; created_by_name?: string;
};

export class SupportRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  private baseSelect = `
    SELECT t.*,
           o.display_name AS organization_name,
           m.display_name AS merchant_name,
           c.display_name AS customer_name,
           CONCAT(a.first_name, ' ', a.last_name) AS assignee_name,
           CONCAT(cb.first_name, ' ', cb.last_name) AS created_by_name
    FROM support_tickets t
    JOIN organizations o ON o.id = t.organization_id
    LEFT JOIN merchants m ON m.id = t.merchant_id
    LEFT JOIN customers c ON c.id = t.customer_id
    LEFT JOIN users a ON a.id = t.assigned_to
    LEFT JOIN users cb ON cb.id = t.created_by
  `;

  generateTicketRef(): string {
    return `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  async validateMerchantInOrg(merchantId: number, orgId: number): Promise<boolean> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT 1 FROM merchants WHERE id = ? AND organization_id = ? AND deleted_at IS NULL LIMIT 1',
      [merchantId, orgId],
    );
    return rows.length > 0;
  }

  async validateCustomerInOrg(customerId: number, orgId: number): Promise<boolean> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT 1 FROM customers WHERE id = ? AND organization_id = ? AND deleted_at IS NULL LIMIT 1',
      [customerId, orgId],
    );
    return rows.length > 0;
  }

  async findAll(query: TicketListQueryDto): Promise<{ items: TicketRow[]; total: number }> {
    const { page, pageSize, search, status, priority, assignedTo, merchantId, customerId, slaBreached, sortBy, sortOrder } = query;
    const conditions = ['t.deleted_at IS NULL'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('t.organization_id = ?'); params.push(orgId); }
    if (search) {
      conditions.push('(t.ticket_ref LIKE ? OR t.subject LIKE ? OR t.description LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    if (status) { conditions.push('t.status = ?'); params.push(status); }
    if (priority) { conditions.push('t.priority = ?'); params.push(priority); }
    if (assignedTo) { conditions.push('t.assigned_to = ?'); params.push(assignedTo); }
    if (merchantId) { conditions.push('t.merchant_id = ?'); params.push(merchantId); }
    if (customerId) { conditions.push('t.customer_id = ?'); params.push(customerId); }
    if (slaBreached === true) { conditions.push('t.sla_breached = 1'); }
    const where = `WHERE ${conditions.join(' AND ')}`;
    const sortCol = ['created_at', 'priority', 'sla_due_at', 'status'].includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const offset = (page - 1) * pageSize;

    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM support_tickets t ${where}`, params);
    const total = Number(countRows[0]?.total ?? 0);
    const [rows] = await this.pool.query<TicketRow[]>(
      `${this.baseSelect} ${where} ORDER BY t.${sortCol} ${order} LIMIT ? OFFSET ?`,
      [...params, pageSize, offset],
    );
    return { items: rows, total };
  }

  async getStatistics() {
    const orgId = getOrganizationId();
    const orgClause = orgId ? ' AND organization_id = ?' : '';
    const params = orgId ? [orgId] : [];
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status IN ('open','assigned','in_progress','waiting_customer') THEN 1 ELSE 0 END) AS open_count,
              SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved_count,
              SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) AS closed_count,
              SUM(CASE WHEN sla_breached = 1 AND status NOT IN ('closed','cancelled','resolved') THEN 1 ELSE 0 END) AS sla_breached_count,
              AVG(CASE WHEN resolved_at IS NOT NULL THEN TIMESTAMPDIFF(HOUR, created_at, resolved_at) END) AS avg_resolution_hours,
              SUM(CASE WHEN sla_breached = 0 AND resolved_at IS NOT NULL THEN 1
                       WHEN sla_breached = 0 AND status IN ('open','assigned','in_progress','waiting_customer') AND sla_due_at > NOW() THEN 1
                       ELSE 0 END) AS sla_compliant_count,
              SUM(CASE WHEN resolved_at IS NOT NULL OR status IN ('closed','cancelled') THEN 1 ELSE 0 END) AS closed_or_resolved_count
       FROM support_tickets WHERE deleted_at IS NULL${orgClause}`, params,
    );
    return rows[0];
  }

  async findById(id: number): Promise<TicketRow | null> {
    const orgId = getOrganizationId();
    const orgClause = orgId ? ' AND t.organization_id = ?' : '';
    const params: unknown[] = [id];
    if (orgId) params.push(orgId);
    const [rows] = await this.pool.query<TicketRow[]>(
      `${this.baseSelect} WHERE t.id = ? AND t.deleted_at IS NULL${orgClause} LIMIT 1`, params,
    );
    return rows[0] ?? null;
  }

  async create(dto: CreateTicketBodyDto, organizationId: number, actorId?: number): Promise<number> {
    const priority = (dto.priority ?? 'medium') as TicketPriority;
    const slaDue = formatDateTime(computeSlaDueAt(priority));
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO support_tickets (uuid, organization_id, merchant_id, customer_id, ticket_ref, subject, description,
        category, priority, sla_due_at, related_entity_type, related_entity_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), organizationId, dto.merchantId ?? null, dto.customerId ?? null, this.generateTicketRef(),
        dto.subject, dto.description, dto.category ?? 'general', priority, slaDue,
        dto.relatedEntityType ?? null, dto.relatedEntityId ?? null, actorId ?? null],
    );
    const id = result.insertId;
    await this.addActivity(id, 'created', 'Ticket created', actorId, { priority });
    return id;
  }

  async update(id: number, dto: UpdateTicketBodyDto, actorId?: number): Promise<void> {
    const fields: string[] = [];
    const params: unknown[] = [];
    if (dto.subject != null) { fields.push('subject = ?'); params.push(dto.subject); }
    if (dto.description != null) { fields.push('description = ?'); params.push(dto.description); }
    if (dto.category != null) { fields.push('category = ?'); params.push(dto.category); }
    if (dto.priority != null) {
      fields.push('priority = ?', 'sla_due_at = ?');
      params.push(dto.priority, formatDateTime(computeSlaDueAt(dto.priority as TicketPriority)));
    }
    if (dto.status != null) { fields.push('status = ?'); params.push(dto.status); }
    if (dto.relatedEntityType != null) { fields.push('related_entity_type = ?'); params.push(dto.relatedEntityType); }
    if (dto.relatedEntityId != null) { fields.push('related_entity_id = ?'); params.push(dto.relatedEntityId); }
    if (!fields.length) return;
    fields.push('updated_by = ?');
    params.push(actorId ?? null, id);
    await this.pool.query(`UPDATE support_tickets SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`, params);
    await this.addActivity(id, 'updated', 'Ticket updated', actorId);
  }

  async assign(id: number, assigneeId: number, actorId?: number): Promise<void> {
    await this.pool.query(
      `UPDATE support_tickets SET assigned_to = ?, status = 'assigned', updated_by = ? WHERE id = ? AND deleted_at IS NULL`,
      [assigneeId, actorId ?? null, id],
    );
    await this.addActivity(id, 'assigned', `Ticket assigned to user #${assigneeId}`, actorId, { assigneeId });
  }

  async escalate(id: number, assigneeId: number | null, actorId?: number, reason?: string): Promise<void> {
    await this.pool.query(
      `UPDATE support_tickets SET escalated_at = NOW(), escalated_to = ?, escalation_level = escalation_level + 1,
        assigned_to = COALESCE(?, assigned_to), priority = CASE WHEN priority = 'low' THEN 'medium' WHEN priority = 'medium' THEN 'high' ELSE priority END,
        updated_by = ? WHERE id = ? AND deleted_at IS NULL`,
      [assigneeId, assigneeId, actorId ?? null, id],
    );
    await this.addActivity(id, 'escalated', reason ?? 'Ticket escalated', actorId, { assigneeId });
  }

  async close(id: number, actorId?: number): Promise<void> {
    await this.pool.query(
      `UPDATE support_tickets SET status = 'closed', closed_at = NOW(), updated_by = ? WHERE id = ? AND deleted_at IS NULL`,
      [actorId ?? null, id],
    );
    await this.addActivity(id, 'closed', 'Ticket closed', actorId);
  }

  async reopen(id: number, actorId?: number): Promise<void> {
    await this.pool.query(
      `UPDATE support_tickets SET status = 'open', closed_at = NULL, resolved_at = NULL, updated_by = ? WHERE id = ? AND deleted_at IS NULL`,
      [actorId ?? null, id],
    );
    await this.addActivity(id, 'reopened', 'Ticket reopened', actorId);
  }

  async resolve(id: number, actorId?: number): Promise<void> {
    await this.pool.query(
      `UPDATE support_tickets SET status = 'resolved', resolved_at = NOW(), updated_by = ? WHERE id = ? AND deleted_at IS NULL`,
      [actorId ?? null, id],
    );
    await this.addActivity(id, 'resolved', 'Ticket resolved', actorId);
  }

  async addNote(ticketId: number, dto: AddNoteBodyDto, authorId?: number): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      'INSERT INTO support_ticket_notes (ticket_id, author_id, body, is_internal) VALUES (?, ?, ?, ?)',
      [ticketId, authorId ?? null, dto.body, dto.isInternal ? 1 : 0],
    );
    await this.addActivity(ticketId, 'note_added', dto.isInternal ? 'Internal note added' : 'Note added', authorId);
    return result.insertId;
  }

  async addAttachment(ticketId: number, dto: AddAttachmentBodyDto, uploadedBy?: number): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO support_ticket_attachments (ticket_id, file_name, mime_type, file_size, storage_path, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ticketId, dto.fileName, dto.mimeType, dto.fileSize, dto.storagePath ?? null, uploadedBy ?? null],
    );
    await this.addActivity(ticketId, 'attachment_added', `Attachment added: ${dto.fileName}`, uploadedBy);
    return result.insertId;
  }

  async getNotes(ticketId: number) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT n.*, CONCAT(u.first_name, ' ', u.last_name) AS author_name
       FROM support_ticket_notes n LEFT JOIN users u ON u.id = n.author_id
       WHERE n.ticket_id = ? ORDER BY n.created_at ASC`, [ticketId],
    );
    return rows;
  }

  async getAttachments(ticketId: number) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT a.*, CONCAT(u.first_name, ' ', u.last_name) AS uploaded_by_name
       FROM support_ticket_attachments a LEFT JOIN users u ON u.id = a.uploaded_by
       WHERE a.ticket_id = ? ORDER BY a.created_at ASC`, [ticketId],
    );
    return rows;
  }

  async getActivities(ticketId: number) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT act.*, CONCAT(u.first_name, ' ', u.last_name) AS actor_name
       FROM support_ticket_activities act LEFT JOIN users u ON u.id = act.actor_id
       WHERE act.ticket_id = ? ORDER BY act.created_at ASC`, [ticketId],
    );
    return rows;
  }

  async addActivity(ticketId: number, activityType: string, summary: string, actorId?: number, metadata?: Record<string, unknown>): Promise<void> {
    await this.pool.query(
      'INSERT INTO support_ticket_activities (ticket_id, activity_type, summary, actor_id, metadata) VALUES (?, ?, ?, ?, ?)',
      [ticketId, activityType, summary, actorId ?? null, metadata ? JSON.stringify(metadata) : null],
    );
  }
}
