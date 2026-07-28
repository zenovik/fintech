import { NotificationRepository } from '../repositories/notification.repository';
import {
  EVENT_ICONS,
  EVENT_TITLES,
  NotificationCategory,
  NotificationPriority,
} from '../constants/notifications.constants';

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '');
}

export interface DispatchInput {
  userId: number;
  eventCode: string;
  title?: string;
  body?: string;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  icon?: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  broadcastId?: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
}

export class NotificationDispatchService {
  constructor(private readonly repo = new NotificationRepository()) {}

  async dispatch(dto: DispatchInput) {
    const category = (dto.category ?? this.inferCategory(dto.eventCode)) as NotificationCategory;
    const title = dto.title ?? EVENT_TITLES[dto.eventCode] ?? 'Notification';
    const body = dto.body ?? this.buildBody(dto.eventCode, dto.metadata ?? {});
    const icon = dto.icon ?? EVENT_ICONS[dto.eventCode] ?? 'notifications';

    return this.repo.createNotification({
      ...dto,
      title,
      body,
      category,
      icon,
      priority: dto.priority ?? 'normal',
      broadcastId: dto.broadcastId,
    });
  }

  async welcome(userId: number, companyName = 'Merchant Pro') {
    const hasWelcome = await this.repo.hasEventNotification(userId, 'welcome');
    if (hasWelcome) return null;
    return this.dispatch({
      userId,
      eventCode: 'welcome',
      body: `Welcome to ${companyName}! Your account is ready.`,
      category: 'system',
      priority: 'normal',
      actionUrl: '/dashboard',
      actionLabel: 'Go to Dashboard',
    });
  }

  async passwordChanged(userId: number) {
    return this.dispatch({
      userId,
      eventCode: 'password_changed',
      category: 'security',
      priority: 'high',
      actionUrl: '/settings/account',
      actionLabel: 'Review Account',
    });
  }

  async mfaEnabled(userId: number) {
    return this.dispatch({
      userId,
      eventCode: 'mfa_enabled',
      category: 'security',
      priority: 'high',
      actionUrl: '/settings/account',
      actionLabel: 'Review Security',
    });
  }

  async merchantApproved(userId: number, merchantId: number, merchantName: string) {
    return this.dispatch({
      userId,
      eventCode: 'merchant_approved',
      category: 'merchant',
      body: `Merchant ${merchantName} has been approved and is now active.`,
      relatedEntityType: 'merchant',
      relatedEntityId: merchantId,
      actionUrl: `/merchants/${merchantId}`,
      actionLabel: 'View Merchant',
      metadata: { merchantId, merchantName },
    });
  }

  async merchantRejected(userId: number, merchantId: number, merchantName: string, reason?: string) {
    return this.dispatch({
      userId,
      eventCode: 'merchant_rejected',
      category: 'merchant',
      body: `Merchant ${merchantName} application was rejected.${reason ? ` Reason: ${reason}` : ''}`,
      relatedEntityType: 'merchant',
      relatedEntityId: merchantId,
      actionUrl: `/merchants/${merchantId}`,
      actionLabel: 'View Details',
      metadata: { merchantId, merchantName, reason },
    });
  }

  async refundProcessed(userId: number, transactionId: number, transactionRef: string, amount: string, currency = 'USD') {
    return this.dispatch({
      userId,
      eventCode: 'refund_processed',
      category: 'financial',
      body: `Refund of ${amount} ${currency} for transaction ${transactionRef} has been processed.`,
      relatedEntityType: 'transaction',
      relatedEntityId: transactionId,
      actionUrl: `/transactions/${transactionId}`,
      actionLabel: 'View Transaction',
      metadata: { transactionRef, amount, currency },
    });
  }

  async settlementCompleted(userId: number, settlementId: number, settlementRef: string, amount: string, currency = 'USD') {
    return this.dispatch({
      userId,
      eventCode: 'settlement_completed',
      category: 'financial',
      body: `Settlement ${settlementRef} for ${amount} ${currency} has been completed.`,
      relatedEntityType: 'settlement',
      relatedEntityId: settlementId,
      actionUrl: `/settlements/${settlementId}`,
      actionLabel: 'View Settlement',
      metadata: { settlementRef, amount, currency },
    });
  }

