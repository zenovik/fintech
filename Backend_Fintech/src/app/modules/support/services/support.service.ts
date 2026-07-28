import { RowDataPacket } from 'mysql2/promise';
import { getOrganizationId } from '../../../shared/context/org-context';
import { NotFoundError, ValidationError } from '../../../shared/exceptions/app.exception';
import { auditRecorder } from '../../audit';
import { notificationDispatch } from '../../notifications';
import { SupportRepository, TicketRow } from '../repositories/support.repository';
import {
  AddAttachmentBodyDto, AddNoteBodyDto, AssignTicketBodyDto, CreateTicketBodyDto,
  EscalateTicketBodyDto, TicketListQueryDto, UpdateTicketBodyDto,
} from '../dto';

function mapTicket(row: TicketRow) {
  return {
    id: row.id, uuid: row.uuid, organizationId: row.organization_id,
    organizationName: row.organization_name ?? null, merchantId: row.merchant_id,
    merchantName: row.merchant_name ?? null, customerId: row.customer_id,
    customerName: row.customer_name ?? null, ticketRef: row.ticket_ref,
    subject: row.subject, description: row.description, category: row.category,
    status: row.status, priority: row.priority, slaDueAt: row.sla_due_at,
    slaBreached: Boolean(row.sla_breached), assignedTo: row.assigned_to,
    assigneeName: row.assignee_name ?? null, escalatedAt: row.escalated_at,
    escalatedTo: row.escalated_to, escalationLevel: row.escalation_level,
    relatedEntityType: row.related_entity_type, relatedEntityId: row.related_entity_id,
    resolvedAt: row.resolved_at, closedAt: row.closed_at,
    createdByName: row.created_by_name ?? null, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function mapNote(row: RowDataPacket) {
  return { id: row.id as number, body: row.body as string, isInternal: Boolean(row.is_internal), authorName: (row.author_name as string) ?? null, createdAt: row.created_at as string };
}

function mapAttachment(row: RowDataPacket) {
  return { id: row.id as number, fileName: row.file_name as string, mimeType: row.mime_type as string, fileSize: Number(row.file_size), storagePath: (row.storage_path as string) ?? null, uploadedByName: (row.uploaded_by_name as string) ?? null, createdAt: row.created_at as string };
}

function mapActivity(row: RowDataPacket) {
  return { id: row.id as number, activityType: row.activity_type as string, summary: row.summary as string, actorName: (row.actor_name as string) ?? null, metadata: row.metadata, createdAt: row.created_at as string };
}

export class SupportService {
  constructor(private readonly repo = new SupportRepository()) {}

  async list(query: TicketListQueryDto) {
    const { items, total } = await this.repo.findAll(query);
    const stats = await this.repo.getStatistics();
    const closedOrResolved = Number(stats?.closed_or_resolved_count ?? 0);
    const slaCompliant = Number(stats?.sla_compliant_count ?? 0);
    return {
      items: items.map(mapTicket),
      stats: {
        total: Number(stats?.total ?? 0), open: Number(stats?.open_count ?? 0),
        resolved: Number(stats?.resolved_count ?? 0), closed: Number(stats?.closed_count ?? 0),
        slaBreached: Number(stats?.sla_breached_count ?? 0),
        avgResolutionHours: Number(stats?.avg_resolution_hours ?? 0),
        slaComplianceRate: closedOrResolved > 0 ? Math.round((slaCompliant / closedOrResolved) * 100) : 100,
      },
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) },
    };
  }

  async getStatistics() {
    const stats = await this.repo.getStatistics();
    const closedOrResolved = Number(stats?.closed_or_resolved_count ?? 0);
    const slaCompliant = Number(stats?.sla_compliant_count ?? 0);
    return {
      total: Number(stats?.total ?? 0), open: Number(stats?.open_count ?? 0),
      resolved: Number(stats?.resolved_count ?? 0), closed: Number(stats?.closed_count ?? 0),
      slaBreached: Number(stats?.sla_breached_count ?? 0),
      avgResolutionHours: Number(stats?.avg_resolution_hours ?? 0),
      slaComplianceRate: closedOrResolved > 0 ? Math.round((slaCompliant / closedOrResolved) * 100) : 100,
    };
  }

  async getById(id: number) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('Ticket not found');
    const [notes, attachments, activities] = await Promise.all([
      this.repo.getNotes(id), this.repo.getAttachments(id), this.repo.getActivities(id),
    ]);
    return {
      ...mapTicket(row),
      notes: notes.map(mapNote),
      attachments: attachments.map(mapAttachment),
      activities: activities.map(mapActivity),
    };
  }

  async create(dto: CreateTicketBodyDto, actorId?: number) {
    const organizationId = getOrganizationId();
    if (!organizationId) throw new ValidationError('Organization context is required');
    if (dto.merchantId && !(await this.repo.validateMerchantInOrg(dto.merchantId, organizationId))) {
      throw new ValidationError('Merchant does not belong to the current organization');
    }
    if (dto.customerId && !(await this.repo.validateCustomerInOrg(dto.customerId, organizationId))) {
      throw new ValidationError('Customer does not belong to the current organization');
    }
    const id = await this.repo.create(dto, organizationId, actorId);
    const detail = await this.getById(id);
    void auditRecorder.record({
      module: 'support', categoryCode: 'support', actionCode: 'ticket_created',
      entityType: 'support_ticket', entityId: String(id),
      description: `Created ticket ${detail.ticketRef}: ${detail.subject}.`,
      afterValues: { priority: detail.priority, category: detail.category }, riskLevel: 'low', userId: actorId,
    }).catch(() => {});
    if (actorId) void notificationDispatch.ticketCreated(actorId, id, detail.ticketRef, detail.subject).catch(() => {});
    return detail;
  }

  async update(id: number, dto: UpdateTicketBodyDto, actorId?: number) {
    await this.getById(id);
    await this.repo.update(id, dto, actorId);
    if (dto.status) await this.repo.addActivity(id, 'status_change', `Status changed to ${dto.status}`, actorId, { status: dto.status });
    void auditRecorder.record({
      module: 'support', categoryCode: 'support', actionCode: 'ticket_updated',
      entityType: 'support_ticket', entityId: String(id), description: 'Support ticket updated.',
      riskLevel: 'low', userId: actorId,
    }).catch(() => {});
    return this.getById(id);
  }

  async assign(id: number, dto: AssignTicketBodyDto, actorId?: number) {
    const before = await this.getById(id);
    await this.repo.assign(id, dto.assigneeId, actorId);
    void auditRecorder.record({
      module: 'support', categoryCode: 'support', actionCode: 'ticket_assigned',
      entityType: 'support_ticket', entityId: String(id),
      description: `Assigned ticket ${before.ticketRef} to user #${dto.assigneeId}.`,
      riskLevel: 'low', userId: actorId,
    }).catch(() => {});
    void notificationDispatch.ticketAssigned(dto.assigneeId, id, before.ticketRef).catch(() => {});
    return this.getById(id);
  }

  async reassign(id: number, dto: AssignTicketBodyDto, actorId?: number) {
    return this.assign(id, dto, actorId);
  }

  async escalate(id: number, dto: EscalateTicketBodyDto, actorId?: number) {
    const before = await this.getById(id);
    await this.repo.escalate(id, dto.assigneeId ?? null, actorId, dto.reason);
    void auditRecorder.record({
      module: 'support', categoryCode: 'support', actionCode: 'ticket_escalated',
      entityType: 'support_ticket', entityId: String(id),
      description: `Escalated ticket ${before.ticketRef}.`, riskLevel: 'medium', userId: actorId,
    }).catch(() => {});
    if (dto.assigneeId) void notificationDispatch.ticketEscalated(dto.assigneeId, id, before.ticketRef).catch(() => {});
    return this.getById(id);
  }

  async close(id: number, actorId?: number) {
    const before = await this.getById(id);
    await this.repo.close(id, actorId);
    void auditRecorder.record({
      module: 'support', categoryCode: 'support', actionCode: 'ticket_closed',
      entityType: 'support_ticket', entityId: String(id),
      description: `Closed ticket ${before.ticketRef}.`, riskLevel: 'low', userId: actorId,
    }).catch(() => {});
    return this.getById(id);
  }

  async reopen(id: number, actorId?: number) {
    const before = await this.getById(id);
    await this.repo.reopen(id, actorId);
    void auditRecorder.record({
      module: 'support', categoryCode: 'support', actionCode: 'ticket_reopened',
      entityType: 'support_ticket', entityId: String(id),
      description: `Reopened ticket ${before.ticketRef}.`, riskLevel: 'medium', userId: actorId,
    }).catch(() => {});
    return this.getById(id);
  }

  async addNote(id: number, dto: AddNoteBodyDto, actorId?: number) {
    await this.getById(id);
    await this.repo.addNote(id, dto, actorId);
    return this.getById(id);
  }

  async addAttachment(id: number, dto: AddAttachmentBodyDto, actorId?: number) {
    await this.getById(id);
    await this.repo.addAttachment(id, dto, actorId);
    return this.getById(id);
  }
}
