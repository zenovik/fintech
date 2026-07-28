import { getOrganizationId } from '../../../shared/context/org-context';
import { webhookDeliveryProcessor } from '../../../shared/webhooks/webhook-delivery.engine';
import { NotFoundError, ValidationError } from '../../../shared/exceptions/app.exception';
import { WebhooksRepository } from '../repositories/webhooks.repository';

function paginate<T>(items: T[], total: number, page: number, pageSize: number) {
  return { items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) || 1 } };
}

function mapWebhook(r: Record<string, unknown>) {
  return {
    id: r.id, uuid: r.uuid, merchantId: r.merchant_id, merchantName: r.merchant_name,
    organizationId: r.organization_id, url: r.url, description: r.description,
    eventTypes: typeof r.event_types === 'string' ? JSON.parse(r.event_types as string) : r.event_types,
    isActive: Boolean(r.is_active), healthStatus: r.health_status,
    lastDeliveryAt: r.last_delivery_at, failureCount: r.failure_count,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapDelivery(r: Record<string, unknown>) {
  return {
    id: r.id, uuid: r.uuid, webhookId: r.webhook_id, webhookUrl: r.webhook_url,
    merchantId: r.merchant_id, eventType: r.event_type, status: r.status,
    attemptCount: r.attempt_count, maxAttempts: r.max_attempts,
    lastResponseCode: r.last_response_code, lastError: r.last_error,
    deliveredAt: r.delivered_at, createdAt: r.created_at,
  };
}

export class WebhooksService {
  constructor(private readonly repo = new WebhooksRepository()) {}

  async dashboard() {
    const stats = await this.repo.getDashboardStats();
    return {
      webhooks: {
        total: Number(stats.webhooks?.total ?? 0), active: Number(stats.webhooks?.active ?? 0),
        failing: Number(stats.webhooks?.failing ?? 0),
      },
      deliveries: {
        pending: Number(stats.deliveries?.pending ?? 0), failed: Number(stats.deliveries?.failed ?? 0),
        deadLetter: Number(stats.deliveries?.dead_letter ?? 0),
      },
    };
  }

  async listWebhooks(query: { page: number; pageSize: number; merchantId?: number; isActive?: boolean }) {
    const { items, total } = await this.repo.listWebhooks(query);
    return paginate(items.map((r) => mapWebhook(r as Record<string, unknown>)), total, query.page, query.pageSize);
  }

  async getWebhook(id: number) {
    const row = await this.repo.findWebhook(id);
    if (!row) throw new NotFoundError('Webhook not found');
    const subscriptions = await this.repo.listSubscriptions(id);
    return {
      webhook: mapWebhook(row as Record<string, unknown>),
      subscriptions: subscriptions.map((s) => ({
        id: s.id, uuid: s.uuid, eventCategory: s.event_category, eventType: s.event_type, isEnabled: Boolean(s.is_enabled),
      })),
    };
  }

  async createWebhook(dto: Record<string, unknown>) {
    const orgId = getOrganizationId();
    if (!orgId) throw new ValidationError('Organization context is required');
    const id = await this.repo.createWebhook(dto, orgId);
    return this.getWebhook(id);
  }

  async updateWebhook(id: number, dto: Record<string, unknown>) {
    if (!(await this.repo.findWebhook(id))) throw new NotFoundError('Webhook not found');
    await this.repo.updateWebhook(id, dto);
    return this.getWebhook(id);
  }

  async deleteWebhook(id: number) {
    if (!(await this.repo.findWebhook(id))) throw new NotFoundError('Webhook not found');
    await this.repo.deleteWebhook(id);
    return { deleted: true };
  }

  async createSubscription(webhookId: number, dto: Record<string, unknown>) {
    if (!(await this.repo.findWebhook(webhookId))) throw new NotFoundError('Webhook not found');
    const id = await this.repo.createSubscription(webhookId, dto);
    const subs = await this.repo.listSubscriptions(webhookId);
    return subs.find((s) => s.id === id);
  }

  async updateSubscription(webhookId: number, subId: number, dto: Record<string, unknown>) {
    if (!(await this.repo.findWebhook(webhookId))) throw new NotFoundError('Webhook not found');
    await this.repo.updateSubscription(subId, dto);
    const subs = await this.repo.listSubscriptions(webhookId);
    return subs.find((s) => s.id === subId);
  }

  async deleteSubscription(webhookId: number, subId: number) {
    if (!(await this.repo.findWebhook(webhookId))) throw new NotFoundError('Webhook not found');
    await this.repo.deleteSubscription(subId);
    return { deleted: true };
  }

  async listDeliveries(query: { page: number; pageSize: number; status?: string; webhookId?: number }) {
    const { items, total } = await this.repo.listDeliveries(query);
    return paginate(items.map((r) => mapDelivery(r as Record<string, unknown>)), total, query.page, query.pageSize);
  }

  async getDelivery(id: number) {
    const row = await this.repo.findDelivery(id);
    if (!row) throw new NotFoundError('Delivery not found');
    const replays = await this.repo.listReplayHistory(id);
    return {
      delivery: mapDelivery(row as Record<string, unknown>),
      replays: replays.map((r) => ({
        id: r.id, replayedBy: r.replayed_by, replayReason: r.replay_reason,
        replayStatus: r.replay_status, createdAt: r.created_at,
      })),
    };
  }

  async retryDelivery(id: number, actorId?: number, reason?: string) {
    if (!(await this.repo.findDelivery(id))) throw new NotFoundError('Delivery not found');
    await this.repo.retryDelivery(id);
    const replayId = await this.repo.createReplay(id, actorId, reason, 'failed');
    const success = await webhookDeliveryProcessor.processQueueDelivery(id);
    await this.repo.updateReplayStatus(replayId, success ? 'success' : 'failed');
    return this.getDelivery(id);
  }
}