  async paymentFailed(userId: number, transactionId: number, transactionRef: string, reason?: string) {
    return this.dispatch({
      userId,
      eventCode: 'payment_failed',
      category: 'transaction',
      priority: 'urgent',
      body: `Payment for transaction ${transactionRef} failed.${reason ? ` Reason: ${reason}` : ''}`,
      relatedEntityType: 'transaction',
      relatedEntityId: transactionId,
      actionUrl: `/transactions/${transactionId}`,
      actionLabel: 'Review Transaction',
      metadata: { transactionRef, reason },
    });
  }

  async customerCreated(userId: number, customerId: number, customerName: string) {
    return this.dispatch({
      userId,
      eventCode: 'customer_created',
      category: 'support',
      body: `New customer ${customerName} has been registered.`,
      relatedEntityType: 'customer',
      relatedEntityId: customerId,
      actionUrl: `/customers/${customerId}`,
      actionLabel: 'View Customer',
      metadata: { customerId, customerName },
    });
  }

  async customerStatusChanged(userId: number, customerId: number, customerName: string, status: string) {
    return this.dispatch({
      userId,
      eventCode: 'customer_status_changed',
      category: 'support',
      body: `Customer ${customerName} status changed to ${status}.`,
      relatedEntityType: 'customer',
      relatedEntityId: customerId,
      actionUrl: `/customers/${customerId}`,
      actionLabel: 'View Customer',
      metadata: { customerId, customerName, status },
    });
  }

  async refundRejected(userId: number, refundId: number, refundRef: string, reason: string) {
    return this.dispatch({
      userId,
      eventCode: 'refund_rejected',
      category: 'financial',
      body: `Refund request ${refundRef} was rejected. Reason: ${reason}`,
      relatedEntityType: 'refund',
      relatedEntityId: refundId,
      actionUrl: `/refunds/${refundId}`,
      actionLabel: 'View Refund',
      metadata: { refundRef, reason },
    });
  }

  async refundRequested(userId: number, refundId: number, refundRef: string, amount: string, currency = 'USD') {
    return this.dispatch({
      userId,
      eventCode: 'refund_requested',
      category: 'financial',
      body: `Refund request ${refundRef} for ${amount} ${currency} submitted for approval.`,
      relatedEntityType: 'refund',
      relatedEntityId: refundId,
      actionUrl: `/refunds/${refundId}`,
      actionLabel: 'Review Refund',
      metadata: { refundRef, amount, currency },
    });
  }

  async chargebackOpened(userId: number, chargebackId: number, disputeRef: string, amount: string, currency = 'USD') {
    return this.dispatch({
      userId,
      eventCode: 'chargeback_opened',
      category: 'financial',
      body: `Chargeback ${disputeRef} for ${amount} ${currency} received from issuer.`,
      relatedEntityType: 'chargeback',
      relatedEntityId: chargebackId,
      actionUrl: `/chargebacks/${chargebackId}`,
      actionLabel: 'View Chargeback',
      metadata: { disputeRef, amount, currency },
    });
  }

  async chargebackResolved(userId: number, chargebackId: number, disputeRef: string, outcome: string) {
    return this.dispatch({
      userId,
      eventCode: 'chargeback_resolved',
      category: 'financial',
      body: `Chargeback ${disputeRef} resolved as ${outcome}.`,
      relatedEntityType: 'chargeback',
      relatedEntityId: chargebackId,
      actionUrl: `/chargebacks/${chargebackId}`,
      actionLabel: 'View Chargeback',
      metadata: { disputeRef, outcome },
    });
  }

  async payoutScheduled(userId: number, payoutId: number, payoutRef: string, amount: string, currency = 'USD') {
    return this.dispatch({
      userId,
      eventCode: 'payout_scheduled',
      category: 'financial',
      body: `Payout ${payoutRef} for ${amount} ${currency} scheduled.`,
      relatedEntityType: 'payout',
      relatedEntityId: payoutId,
      actionUrl: `/payouts/${payoutId}`,
      actionLabel: 'View Payout',
      metadata: { payoutRef, amount, currency },
    });
  }

