import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';
import { getRequestContext } from '../../../shared/context/request-context';
import { NotFoundError, ValidationError } from '../../../shared/exceptions/app.exception';
import { env } from '../../../config';
import { backgroundJobService } from '../../../shared/jobs/background-job.service';
import { randomUUID } from 'node:crypto';
import { auditRecorder } from '../../audit';
import { notificationDispatch } from '../../notifications';
import { PaymentLinkService } from '../../payment-links/services/payment-link.service';
import { TransactionService } from '../../transactions/services/transaction.service';
import {
  CreateInvoiceBodyDto,
  EmailInvoiceBodyDto,
  InvoiceListQueryDto,
  MarkPaidBodyDto,
  UpdateInvoiceBodyDto,
} from '../dto';
import { EDITABLE_STATUSES, PAYABLE_STATUSES } from '../constants/invoices.constants';
import { calculateInvoiceTotals, InvoiceRepository } from '../repositories/invoice.repository';
import { InvoiceLineItemRow, InvoiceRow } from '../types/invoice.types';
import { generateInvoicePdf } from './invoice-pdf.service';

function mapLineItem(row: InvoiceLineItemRow) {
  return {
    id: row.id,
    description: row.description,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    tax: Number(row.tax_amount),
    discount: Number(row.discount_amount),
    lineTotal: Number(row.line_total),
  };
}

function mapInvoice(row: InvoiceRow, lineItems: InvoiceLineItemRow[] = [], includeInternal = true) {
  const publicUrl = row.payment_link_token
    ? `${env.corsOrigin.replace(/\/$/, '')}/pay/${row.payment_link_token}`
    : null;
  return {
    id: row.id,
    uuid: row.uuid,
    organizationId: row.organization_id,
    organizationName: row.organization_name ?? null,
    organizationCode: row.organization_code ?? null,
    merchantId: row.merchant_id,
    merchantName: row.merchant_name ?? null,
    merchantCode: row.merchant_code ?? null,
    customerId: row.customer_id,
    customerName: row.customer_name ?? null,
    customerEmail: row.customer_email ?? null,
    paymentLinkId: row.payment_link_id,
    paymentLink: row.payment_link_id ? {
      id: row.payment_link_id,
      linkRef: row.payment_link_ref ?? null,
      publicToken: row.payment_link_token ?? null,
      publicUrl,
      status: row.payment_link_status ?? null,
    } : null,
    invoiceNumber: row.invoice_number,
    referenceNumber: row.reference_number,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    currency: row.currency,
    status: row.status,
    notes: row.notes,
    internalNotes: includeInternal ? row.internal_notes : undefined,
    taxAmount: Number(row.tax_amount),
    discountAmount: Number(row.discount_amount),
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    amountPaid: Number(row.amount_paid),
    balanceDue: Number(row.balance_due),
    sentAt: row.sent_at,
    viewedAt: row.viewed_at,
    paidAt: row.paid_at,
    createdBy: row.created_by,
    createdByName: row.created_by_name ?? null,
    updatedBy: row.updated_by,
    updatedByName: row.updated_by_name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lineItems: lineItems.map(mapLineItem),
  };
}

export class InvoiceService {
  constructor(
    private readonly repo = new InvoiceRepository(),
    private readonly paymentLinkService = new PaymentLinkService(),
    private readonly transactionService = new TransactionService(),
  ) {}

  private async validateOrgEntities(merchantId: number, customerId: number) {
    const organizationId = getOrganizationId();
    if (!organizationId) throw new ValidationError('Organization context is required');
    if (!(await this.repo.validateMerchantInOrg(merchantId, organizationId))) {
      throw new ValidationError('Merchant does not belong to the current organization');
    }
    if (!(await this.repo.validateCustomerInOrg(customerId, organizationId))) {
      throw new ValidationError('Customer does not belong to the current organization');
    }
    return organizationId;
  }

