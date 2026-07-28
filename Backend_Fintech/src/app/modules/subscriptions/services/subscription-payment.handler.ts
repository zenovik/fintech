import { env } from '../../../config';
import { auditRecorder } from '../../audit';
import { notificationDispatch } from '../../notifications';
import { InvoiceService } from '../../invoices/services/invoice.service';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { addBillingInterval, formatDate, BillingInterval } from '../constants/subscriptions.constants';
import { RowDataPacket } from 'mysql2/promise';

export class SubscriptionPaymentHandler {
  constructor(private readonly repo = new SubscriptionRepository()) {}

  async onInvoicePaid(invoiceId: number): Promise<void> {
    const sub = await this.repo.findByInvoiceId(invoiceId);
    if (!sub || sub.status === 'cancelled') return;

    const plan = await this.repo.findPlanById(sub.plan_id);
    if (!plan) return;

    const periodStart = sub.current_period_end ? new Date(sub.current_period_end) : new Date();
    const periodEnd = addBillingInterval(periodStart, plan.billing_interval as BillingInterval);
    const renewalCount = Number(sub.renewal_count) + 1;

    await this.repo.setStatus(sub.id, 'active', undefined, {
      nextBillingDate: formatDate(periodEnd),
      currentPeriodStart: formatDate(periodStart),
      currentPeriodEnd: formatDate(periodEnd),
      renewalCount,
    });

    void auditRecorder.record({
      module: 'subscriptions', categoryCode: 'transactions', actionCode: 'subscription_renewed',
      entityType: 'subscription', entityId: String(sub.id),
      description: `Subscription ${sub.subscription_ref} renewed (period ${renewalCount}).`,
      afterValues: { invoiceId, renewalCount }, riskLevel: 'low',
    }).catch(() => {});

    if (sub.created_by) {
      void notificationDispatch.subscriptionRenewed(sub.created_by, sub.id, sub.subscription_ref).catch(() => {});
    }
  }
}

export const subscriptionPaymentHandler = new SubscriptionPaymentHandler();

function mapPlan(row: RowDataPacket) {
  return {
    id: row.id, planCode: row.plan_code, merchantId: row.merchant_id, merchantName: row.merchant_name ?? null,
    name: row.name, description: row.description, price: Number(row.price), currency: row.currency,
    billingInterval: row.billing_interval, trialDays: row.trial_days, status: row.status, createdAt: row.created_at,
  };
}

function mapSubscription(row: RowDataPacket) {
  const payUrl = row.public_token ? `${env.corsOrigin.replace(/\/$/, '')}/pay/${row.public_token}` : null;
  return {
    id: row.id, subscriptionRef: row.subscription_ref, organizationId: row.organization_id,
    merchantId: row.merchant_id, merchantName: row.merchant_name ?? null,
    customerId: row.customer_id, customerName: row.customer_name ?? null, customerEmail: row.customer_email ?? null,
    planId: row.plan_id, planName: row.plan_name, planPrice: Number(row.plan_price ?? row.price ?? 0),
    currency: row.plan_currency ?? row.currency ?? 'USD', billingInterval: row.billing_interval,
    status: row.status, startDate: row.start_date, endDate: row.end_date, trialEndDate: row.trial_end_date,
    nextBillingDate: row.next_billing_date, currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end, renewalCount: row.renewal_count,
    paymentLink: row.payment_link_id ? {
      id: row.payment_link_id, linkRef: row.payment_link_ref ?? null, publicUrl: payUrl, status: row.payment_link_status ?? null,
    } : null,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export { mapPlan, mapSubscription };