  async payoutCompleted(userId: number, payoutId: number, payoutRef: string, amount: string, currency = 'USD') {
    return this.dispatch({
      userId,
      eventCode: 'payout_completed',
      category: 'financial',
      body: `Payout ${payoutRef} for ${amount} ${currency} confirmed.`,
      relatedEntityType: 'payout',
      relatedEntityId: payoutId,
      actionUrl: `/payouts/${payoutId}`,
      actionLabel: 'View Payout',
      metadata: { payoutRef, amount, currency },
    });
  }

  async chargebackEvidenceDue(
    userId: number,
    chargebackId: number,
    disputeRef: string,
    dueDate: string,
    amount: string,
    currency = 'USD',
  ) {
    return this.dispatch({
      userId,
      eventCode: 'chargeback_evidence_due',
      category: 'financial',
      priority: 'urgent',
      body: `Evidence for chargeback ${disputeRef} (${amount} ${currency}) is due by ${dueDate}.`,
      relatedEntityType: 'chargeback',
      relatedEntityId: chargebackId,
      actionUrl: `/chargebacks/${chargebackId}`,
      actionLabel: 'Submit Evidence',
      metadata: { disputeRef, dueDate, amount, currency },
    });
  }

  async payoutFailed(userId: number, payoutId: number, payoutRef: string, reason: string) {
    return this.dispatch({
      userId,
      eventCode: 'payout_failed',
      category: 'financial',
      body: `Payout ${payoutRef} failed. Reason: ${reason}`,
      relatedEntityType: 'payout',
      relatedEntityId: payoutId,
      actionUrl: `/payouts/${payoutId}`,
      actionLabel: 'View Payout',
      metadata: { payoutRef, reason },
    });
  }

  async paymentLinkCreated(userId: number, linkId: number, linkRef: string, title: string) {
    return this.dispatch({
      userId,
      eventCode: 'payment_link_created',
      category: 'financial',
      body: `Payment link ${linkRef} (${title}) is ready to share.`,
      relatedEntityType: 'payment_link',
      relatedEntityId: linkId,
      actionUrl: `/payment-links/${linkId}`,
      actionLabel: 'View Link',
      metadata: { linkRef, title },
    });
  }

  async paymentLinkExpired(userId: number, linkId: number, linkRef: string, title: string) {
    return this.dispatch({
      userId,
      eventCode: 'payment_link_expired',
      category: 'financial',
      body: `Payment link ${linkRef} (${title}) has expired.`,
      relatedEntityType: 'payment_link',
      relatedEntityId: linkId,
      actionUrl: `/payment-links/${linkId}`,
      actionLabel: 'View Link',
      metadata: { linkRef, title },
    });
  }

  async paymentReceived(userId: number, transactionId: number, transactionRef: string, amount: string, currency = 'USD') {
    return this.dispatch({
      userId,
      eventCode: 'payment_received',
      category: 'financial',
      body: `Payment of ${amount} ${currency} received for transaction ${transactionRef}.`,
      relatedEntityType: 'transaction',
      relatedEntityId: transactionId,
      actionUrl: `/transactions/${transactionId}`,
      actionLabel: 'View Transaction',
      metadata: { transactionRef, amount, currency },
    });
  }

  async invoiceCreated(userId: number, invoiceId: number, invoiceNumber: string, total: string, currency = 'USD') {
    return this.dispatch({
      userId,
      eventCode: 'invoice_created',
      category: 'financial',
      body: `Invoice ${invoiceNumber} for ${total} ${currency} was created.`,
      relatedEntityType: 'invoice',
      relatedEntityId: invoiceId,
      actionUrl: `/invoices/${invoiceId}`,
      actionLabel: 'View Invoice',
      metadata: { invoiceNumber, total, currency },
    });
  }

  async invoiceSent(userId: number, invoiceId: number, invoiceNumber: string, customerName: string) {
    return this.dispatch({
      userId,
      eventCode: 'invoice_sent',
      category: 'financial',
      body: `Invoice ${invoiceNumber} was sent to ${customerName}.`,
      relatedEntityType: 'invoice',
      relatedEntityId: invoiceId,
      actionUrl: `/invoices/${invoiceId}`,
      actionLabel: 'View Invoice',
      metadata: { invoiceNumber, customerName },
    });
  }

