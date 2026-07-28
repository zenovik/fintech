import { getOrganizationId } from '../../../shared/context/org-context';
import { NotFoundError, ValidationError } from '../../../shared/exceptions/app.exception';
import { auditRecorder } from '../../audit';
import { notificationDispatch } from '../../notifications';
import { InvoiceService } from '../../invoices/services/invoice.service';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { CreatePlanBodyDto, CreateSubscriptionBodyDto, PlanListQueryDto, SubscriptionListQueryDto } from '../dto';
import { addBillingInterval, formatDate, BillingInterval } from '../constants/subscriptions.constants';
import { mapPlan, mapSubscription } from './subscription-payment.handler';

function formatBillingPeriod(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 7);
  const text = String(value);
  const datePrefix = text.match(/^(\d{4}-\d{2})/);
  if (datePrefix) return datePrefix[1];
  return text.slice(0, 20);
}

export class SubscriptionService {
  constructor(
    private readonly repo = new SubscriptionRepository(),
    private readonly invoiceService = new InvoiceService(),
  ) {}

  async listPlans(query: PlanListQueryDto) {
    const { items, total } = await this.repo.findPlans(query);
    return { items: items.map(mapPlan), pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) } };
  }

  async createPlan(dto: CreatePlanBodyDto, actorId?: number) {
    const organizationId = getOrganizationId();
    if (!organizationId) throw new ValidationError('Organization context is required');
    if (!(await this.repo.validateMerchantInOrg(dto.merchantId, organizationId))) {
      throw new ValidationError('Merchant does not belong to the current organization');
    }
    const id = await this.repo.createPlan(dto, organizationId, actorId);
    return mapPlan((await this.repo.findPlanById(id))!);
  }

  async listSubscriptions(query: SubscriptionListQueryDto) {
    const { items, total } = await this.repo.findSubscriptions(query);
    const stats = await this.repo.getSubscriptionStats();
    return {
      items: items.map(mapSubscription),
      stats: {
        total: Number(stats?.total ?? 0), active: Number(stats?.active_count ?? 0),
        paused: Number(stats?.paused_count ?? 0), cancelled: Number(stats?.cancelled_count ?? 0),
        failed: Number(stats?.failed_count ?? 0), renewed: Number(stats?.renewed_count ?? 0),
        mrrEstimate: Number(stats?.mrr_estimate ?? 0),
      },
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) },
    };
  }

  async getStatistics() {
    const stats = await this.repo.getSubscriptionStats();
    return {
      total: Number(stats?.total ?? 0), active: Number(stats?.active_count ?? 0),
      paused: Number(stats?.paused_count ?? 0), cancelled: Number(stats?.cancelled_count ?? 0),
      failed: Number(stats?.failed_count ?? 0), renewed: Number(stats?.renewed_count ?? 0),
      mrrEstimate: Number(stats?.mrr_estimate ?? 0),
    };
  }

  async getById(id: number) {
    const row = await this.repo.findSubscriptionById(id);
    if (!row) throw new NotFoundError('Subscription not found');
    return mapSubscription(row);
  }

  private async generateBillingInvoice(subscriptionId: number, actorId?: number) {
    const sub = await this.repo.findSubscriptionById(subscriptionId);
    if (!sub) throw new NotFoundError('Subscription not found');
    const plan = await this.repo.findPlanById(sub.plan_id);
    if (!plan) throw new NotFoundError('Plan not found');

    const dueDate = sub.next_billing_date ?? formatDate(addBillingInterval(new Date(), plan.billing_interval as BillingInterval));
    const invoice = await this.invoiceService.create({
      merchantId: sub.merchant_id,
      customerId: sub.customer_id,
      referenceNumber: sub.subscription_ref,
      issueDate: formatDate(new Date()),
      dueDate,
      currency: plan.currency,
      taxAmount: 0,
      discountAmount: 0,
      notes: `Subscription billing for ${plan.name}`,
      lineItems: [{ description: `${plan.name} (${plan.billing_interval})`, quantity: 1, unitPrice: Number(plan.price), tax: 0, discount: 0 }],
      generatePaymentLink: true,
    }, actorId);

    await this.repo.linkInvoice(subscriptionId, invoice.id, formatBillingPeriod(sub.current_period_start));
    if (invoice.paymentLinkId) await this.repo.setPaymentLinkId(subscriptionId, invoice.paymentLinkId, actorId);
    await this.invoiceService.markSent(invoice.id, actorId);
    return invoice;
  }

  async create(dto: CreateSubscriptionBodyDto, actorId?: number) {
    const organizationId = getOrganizationId();
    if (!organizationId) throw new ValidationError('Organization context is required');
    if (!(await this.repo.validateMerchantInOrg(dto.merchantId, organizationId))) {
      throw new ValidationError('Merchant does not belong to the current organization');
    }
    if (!(await this.repo.validateCustomerInOrg(dto.customerId, organizationId))) {
      throw new ValidationError('Customer does not belong to the current organization');
    }
    const plan = await this.repo.findPlanById(dto.planId);
    if (!plan) throw new NotFoundError('Plan not found');

    const id = await this.repo.createSubscription(dto, organizationId, plan, actorId);
    await this.generateBillingInvoice(id, actorId);

    const detail = await this.getById(id);
    void auditRecorder.record({
      module: 'subscriptions', categoryCode: 'transactions', actionCode: 'subscription_created',
      entityType: 'subscription', entityId: String(id),
      description: `Created subscription ${detail.subscriptionRef} for plan ${detail.planName}.`,
      riskLevel: 'low', userId: actorId,
    }).catch(() => {});
    if (actorId) void notificationDispatch.subscriptionCreated(actorId, id, detail.subscriptionRef, detail.planName).catch(() => {});
    return detail;
  }

  async pause(id: number, actorId?: number) {
    const before = await this.getById(id);
    if (before.status === 'cancelled') throw new ValidationError('Cannot pause cancelled subscription');
    await this.repo.setStatus(id, 'paused', actorId);
    void auditRecorder.record({
      module: 'subscriptions', categoryCode: 'transactions', actionCode: 'subscription_paused',
      entityType: 'subscription', entityId: String(id), description: `Paused subscription ${before.subscriptionRef}.`,
      riskLevel: 'medium', userId: actorId,
    }).catch(() => {});
    return this.getById(id);
  }

  async cancel(id: number, actorId?: number) {
    const before = await this.getById(id);
    await this.repo.setStatus(id, 'cancelled', actorId, { endDate: formatDate(new Date()) });
    void auditRecorder.record({
      module: 'subscriptions', categoryCode: 'transactions', actionCode: 'subscription_cancelled',
      entityType: 'subscription', entityId: String(id), description: `Cancelled subscription ${before.subscriptionRef}.`,
      riskLevel: 'medium', userId: actorId,
    }).catch(() => {});
    if (actorId) void notificationDispatch.subscriptionCancelled(actorId, id, before.subscriptionRef).catch(() => {});
    return this.getById(id);
  }

  async renew(id: number, actorId?: number) {
    const before = await this.getById(id);
    if (before.status === 'cancelled') throw new ValidationError('Cannot renew cancelled subscription');
    await this.generateBillingInvoice(id, actorId);
    await this.repo.setStatus(id, 'renewed', actorId);
    void auditRecorder.record({
      module: 'subscriptions', categoryCode: 'transactions', actionCode: 'subscription_renewed',
      entityType: 'subscription', entityId: String(id), description: `Manual renewal for ${before.subscriptionRef}.`,
      riskLevel: 'low', userId: actorId,
    }).catch(() => {});
    if (actorId) void notificationDispatch.subscriptionRenewed(actorId, id, before.subscriptionRef).catch(() => {});
    return this.getById(id);
  }

  async markFailed(id: number, actorId?: number) {
    const before = await this.getById(id);
    await this.repo.setStatus(id, 'failed', actorId);
    void auditRecorder.record({
      module: 'subscriptions', categoryCode: 'transactions', actionCode: 'subscription_failed',
      entityType: 'subscription', entityId: String(id), description: `Subscription ${before.subscriptionRef} marked failed.`,
      riskLevel: 'high', userId: actorId,
    }).catch(() => {});
    if (actorId) void notificationDispatch.subscriptionFailed(actorId, id, before.subscriptionRef).catch(() => {});
    return this.getById(id);
  }

  async resume(id: number, actorId?: number) {
    const before = await this.getById(id);
    if (before.status !== 'paused') throw new ValidationError('Only paused subscriptions can be resumed');
    await this.repo.resumeSubscription(id, actorId);
    return this.getById(id);
  }

  async upgrade(id: number, planId: number, actorId?: number) {
    await this.getById(id);
    const plan = await this.repo.findPlanById(planId);
    if (!plan) throw new NotFoundError('Plan not found');
    await this.repo.upgradeSubscription(id, planId, actorId);
    return this.getById(id);
  }

  async downgrade(id: number, planId: number, actorId?: number) {
    await this.getById(id);
    const plan = await this.repo.findPlanById(planId);
    if (!plan) throw new NotFoundError('Plan not found');
    await this.repo.downgradeSubscription(id, planId, actorId);
    return this.getById(id);
  }

  async listDunning(query: { page: number; pageSize: number; subscriptionId?: number }) {
    const { items, total } = await this.repo.listDunningEvents(query);
    return {
      items: items.map((r) => ({
        id: r.id, uuid: r.uuid, subscriptionId: r.subscription_id, subscriptionRef: r.subscription_ref,
        stage: r.stage, action: r.action, status: r.status, scheduledAt: r.scheduled_at, completedAt: r.completed_at,
      })),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) || 1 },
    };
  }

  async listMandates(subscriptionId?: number) {
    const rows = await this.repo.listMandates(subscriptionId);
    return rows.map((r) => ({
      id: r.id, uuid: r.uuid, subscriptionId: r.subscription_id, subscriptionRef: r.subscription_ref,
      mandateRef: r.mandate_ref, paymentMethod: r.payment_method, status: r.status, createdAt: r.created_at,
    }));
  }

  async getAnalytics() {
    const stats = await this.repo.getAnalytics();
    return {
      total: Number(stats?.total ?? 0), active: Number(stats?.active_count ?? 0),
      paused: Number(stats?.paused_count ?? 0), cancelled: Number(stats?.cancelled_count ?? 0),
      failed: Number(stats?.failed_count ?? 0), mrrEstimate: Number(stats?.mrr_estimate ?? 0),
      activeDunning: Number(stats?.activeDunning ?? 0), cancelled30d: Number(stats?.cancelled30d ?? 0),
    };
  }
}