  async list(query: InvoiceListQueryDto) {
    const { items, total } = await this.repo.findAll(query);
    const stats = await this.repo.getStatistics();
    return {
      items: items.map((row) => mapInvoice(row)),
      stats: {
        total: Number(stats.total),
        draft: Number(stats.draft_count),
        sent: Number(stats.sent_count),
        viewed: Number(stats.viewed_count),
        partiallyPaid: Number(stats.partially_paid_count),
        paid: Number(stats.paid_count),
        overdue: Number(stats.overdue_count),
        cancelled: Number(stats.cancelled_count),
        voided: Number(stats.voided_count),
        outstandingAmount: Number(stats.outstanding_amount),
        paidAmount: Number(stats.paid_amount),
        overdueAmount: Number(stats.overdue_amount),
        collectionRate: Number(stats.collection_rate),
      },
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) },
    };
  }

  async getStatistics() {
    const stats = await this.repo.getStatistics();
    return {
      total: Number(stats.total),
      draft: Number(stats.draft_count),
      sent: Number(stats.sent_count),
      viewed: Number(stats.viewed_count),
      partiallyPaid: Number(stats.partially_paid_count),
      paid: Number(stats.paid_count),
      overdue: Number(stats.overdue_count),
      cancelled: Number(stats.cancelled_count),
      voided: Number(stats.voided_count),
      outstandingAmount: Number(stats.outstanding_amount),
      paidAmount: Number(stats.paid_amount),
      overdueAmount: Number(stats.overdue_amount),
      collectionRate: Number(stats.collection_rate),
    };
  }

  async getById(id: number) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('Invoice not found');
    const lineItems = await this.repo.findLineItems(id);
    const payments = await this.repo.findPayments(id);
    return {
      ...mapInvoice(row, lineItems),
      payments: payments.map((p) => ({
        id: p.id,
        transactionId: p.transaction_id,
        transactionRef: p.transaction_ref ?? null,
        paymentLinkId: p.payment_link_id,
        amount: Number(p.amount),
        paymentMethod: p.payment_method,
        notes: p.notes,
        createdByName: p.created_by_name ?? null,
        createdAt: p.created_at,
      })),
    };
  }

  async create(dto: CreateInvoiceBodyDto, actorId?: number) {
    const organizationId = await this.validateOrgEntities(dto.merchantId, dto.customerId);
    const totals = calculateInvoiceTotals(dto.lineItems, dto.taxAmount, dto.discountAmount);
    const pool = getPool();
    const conn = await pool.getConnection();
    let invoiceId = 0;
    try {
      await conn.beginTransaction();
      invoiceId = await this.repo.create(conn, {
        organizationId,
        merchantId: dto.merchantId,
        customerId: dto.customerId,
        invoiceNumber: this.repo.generateInvoiceNumber(),
        referenceNumber: dto.referenceNumber,
        issueDate: dto.issueDate,
        dueDate: dto.dueDate,
        currency: dto.currency ?? 'USD',
        notes: dto.notes,
        internalNotes: dto.internalNotes,
        totals,
        userId: actorId,
      });
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    if (dto.generatePaymentLink) {
      await this.createPaymentLinkForInvoice(invoiceId, actorId);
    }

    const detail = await this.getById(invoiceId);
    void auditRecorder.record({
      module: 'invoices', categoryCode: 'transactions', actionCode: 'invoice_created',
      entityType: 'invoice', entityId: String(invoiceId),
      description: `Created invoice ${detail.invoiceNumber}.`,
      afterValues: { total: detail.total, customerId: dto.customerId },
      riskLevel: 'low', userId: actorId,
    }).catch(() => {});
    if (actorId) {
      void notificationDispatch.invoiceCreated(actorId, invoiceId, detail.invoiceNumber, String(detail.total), detail.currency).catch(() => {});
    }
    return detail;
  }

  async update(id: number, dto: UpdateInvoiceBodyDto, actorId?: number) {
    const before = await this.getById(id);
    if (!EDITABLE_STATUSES.includes(before.status as typeof EDITABLE_STATUSES[number])) {
      throw new ValidationError('Only draft invoices can be edited');
    }
    if (dto.merchantId && dto.customerId) {
      await this.validateOrgEntities(dto.merchantId, dto.customerId);
    } else if (dto.merchantId) {
      await this.validateOrgEntities(dto.merchantId, before.customerId);
    } else if (dto.customerId) {
      await this.validateOrgEntities(before.merchantId, dto.customerId);
    }

    const totals = dto.lineItems
      ? calculateInvoiceTotals(dto.lineItems, dto.taxAmount ?? before.taxAmount, dto.discountAmount ?? before.discountAmount)
      : undefined;

    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await this.repo.update(conn, id, {
        merchantId: dto.merchantId,
        customerId: dto.customerId,
        referenceNumber: dto.referenceNumber,
        issueDate: dto.issueDate,
        dueDate: dto.dueDate,
        currency: dto.currency,
        notes: dto.notes,
        internalNotes: dto.internalNotes,
        totals,
        userId: actorId,
      });
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    const detail = await this.getById(id);
    if (detail.paymentLinkId && totals) {
      await this.paymentLinkService.update(detail.paymentLinkId, {
        amount: detail.balanceDue,
        title: `Invoice ${detail.invoiceNumber}`,
        expiresAt: detail.dueDate,
      }, actorId);
    }

    void auditRecorder.record({
      module: 'invoices', categoryCode: 'transactions', actionCode: 'invoice_updated',
      entityType: 'invoice', entityId: String(id),
      description: `Updated invoice ${detail.invoiceNumber}.`,
      beforeValues: { total: before.total }, afterValues: { total: detail.total },
      riskLevel: 'low', userId: actorId,
    }).catch(() => {});
    return detail;
  }

  async duplicate(id: number, actorId?: number) {
    const source = await this.getById(id);
    return this.create({
      merchantId: source.merchantId,
      customerId: source.customerId,
      referenceNumber: source.referenceNumber ?? undefined,
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: source.dueDate,
      currency: source.currency,
      notes: source.notes ?? undefined,
      internalNotes: source.internalNotes ?? undefined,
      taxAmount: source.taxAmount,
      discountAmount: source.discountAmount,
      lineItems: source.lineItems.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        tax: li.tax,
        discount: li.discount,
      })),
      generatePaymentLink: false,
    }, actorId);
  }

  async voidInvoice(id: number, actorId?: number) {
    const before = await this.getById(id);
    if (['voided', 'paid'].includes(before.status)) {
      throw new ValidationError('Invoice cannot be voided in its current status');
    }
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await this.repo.setStatus(conn, id, 'voided', actorId);
      await conn.commit();
    } finally {
      conn.release();
    }
    if (before.paymentLinkId) await this.paymentLinkService.disable(before.paymentLinkId, actorId);
    void auditRecorder.record({
      module: 'invoices', categoryCode: 'transactions', actionCode: 'invoice_voided',
      entityType: 'invoice', entityId: String(id),
      description: `Voided invoice ${before.invoiceNumber}.`,
      riskLevel: 'high', userId: actorId,
    }).catch(() => {});
    return this.getById(id);
  }

  async cancel(id: number, actorId?: number) {
    const before = await this.getById(id);
    if (['cancelled', 'voided', 'paid'].includes(before.status)) {
      throw new ValidationError('Invoice cannot be cancelled in its current status');
    }
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await this.repo.setStatus(conn, id, 'cancelled', actorId);
      await conn.commit();
    } finally {
      conn.release();
    }
    if (before.paymentLinkId) await this.paymentLinkService.disable(before.paymentLinkId, actorId);
    void auditRecorder.record({
      module: 'invoices', categoryCode: 'transactions', actionCode: 'invoice_cancelled',
      entityType: 'invoice', entityId: String(id),
      description: `Cancelled invoice ${before.invoiceNumber}.`,
      riskLevel: 'medium', userId: actorId,
    }).catch(() => {});
    return this.getById(id);
  }

  async markSent(id: number, actorId?: number) {
    const before = await this.getById(id);
    if (before.status !== 'draft') throw new ValidationError('Only draft invoices can be marked as sent');
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await this.repo.setStatus(conn, id, 'sent', actorId, { sentAt: new Date() });
      await conn.commit();
    } finally {
      conn.release();
    }
    void auditRecorder.record({
      module: 'invoices', categoryCode: 'transactions', actionCode: 'invoice_sent',
      entityType: 'invoice', entityId: String(id),
      description: `Sent invoice ${before.invoiceNumber}.`,
      riskLevel: 'low', userId: actorId,
    }).catch(() => {});
    if (actorId) {
      void notificationDispatch.invoiceSent(actorId, id, before.invoiceNumber, before.customerName ?? 'Customer').catch(() => {});
    }
    return this.getById(id);
  }

  async markViewed(id: number, actorId?: number) {
    const before = await this.getById(id);
    if (!['sent', 'viewed', 'partially_paid', 'overdue'].includes(before.status)) {
      throw new ValidationError('Invoice cannot be marked as viewed');
    }
    if (before.status === 'viewed') return before;
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await this.repo.setStatus(conn, id, 'viewed', actorId, { viewedAt: new Date() });
      await conn.commit();
    } finally {
      conn.release();
    }
    if (before.createdBy) {
      void notificationDispatch.invoiceViewed(before.createdBy, id, before.invoiceNumber).catch(() => {});
    }
    return this.getById(id);
  }

  async markOverdue(id: number, actorId?: number) {
    const before = await this.getById(id);
    if (!PAYABLE_STATUSES.includes(before.status as typeof PAYABLE_STATUSES[number])) {
      throw new ValidationError('Invoice cannot be marked as overdue');
    }
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await this.repo.setStatus(conn, id, 'overdue', actorId);
      await conn.commit();
    } finally {
      conn.release();
    }
    if (before.createdBy) {
      void notificationDispatch.invoiceOverdue(before.createdBy, id, before.invoiceNumber, String(before.balanceDue), before.currency).catch(() => {});
    }
    return this.getById(id);
  }

  async markPaid(id: number, dto: MarkPaidBodyDto, actorId?: number) {
    const before = await this.getById(id);
    if (!PAYABLE_STATUSES.includes(before.status as typeof PAYABLE_STATUSES[number]) && before.status !== 'draft') {
      throw new ValidationError('Invoice cannot be marked as paid in its current status');
    }
    const amount = dto.amount ?? before.balanceDue;
    if (amount <= 0) throw new ValidationError('Invalid payment amount');

    const transaction = await this.transactionService.create({
      merchantId: before.merchantId,
      amount,
      currency: before.currency,
      paymentMethodTypeId: 1,
      paymentMethodDetail: 'Manual Invoice Payment',
      customerName: before.customerName ?? undefined,
      customerEmail: before.customerEmail ?? undefined,
      description: `Payment for invoice ${before.invoiceNumber}`,
    });
    await this.transactionService.updateStatus(transaction.id, { statusCode: 'settled' });

    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await this.repo.recordPayment(conn, id, amount, {
        transactionId: transaction.id,
        paymentMethod: 'manual',
        notes: dto.notes,
        userId: actorId,
      });
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    void auditRecorder.record({
      module: 'invoices', categoryCode: 'transactions', actionCode: 'invoice_paid',
      entityType: 'invoice', entityId: String(id),
      description: `Manual payment of ${amount} ${before.currency} recorded for invoice ${before.invoiceNumber}.`,
      afterValues: { transactionId: transaction.id, amount },
      riskLevel: 'medium', userId: actorId,
    }).catch(() => {});
    if (actorId) {
      void notificationDispatch.invoicePaid(actorId, id, before.invoiceNumber, String(amount), before.currency).catch(() => {});
    }
    return this.getById(id);
  }

  async downloadPdf(id: number): Promise<{ buffer: Buffer; filename: string }> {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('Invoice not found');
    const lineItems = await this.repo.findLineItems(id);
    const buffer = await generateInvoicePdf(row, lineItems);
    return { buffer, filename: `${row.invoice_number}.pdf` };
  }

  async emailInvoice(id: number, dto: EmailInvoiceBodyDto, actorId?: number) {
    const invoice = await this.getById(id);
    const recipient = dto.recipientEmail ?? invoice.customerEmail;
    if (!recipient) throw new ValidationError('Recipient email is required');

    if (invoice.status === 'draft') {
      await this.markSent(id, actorId);
    }

    if (actorId) {
      void notificationDispatch.invoiceSent(actorId, id, invoice.invoiceNumber, invoice.customerName ?? recipient).catch(() => {});
    }

    const correlationId = getRequestContext()?.requestId ?? randomUUID();
    await backgroundJobService.enqueue('invoice_email', {
      invoiceId: id,
      recipient,
      subject: `Invoice ${invoice.invoiceNumber}`,
      message: dto.message ?? `Invoice ${invoice.invoiceNumber} has been sent to ${recipient}.`,
      correlationId,
    }, invoice.organizationId ?? undefined);

    return {
      queued: true,
      recipient,
      invoiceNumber: invoice.invoiceNumber,
      message: dto.message ?? `Invoice ${invoice.invoiceNumber} has been sent to ${recipient}.`,
    };
  }

  private async createPaymentLinkForInvoice(invoiceId: number, actorId?: number) {
    const invoice = await this.getById(invoiceId);
    const link = await this.paymentLinkService.create({
      merchantId: invoice.merchantId,
      customerId: invoice.customerId,
      title: `Invoice ${invoice.invoiceNumber}`,
      description: invoice.notes ?? `Payment for invoice ${invoice.invoiceNumber}`,
      amount: invoice.balanceDue,
      currency: invoice.currency,
      allowCustomAmount: false,
      expiresAt: invoice.dueDate,
      maxUsage: 10,
    }, actorId);
    await this.repo.setPaymentLinkId(invoiceId, link.id, actorId);
    return link;
  }

  async generatePaymentLink(id: number, actorId?: number) {
    const invoice = await this.getById(id);
    if (invoice.paymentLinkId) throw new ValidationError('Invoice already has a payment link');
    if (invoice.balanceDue <= 0) throw new ValidationError('Invoice has no balance due');
    const link = await this.createPaymentLinkForInvoice(id, actorId);
    return { ...await this.getById(id), paymentLinkCreated: link };
  }

  async regeneratePaymentLink(id: number, actorId?: number) {
    const invoice = await this.getById(id);
    if (!invoice.paymentLinkId) return this.generatePaymentLink(id, actorId);
    await this.paymentLinkService.regenerateToken(invoice.paymentLinkId, actorId);
    await this.paymentLinkService.update(invoice.paymentLinkId, {
      amount: invoice.balanceDue,
      expiresAt: invoice.dueDate,
    }, actorId);
    await this.paymentLinkService.enable(invoice.paymentLinkId, actorId);
    return this.getById(id);
  }

  async disablePaymentLink(id: number, actorId?: number) {
    const invoice = await this.getById(id);
    if (!invoice.paymentLinkId) throw new ValidationError('Invoice has no payment link');
    await this.paymentLinkService.disable(invoice.paymentLinkId, actorId);
    return this.getById(id);
  }

  async getRevenueByMonth() {
    const rows = await this.repo.getRevenueByMonth();
    return rows.map((r) => ({
      month: r.month,
      invoiceCount: Number(r.invoice_count),
      revenue: Number(r.revenue),
    }));
  }

  async listTemplates(query: { page: number; pageSize: number }) {
    const { items, total } = await this.repo.listTemplates(query);
    return {
      items: items.map((r) => ({
        id: r.id, uuid: r.uuid, code: r.code, name: r.name, isDefault: Boolean(r.is_default), createdAt: r.created_at,
      })),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) || 1 },
    };
  }

  async getTemplate(id: number) {
    const row = await this.repo.findTemplate(id);
    if (!row) throw new NotFoundError('Invoice template not found');
    return {
      id: row.id, uuid: row.uuid, code: row.code, name: row.name,
      headerHtml: row.header_html, footerHtml: row.footer_html,
      taxBreakdown: Boolean(row.tax_breakdown), isDefault: Boolean(row.is_default), createdAt: row.created_at,
    };
  }

  async createTemplate(dto: Record<string, unknown>, actorId?: number) {
    const orgId = getOrganizationId();
    if (!orgId) throw new ValidationError('Organization context is required');
    const id = await this.repo.createTemplate(dto, orgId);
    void actorId;
    return this.getTemplate(id);
  }

  async updateTemplate(id: number, dto: Record<string, unknown>, actorId?: number) {
    if (!(await this.repo.findTemplate(id))) throw new NotFoundError('Invoice template not found');
    void actorId;
    await this.repo.updateTemplate(id, dto);
    return this.getTemplate(id);
  }

  async deleteTemplate(id: number, actorId?: number) {
    if (!(await this.repo.findTemplate(id))) throw new NotFoundError('Invoice template not found');
    void actorId;
    await this.repo.deleteTemplate(id);
    return { deleted: true };
  }

  async listCreditNotes(query: { page: number; pageSize: number }) {
    const { items, total } = await this.repo.listCreditNotes(query);
    return {
      items: items.map((r) => ({
        id: r.id, uuid: r.uuid, creditRef: r.credit_ref, invoiceId: r.invoice_id,
        amount: Number(r.amount), currency: r.currency, status: r.status, reason: r.reason, createdAt: r.created_at,
      })),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) || 1 },
    };
  }

  async createCreditNote(dto: Record<string, unknown>, actorId?: number) {
    const orgId = getOrganizationId();
    if (!orgId) throw new ValidationError('Organization context is required');
    void actorId;
    const id = await this.repo.createCreditNote(dto, orgId);
    const { items } = await this.repo.listCreditNotes({ page: 1, pageSize: 1 });
    return items.find((r) => r.id === id) ?? { id };
  }

  async listDebitNotes(query: { page: number; pageSize: number }) {
    const { items, total } = await this.repo.listDebitNotes(query);
    return {
      items: items.map((r) => ({
        id: r.id, uuid: r.uuid, debitRef: r.debit_ref, invoiceId: r.invoice_id,
        amount: Number(r.amount), currency: r.currency, status: r.status, reason: r.reason, createdAt: r.created_at,
      })),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) || 1 },
    };
  }

  async createDebitNote(dto: Record<string, unknown>, actorId?: number) {
    const orgId = getOrganizationId();
    if (!orgId) throw new ValidationError('Organization context is required');
    void actorId;
    const id = await this.repo.createDebitNote(dto, orgId);
    const { items } = await this.repo.listDebitNotes({ page: 1, pageSize: 1 });
    return items.find((r) => r.id === id) ?? { id };
  }

  async getAnalytics() {
    const data = await this.repo.getInvoiceAnalytics();
    return {
      summary: {
        total: Number(data.summary?.total ?? 0), paid: Number(data.summary?.paid ?? 0),
        overdue: Number(data.summary?.overdue ?? 0),
        totalBilled: Number(data.summary?.total_billed ?? 0),
        totalCollected: Number(data.summary?.total_collected ?? 0),
      },
      revenueByMonth: (data.revenueByMonth ?? []).map((r) => ({
        month: (r as Record<string, unknown>).month as string,
        invoiceCount: Number((r as Record<string, unknown>).invoice_count ?? 0),
        revenue: Number((r as Record<string, unknown>).revenue ?? 0),
      })),
    };
  }

  async getPdfMetadata(id: number) {
    const meta = await this.repo.getPdfMetadata(id);
    if (!meta) throw new NotFoundError('Invoice not found');
    return meta;
  }
}