  async invoiceViewed(userId: number, invoiceId: number, invoiceNumber: string) {
    return this.dispatch({
      userId,
      eventCode: 'invoice_viewed',
      category: 'financial',
      body: `Invoice ${invoiceNumber} was viewed by the customer.`,
      relatedEntityType: 'invoice',
      relatedEntityId: invoiceId,
      actionUrl: `/invoices/${invoiceId}`,
      actionLabel: 'View Invoice',
      metadata: { invoiceNumber },
    });
  }

  async invoicePaid(userId: number, invoiceId: number, invoiceNumber: string, amount: string, currency = 'USD') {
    return this.dispatch({
      userId,
      eventCode: 'invoice_paid',
      category: 'financial',
      body: `Payment of ${amount} ${currency} received for invoice ${invoiceNumber}.`,
      relatedEntityType: 'invoice',
      relatedEntityId: invoiceId,
      actionUrl: `/invoices/${invoiceId}`,
      actionLabel: 'View Invoice',
      metadata: { invoiceNumber, amount, currency },
    });
  }

  async invoiceOverdue(userId: number, invoiceId: number, invoiceNumber: string, balanceDue: string, currency = 'USD') {
    return this.dispatch({
      userId,
      eventCode: 'invoice_overdue',
      category: 'financial',
      priority: 'high',
      body: `Invoice ${invoiceNumber} is overdue. Balance due: ${balanceDue} ${currency}.`,
      relatedEntityType: 'invoice',
      relatedEntityId: invoiceId,
      actionUrl: `/invoices/${invoiceId}`,
      actionLabel: 'View Invoice',
      metadata: { invoiceNumber, balanceDue, currency },
    });
  }

  async qrCodeCreated(userId: number, qrId: number, qrRef: string, title: string) {
    return this.dispatch({
      userId, eventCode: 'qr_code_created', category: 'financial',
      body: `QR code ${qrRef} (${title}) was created.`,
      relatedEntityType: 'qr_code', relatedEntityId: qrId,
      actionUrl: `/qr-payments/${qrId}`, actionLabel: 'View QR Code',
      metadata: { qrRef, title },
    });
  }

  async qrPaymentReceived(userId: number, qrId: number, qrRef: string, amount: string, currency = 'USD') {
    return this.dispatch({
      userId, eventCode: 'qr_payment_received', category: 'financial',
      body: `Payment of ${amount} ${currency} received via QR ${qrRef}.`,
      relatedEntityType: 'qr_code', relatedEntityId: qrId,
      actionUrl: `/qr-payments/${qrId}`, actionLabel: 'View QR Code',
      metadata: { qrRef, amount, currency },
    });
  }

  async subscriptionCreated(userId: number, subId: number, subRef: string, planName: string) {
    return this.dispatch({
      userId, eventCode: 'subscription_created', category: 'financial',
      body: `Subscription ${subRef} created for plan ${planName}.`,
      relatedEntityType: 'subscription', relatedEntityId: subId,
      actionUrl: `/subscriptions/${subId}`, actionLabel: 'View Subscription',
      metadata: { subRef, planName },
    });
  }

  async subscriptionRenewed(userId: number, subId: number, subRef: string) {
    return this.dispatch({
      userId, eventCode: 'subscription_renewed', category: 'financial',
      body: `Subscription ${subRef} was renewed.`,
      relatedEntityType: 'subscription', relatedEntityId: subId,
      actionUrl: `/subscriptions/${subId}`, actionLabel: 'View Subscription',
      metadata: { subRef },
    });
  }

  async subscriptionCancelled(userId: number, subId: number, subRef: string) {
    return this.dispatch({
      userId, eventCode: 'subscription_cancelled', category: 'financial',
      body: `Subscription ${subRef} was cancelled.`,
      relatedEntityType: 'subscription', relatedEntityId: subId,
      actionUrl: `/subscriptions/${subId}`, actionLabel: 'View Subscription',
      metadata: { subRef },
    });
  }

  async subscriptionFailed(userId: number, subId: number, subRef: string) {
    return this.dispatch({
      userId, eventCode: 'subscription_failed', category: 'financial', priority: 'high',
      body: `Subscription ${subRef} payment failed.`,
      relatedEntityType: 'subscription', relatedEntityId: subId,
      actionUrl: `/subscriptions/${subId}`, actionLabel: 'View Subscription',
      metadata: { subRef },
    });
  }

