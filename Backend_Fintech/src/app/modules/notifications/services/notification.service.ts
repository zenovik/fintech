import { randomUUID } from 'node:crypto';
import { NotificationRepository } from '../repositories/notification.repository';
import { NotificationDispatchService } from './notification-dispatch.service';
import { auditRecorder } from '../../audit';
import {
  BroadcastListQueryDto,
  CreateBroadcastBodyDto,
  CreateTemplateBodyDto,
  NotificationListQueryDto,
  TemplateListQueryDto,
  UpdateTemplateBodyDto,
} from '../dto';
import { NotFoundError } from '../../../shared/exceptions/app.exception';
import { getOrganizationId } from '../../../shared/context/org-context';

export class NotificationService {
  constructor(
    private readonly repo = new NotificationRepository(),
    private readonly dispatch = new NotificationDispatchService(),
  ) {}

  async list(userId: number, query: NotificationListQueryDto) {
    const result = await this.repo.findByUser(userId, query);
    const counts = await this.repo.getStatusCounts(userId);
    return { ...result, counts };
  }

  async getById(id: number, userId: number) {
    const notification = await this.repo.findByIdForUser(id, userId);
    if (!notification) throw new NotFoundError('Notification not found');
    const deliveries = await this.repo.getDeliveriesForNotification(id);
    return { ...notification, deliveries };
  }

  async getUnreadCount(userId: number) {
    const count = await this.repo.getUnreadCount(userId);
    return { unreadCount: count };
  }

  async markRead(id: number, userId: number) {
    const ok = await this.repo.markRead(id, userId);
    if (!ok) throw new NotFoundError('Notification not found or already read');
    return this.repo.findByIdForUser(id, userId);
  }

  async markAllRead(userId: number) {
    const count = await this.repo.markAllRead(userId);
    return { updated: count };
  }

  async archive(id: number, userId: number) {
    const ok = await this.repo.archive(id, userId);
    if (!ok) throw new NotFoundError('Notification not found');
    return this.repo.findByIdForUser(id, userId);
  }

  async archiveAll(userId: number) {
    const count = await this.repo.archiveAll(userId);
    return { updated: count };
  }

  async delete(id: number, userId: number) {
    const ok = await this.repo.softDelete(id, userId);
    if (!ok) throw new NotFoundError('Notification not found');
    return { deleted: true };
  }

  async listTemplates(query: TemplateListQueryDto) {
    return this.repo.findTemplates(query);
  }

  async getTemplate(id: number) {
    const template = await this.repo.findTemplateById(id);
    if (!template) throw new NotFoundError('Template not found');
    return template;
  }

  async createTemplate(dto: CreateTemplateBodyDto, userId?: number) {
    const result = await this.repo.createTemplate(dto, userId);
    void auditRecorder.templateChange('Created', dto.code, { userId }).catch(() => {});
    return result;
  }

  async updateTemplate(id: number, dto: UpdateTemplateBodyDto, userId?: number) {
    const existing = await this.repo.findTemplateById(id);
    if (!existing) throw new NotFoundError('Template not found');
    const result = await this.repo.updateTemplate(id, dto, userId);
    void auditRecorder.templateChange('Updated', existing.code, { userId }).catch(() => {});
    return result;
  }

  async deleteTemplate(id: number, userId?: number) {
    const existing = await this.repo.findTemplateById(id);
    const ok = await this.repo.deleteTemplate(id);
    if (!ok) throw new NotFoundError('Template not found');
    if (existing) void auditRecorder.templateChange('Deleted', existing.code, { userId }).catch(() => {});
    return { deleted: true };
  }

  async listBroadcasts(query: BroadcastListQueryDto) {
    return this.repo.findBroadcasts(query);
  }

  async createBroadcast(dto: CreateBroadcastBodyDto, actorId?: number) {
    const broadcastId = randomUUID();
    const userIds = await this.repo.getUserIdsForGroup(dto.groupCode);
    const created: unknown[] = [];

    for (const userId of userIds) {
      const notification = await this.dispatch.dispatch({
        userId,
        eventCode: 'broadcast',
        title: dto.title,
        body: dto.message,
        category: dto.category,
        priority: dto.priority,
        metadata: { message: dto.message, sentBy: actorId },
        broadcastId,
      });
      created.push(notification);
    }

    void auditRecorder.broadcast(dto.title, userIds.length, { userId: actorId }).catch(() => {});

    return {
      broadcastId,
      recipientCount: userIds.length,
      title: dto.title,
      message: dto.message,
    };
  }

  async getChannels() {
    return this.repo.getChannels();
  }

  async getEvents() {
    return this.repo.getEvents();
  }

  async getGroups() {
    return this.repo.getGroups();
  }

  async listCampaigns(query: { page: number; pageSize: number; status?: string }) {
    const { items, total } = await this.repo.listCampaigns(query);
    return {
      items: items.map((r) => ({
        id: r['id'], uuid: r['uuid'], name: r['name'], channel: r['channel'],
        templateId: r['template_id'], status: r['status'], scheduledAt: r['scheduled_at'],
        sentCount: r['sent_count'], createdAt: r['created_at'],
      })),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) || 1 },
    };
  }

  async getCampaign(id: number) {
    const row = await this.repo.findCampaign(id);
    if (!row) throw new NotFoundError('Campaign not found');
    return {
      id: row['id'], uuid: row['uuid'], name: row['name'], channel: row['channel'],
      templateId: row['template_id'], status: row['status'], scheduledAt: row['scheduled_at'],
      sentCount: row['sent_count'], createdAt: row['created_at'],
    };
  }

  async createCampaign(dto: Record<string, unknown>, actorId?: number) {
    const orgId = getOrganizationId();
    if (!orgId) throw new NotFoundError('Organization context required');
    const id = await this.repo.createCampaign(dto, orgId, actorId);
    return this.getCampaign(id);
  }

  async updateCampaign(id: number, dto: Record<string, unknown>, actorId?: number) {
    void actorId;
    if (!(await this.repo.findCampaign(id))) throw new NotFoundError('Campaign not found');
    await this.repo.updateCampaign(id, dto);
    return this.getCampaign(id);
  }

  async deleteCampaign(id: number, actorId?: number) {
    void actorId;
    if (!(await this.repo.findCampaign(id))) throw new NotFoundError('Campaign not found');
    await this.repo.deleteCampaign(id);
    return { deleted: true };
  }

  async getTemplateVariables(templateId: number) {
    const template = await this.repo.findTemplateById(templateId);
    if (!template) throw new NotFoundError('Template not found');
    const variables = await this.repo.getTemplateVariables(templateId);
    return { templateId, variables };
  }
}