  async ticketCreated(userId: number, ticketId: number, ticketRef: string, subject: string) {
    return this.dispatch({
      userId, eventCode: 'ticket_created', category: 'support',
      body: `Support ticket ${ticketRef}: ${subject}`,
      relatedEntityType: 'support_ticket', relatedEntityId: ticketId,
      actionUrl: `/support/${ticketId}`, actionLabel: 'View Ticket',
      metadata: { ticketRef, subject },
    });
  }

  async ticketAssigned(userId: number, ticketId: number, ticketRef: string) {
    return this.dispatch({
      userId, eventCode: 'ticket_assigned', category: 'support',
      body: `Ticket ${ticketRef} was assigned to you.`,
      relatedEntityType: 'support_ticket', relatedEntityId: ticketId,
      actionUrl: `/support/${ticketId}`, actionLabel: 'View Ticket',
      metadata: { ticketRef },
    });
  }

  async ticketEscalated(userId: number, ticketId: number, ticketRef: string) {
    return this.dispatch({
      userId, eventCode: 'ticket_escalated', category: 'support', priority: 'high',
      body: `Ticket ${ticketRef} was escalated.`,
      relatedEntityType: 'support_ticket', relatedEntityId: ticketId,
      actionUrl: `/support/${ticketId}`, actionLabel: 'View Ticket',
      metadata: { ticketRef },
    });
  }

  private inferCategory(eventCode: string): NotificationCategory {
    const map: Record<string, NotificationCategory> = {
      welcome: 'system',
      password_changed: 'security',
      mfa_enabled: 'security',
      merchant_approved: 'merchant',
      merchant_rejected: 'merchant',
      refund_processed: 'financial',
      settlement_completed: 'financial',
      payment_failed: 'transaction',
      broadcast: 'system',
      system_announcement: 'system',
      customer_created: 'support',
      customer_status_changed: 'support',
      refund_requested: 'financial',
      refund_rejected: 'financial',
      chargeback_opened: 'financial',
      chargeback_resolved: 'financial',
      chargeback_evidence_due: 'financial',
      payout_scheduled: 'financial',
      payout_completed: 'financial',
      payout_failed: 'financial',
      payment_link_created: 'financial',
      payment_link_expired: 'financial',
      payment_received: 'financial',
      invoice_created: 'financial',
      invoice_sent: 'financial',
      invoice_viewed: 'financial',
      invoice_reminder: 'financial',
      invoice_paid: 'financial',
      invoice_overdue: 'financial',
      qr_code_created: 'financial',
      qr_payment_received: 'financial',
      subscription_created: 'financial',
      subscription_renewed: 'financial',
      subscription_cancelled: 'financial',
      subscription_failed: 'financial',
      ticket_created: 'support',
      ticket_assigned: 'support',
      ticket_escalated: 'support',
      ticket_sla_breach: 'support',
      system_alert: 'system',
      incident_opened: 'system',
      retry_failed: 'system',
      background_job_failed: 'system',
    };
    return map[eventCode] ?? 'system';
  }

  private buildBody(eventCode: string, metadata: Record<string, unknown>): string {
    const vars: Record<string, string> = {};
    for (const [k, v] of Object.entries(metadata)) {
      vars[k] = String(v);
    }
    const templates: Record<string, string> = {
      welcome: 'Welcome to {{companyName}}! Your account is ready.',
      password_changed: 'Your password was successfully changed.',
      mfa_enabled: 'Multi-factor authentication has been enabled on your account.',
      merchant_approved: 'Merchant {{merchantName}} has been approved.',
      merchant_rejected: 'Merchant {{merchantName}} was rejected.',
      refund_processed: 'Refund of {{amount}} for {{transactionRef}} processed.',
      settlement_completed: 'Settlement {{settlementRef}} for {{amount}} completed.',
      payment_failed: 'Payment for {{transactionRef}} failed.',
      broadcast: '{{message}}',
      system_announcement: '{{message}}',
    };
    return interpolate(templates[eventCode] ?? 'You have a new notification.', vars);
  }
}

// Singleton for cross-module use
export const notificationDispatch = new NotificationDispatchService();
