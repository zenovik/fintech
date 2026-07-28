import { randomUUID } from 'crypto';
import { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { appendMerchantOrgFilter, getOrganizationId } from '../../../shared/context/org-context';
import { InvoiceListQueryDto } from '../dto';
import { InvoiceLineItemInput, InvoiceLineItemRow, InvoicePaymentRow, InvoiceRow, InvoiceStatisticsRow, InvoiceTotals } from '../types/invoice.types';

export function calculateInvoiceTotals(
  lineItems: InvoiceLineItemInput[],
  headerTax = 0,
  headerDiscount = 0,
): InvoiceTotals {
  let subtotal = 0;
  let lineTax = 0;
  let lineDiscount = 0;
  const computedItems = lineItems.map((item) => {
    const base = item.quantity * item.unitPrice;
    const tax = item.tax ?? 0;
    const discount = item.discount ?? 0;
    const lineTotal = base - discount + tax;
    subtotal += base;
    lineTax += tax;
    lineDiscount += discount;
    return { ...item, tax, discount, lineTotal };
  });
  const taxAmount = lineTax + headerTax;
  const discountAmount = lineDiscount + headerDiscount;
  const total = subtotal - discountAmount + taxAmount;
  return { subtotal, taxAmount, discountAmount, total, lineItems: computedItems };
}

export class InvoiceRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  private baseSelect = `
    SELECT i.*,
           o.display_name AS organization_name, o.code AS organization_code,
           m.display_name AS merchant_name, m.merchant_code,
           c.display_name AS customer_name, c.email AS customer_email,
           CONCAT(cb.first_name, ' ', cb.last_name) AS created_by_name,
           CONCAT(ub.first_name, ' ', ub.last_name) AS updated_by_name,
           pl.link_ref AS payment_link_ref, pl.public_token AS payment_link_token, pl.status AS payment_link_status
    FROM invoices i
    JOIN organizations o ON o.id = i.organization_id
    JOIN merchants m ON m.id = i.merchant_id
    JOIN customers c ON c.id = i.customer_id
    LEFT JOIN users cb ON cb.id = i.created_by
    LEFT JOIN users ub ON ub.id = i.updated_by
    LEFT JOIN payment_links pl ON pl.id = i.payment_link_id
  `;

  generateInvoiceNumber(): string {
    return `INV-${String(Math.floor(100000 + Math.random() * 900000))}`;
  }

  async findAll(query: InvoiceListQueryDto): Promise<{ items: InvoiceRow[]; total: number }> {
    const { page, pageSize, search, status, merchantId, customerId, dateFrom, dateTo, sortBy, sortOrder } = query;
    const conditions = ['i.deleted_at IS NULL'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('i.organization_id = ?'); params.push(orgId); }
    if (search) {
      conditions.push('(i.invoice_number LIKE ? OR i.reference_number LIKE ? OR c.display_name LIKE ? OR m.display_name LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }
    if (status) { conditions.push('i.status = ?'); params.push(status); }
    if (merchantId) { conditions.push('i.merchant_id = ?'); params.push(merchantId); }
    if (customerId) { conditions.push('i.customer_id = ?'); params.push(customerId); }
    if (dateFrom) { conditions.push('DATE(i.issue_date) >= ?'); params.push(dateFrom); }
    if (dateTo) { conditions.push('DATE(i.issue_date) <= ?'); params.push(dateTo); }
    appendMerchantOrgFilter(conditions, params);
    const where = `WHERE ${conditions.join(' AND ')}`;
    const allowedSort = ['created_at', 'issue_date', 'due_date', 'total', 'status', 'invoice_number'];
    const sortCol = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const offset = (page - 1) * pageSize;

    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM invoices i JOIN merchants m ON m.id = i.merchant_id JOIN customers c ON c.id = i.customer_id ${where}`,
      params,
    );
    const total = Number(countRows[0]?.total ?? 0);
    const [rows] = await this.pool.query<InvoiceRow[]>(
      `${this.baseSelect} ${where} ORDER BY i.${sortCol} ${order} LIMIT ? OFFSET ?`,
      [...params, pageSize, offset],
    );
    return { items: rows, total };
  }

  async getStatistics(): Promise<InvoiceStatisticsRow> {
    const conditions = ['i.deleted_at IS NULL'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('i.organization_id = ?'); params.push(orgId); }
    appendMerchantOrgFilter(conditions, params, 'm');
    const where = conditions.join(' AND ');
    const [rows] = await this.pool.query<InvoiceStatisticsRow[]>(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN i.status = 'draft' THEN 1 ELSE 0 END) AS draft_count,
              SUM(CASE WHEN i.status = 'sent' THEN 1 ELSE 0 END) AS sent_count,
              SUM(CASE WHEN i.status = 'viewed' THEN 1 ELSE 0 END) AS viewed_count,
              SUM(CASE WHEN i.status = 'partially_paid' THEN 1 ELSE 0 END) AS partially_paid_count,
              SUM(CASE WHEN i.status = 'paid' THEN 1 ELSE 0 END) AS paid_count,
              SUM(CASE WHEN i.status = 'overdue' THEN 1 ELSE 0 END) AS overdue_count,
              SUM(CASE WHEN i.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
              SUM(CASE WHEN i.status = 'voided' THEN 1 ELSE 0 END) AS voided_count,
              COALESCE(SUM(CASE WHEN i.status IN ('sent','viewed','partially_paid','overdue') THEN i.balance_due ELSE 0 END), 0) AS outstanding_amount,
              COALESCE(SUM(i.amount_paid), 0) AS paid_amount,
              COALESCE(SUM(CASE WHEN i.status = 'overdue' THEN i.balance_due ELSE 0 END), 0) AS overdue_amount,
              CASE WHEN COALESCE(SUM(i.total), 0) > 0
                THEN ROUND(COALESCE(SUM(i.amount_paid), 0) / SUM(i.total) * 100, 2)
                ELSE 0 END AS collection_rate
       FROM invoices i JOIN merchants m ON m.id = i.merchant_id WHERE ${where}`,
      params,
    );
    return rows[0]!;
  }

  async findById(id: number): Promise<InvoiceRow | null> {
    const conditions = ['i.id = ?', 'i.deleted_at IS NULL'];
    const params: unknown[] = [id];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('i.organization_id = ?'); params.push(orgId); }
    const [rows] = await this.pool.query<InvoiceRow[]>(
      `${this.baseSelect} WHERE ${conditions.join(' AND ')}`,
      params,
    );
    return rows[0] ?? null;
  }

  async findByPaymentLinkId(paymentLinkId: number): Promise<InvoiceRow | null> {
    const [rows] = await this.pool.query<InvoiceRow[]>(
      `${this.baseSelect} WHERE i.payment_link_id = ? AND i.deleted_at IS NULL LIMIT 1`,
      [paymentLinkId],
    );
    return rows[0] ?? null;
  }

  async findLineItems(invoiceId: number): Promise<InvoiceLineItemRow[]> {
    const [rows] = await this.pool.query<InvoiceLineItemRow[]>(
      `SELECT * FROM invoice_line_items WHERE invoice_id = ? ORDER BY sort_order ASC, id ASC`,
      [invoiceId],
    );
    return rows;
  }

  async findPayments(invoiceId: number): Promise<InvoicePaymentRow[]> {
    const [rows] = await this.pool.query<InvoicePaymentRow[]>(
      `SELECT ip.*, t.transaction_ref,
              CONCAT(u.first_name, ' ', u.last_name) AS created_by_name
       FROM invoice_payments ip
       LEFT JOIN transactions t ON t.id = ip.transaction_id
       LEFT JOIN users u ON u.id = ip.created_by
       WHERE ip.invoice_id = ?
       ORDER BY ip.created_at DESC`,
      [invoiceId],
    );
    return rows;
  }

  async create(
    conn: PoolConnection,
    data: {
      organizationId: number;
      merchantId: number;
      customerId: number;
      invoiceNumber: string;
      referenceNumber?: string;
      issueDate: string;
      dueDate: string;
      currency: string;
      notes?: string;
      internalNotes?: string;
      totals: InvoiceTotals;
      userId?: number;
      paymentLinkId?: number;
    },
  ): Promise<number> {
    const { totals } = data;
    const [result] = await conn.query<ResultSetHeader>(
      `INSERT INTO invoices (
        uuid, organization_id, merchant_id, customer_id, payment_link_id,
        invoice_number, reference_number, issue_date, due_date, currency,
        notes, internal_notes, tax_amount, discount_amount, subtotal, total,
        amount_paid, balance_due, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        randomUUID(), data.organizationId, data.merchantId, data.customerId, data.paymentLinkId ?? null,
        data.invoiceNumber, data.referenceNumber ?? null, data.issueDate, data.dueDate, data.currency,
        data.notes ?? null, data.internalNotes ?? null,
        totals.taxAmount, totals.discountAmount, totals.subtotal, totals.total, totals.total, data.userId ?? null,
      ],
    );
    const invoiceId = result.insertId;
    await this.replaceLineItems(conn, invoiceId, totals.lineItems);
    return invoiceId;
  }

  async replaceLineItems(
    conn: PoolConnection,
    invoiceId: number,
    items: InvoiceTotals['lineItems'],
  ): Promise<void> {
    await conn.query(`DELETE FROM invoice_line_items WHERE invoice_id = ?`, [invoiceId]);
    for (let i = 0; i < items.length; i++) {
      const item = items[i]!;
      await conn.query(
        `INSERT INTO invoice_line_items (invoice_id, sort_order, description, quantity, unit_price, tax_amount, discount_amount, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [invoiceId, i, item.description, item.quantity, item.unitPrice, item.tax ?? 0, item.discount ?? 0, item.lineTotal],
      );
    }
  }

  async update(
    conn: PoolConnection,
    id: number,
    data: {
      merchantId?: number;
      customerId?: number;
      referenceNumber?: string;
      issueDate?: string;
      dueDate?: string;
      currency?: string;
      notes?: string;
      internalNotes?: string;
      totals?: InvoiceTotals;
      userId?: number;
      paymentLinkId?: number | null;
    },
  ): Promise<void> {
    const fields: string[] = [];
    const params: unknown[] = [];
    if (data.merchantId !== undefined) { fields.push('merchant_id = ?'); params.push(data.merchantId); }
    if (data.customerId !== undefined) { fields.push('customer_id = ?'); params.push(data.customerId); }
    if (data.referenceNumber !== undefined) { fields.push('reference_number = ?'); params.push(data.referenceNumber || null); }
    if (data.issueDate !== undefined) { fields.push('issue_date = ?'); params.push(data.issueDate); }
    if (data.dueDate !== undefined) { fields.push('due_date = ?'); params.push(data.dueDate); }
    if (data.currency !== undefined) { fields.push('currency = ?'); params.push(data.currency); }
    if (data.notes !== undefined) { fields.push('notes = ?'); params.push(data.notes || null); }
    if (data.internalNotes !== undefined) { fields.push('internal_notes = ?'); params.push(data.internalNotes || null); }
    if (data.paymentLinkId !== undefined) { fields.push('payment_link_id = ?'); params.push(data.paymentLinkId); }
    if (data.totals) {
      fields.push('tax_amount = ?', 'discount_amount = ?', 'subtotal = ?', 'total = ?', 'balance_due = ?');
      params.push(data.totals.taxAmount, data.totals.discountAmount, data.totals.subtotal, data.totals.total,
        data.totals.total - (await this.getAmountPaid(id)));
    }
    if (!fields.length && !data.totals) return;
    fields.push('updated_by = ?');
    params.push(data.userId ?? null, id);
    await conn.query(`UPDATE invoices SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`, params);
    if (data.totals) await this.replaceLineItems(conn, id, data.totals.lineItems);
  }

  async getAmountPaid(invoiceId: number): Promise<number> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT amount_paid FROM invoices WHERE id = ? LIMIT 1`,
      [invoiceId],
    );
    return Number(rows[0]?.amount_paid ?? 0);
  }

  async setStatus(conn: PoolConnection, id: number, status: string, userId?: number, extra?: Record<string, unknown>): Promise<void> {
    const fields = ['status = ?', 'updated_by = ?'];
    const params: unknown[] = [status, userId ?? null];
    if (extra?.sentAt) { fields.push('sent_at = ?'); params.push(extra.sentAt); }
    if (extra?.viewedAt) { fields.push('viewed_at = ?'); params.push(extra.viewedAt); }
    if (extra?.paidAt) { fields.push('paid_at = ?'); params.push(extra.paidAt); }
    params.push(id);
    await conn.query(`UPDATE invoices SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`, params);
  }

  async recordPayment(
    conn: PoolConnection,
    invoiceId: number,
    amount: number,
    opts: { transactionId?: number; paymentLinkId?: number; paymentMethod?: string; notes?: string; userId?: number },
  ): Promise<void> {
    await conn.query(
      `INSERT INTO invoice_payments (invoice_id, transaction_id, payment_link_id, amount, payment_method, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [invoiceId, opts.transactionId ?? null, opts.paymentLinkId ?? null, amount, opts.paymentMethod ?? null, opts.notes ?? null, opts.userId ?? null],
    );
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT total, amount_paid FROM invoices WHERE id = ? FOR UPDATE`,
      [invoiceId],
    );
    const total = Number(rows[0]?.total ?? 0);
    const newPaid = Number(rows[0]?.amount_paid ?? 0) + amount;
    const balance = Math.max(0, total - newPaid);
    let status = 'partially_paid';
    if (balance <= 0.009) status = 'paid';
    await conn.query(
      `UPDATE invoices SET amount_paid = ?, balance_due = ?, status = ?,
       paid_at = CASE WHEN ? = 'paid' THEN NOW() ELSE paid_at END,
       updated_at = NOW() WHERE id = ?`,
      [newPaid, balance, status, status, invoiceId],
    );
  }

  async setPaymentLinkId(id: number, paymentLinkId: number | null, userId?: number): Promise<void> {
    await this.pool.query(
      `UPDATE invoices SET payment_link_id = ?, updated_by = ? WHERE id = ? AND deleted_at IS NULL`,
      [paymentLinkId, userId ?? null, id],
    );
  }

  async validateMerchantInOrg(merchantId: number, organizationId: number): Promise<boolean> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id FROM merchants WHERE id = ? AND organization_id = ? AND deleted_at IS NULL LIMIT 1`,
      [merchantId, organizationId],
    );
    return !!rows[0];
  }

  async validateCustomerInOrg(customerId: number, organizationId: number): Promise<boolean> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id FROM customers WHERE id = ? AND organization_id = ? AND deleted_at IS NULL LIMIT 1`,
      [customerId, organizationId],
    );
    return !!rows[0];
  }

  async getRevenueByMonth(periodMonths = 12): Promise<RowDataPacket[]> {
    const orgId = getOrganizationId();
    const orgClause = orgId ? ' AND i.organization_id = ?' : '';
    const params = orgId ? [periodMonths, orgId] : [periodMonths];
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(i.paid_at, '%Y-%m') AS month,
              COUNT(*) AS invoice_count,
              COALESCE(SUM(i.amount_paid), 0) AS revenue
       FROM invoices i
       WHERE i.deleted_at IS NULL AND i.status = 'paid' AND i.paid_at IS NOT NULL
         AND i.paid_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)${orgClause}
       GROUP BY DATE_FORMAT(i.paid_at, '%Y-%m')
       ORDER BY month ASC`,
      params,
    );
    return rows;
  }

  async listTemplates(query: { page: number; pageSize: number }) {
    const orgId = getOrganizationId();
    const params: unknown[] = orgId ? [orgId] : [];
    const orgClause = orgId ? ' WHERE organization_id = ?' : '';
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM invoice_templates${orgClause}`, params);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT * FROM invoice_templates${orgClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async findTemplate(id: number) {
    const orgId = getOrganizationId();
    const params: unknown[] = [id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND organization_id = ?'; params.push(orgId); }
    const [rows] = await this.pool.query<RowDataPacket[]>(`SELECT * FROM invoice_templates WHERE id = ?${orgClause}`, params);
    return rows[0] ?? null;
  }

  async createTemplate(data: Record<string, unknown>, orgId: number): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO invoice_templates (uuid, organization_id, code, name, header_html, footer_html, tax_breakdown, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), orgId, data.code, data.name, data.headerHtml ?? null, data.footerHtml ?? null, data.taxBreakdown ?? 1, data.isDefault ?? 0],
    );
    return result.insertId;
  }

  async updateTemplate(id: number, data: Record<string, unknown>): Promise<void> {
    const orgId = getOrganizationId();
    const params: unknown[] = [data.name, data.headerHtml ?? null, data.footerHtml ?? null, data.taxBreakdown ?? 1, data.isDefault ?? 0, id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND organization_id = ?'; params.push(orgId); }
    await this.pool.query(
      `UPDATE invoice_templates SET name = ?, header_html = ?, footer_html = ?, tax_breakdown = ?, is_default = ? WHERE id = ?${orgClause}`, params,
    );
  }

  async deleteTemplate(id: number): Promise<void> {
    const orgId = getOrganizationId();
    const params: unknown[] = [id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND organization_id = ?'; params.push(orgId); }
    await this.pool.query(`DELETE FROM invoice_templates WHERE id = ?${orgClause}`, params);
  }

  async listCreditNotes(query: { page: number; pageSize: number }) {
    const orgId = getOrganizationId();
    const params: unknown[] = [];
    let orgClause = '';
    if (orgId) { orgClause = ' WHERE organization_id = ?'; params.push(orgId); }
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM credit_notes${orgClause}`, params);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT * FROM credit_notes${orgClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async createCreditNote(data: Record<string, unknown>, orgId: number): Promise<number> {
    const creditRef = `CN-${Date.now().toString(36).toUpperCase()}`;
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO credit_notes (uuid, organization_id, merchant_id, invoice_id, credit_ref, amount, currency, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), orgId, data.merchantId, data.invoiceId, creditRef, data.amount, data.currency ?? 'USD', data.reason ?? null, data.status ?? 'draft'],
    );
    return result.insertId;
  }

  async listDebitNotes(query: { page: number; pageSize: number }) {
    const orgId = getOrganizationId();
    const params: unknown[] = [];
    let orgClause = '';
    if (orgId) { orgClause = ' WHERE organization_id = ?'; params.push(orgId); }
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM debit_notes${orgClause}`, params);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT * FROM debit_notes${orgClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async createDebitNote(data: Record<string, unknown>, orgId: number): Promise<number> {
    const debitRef = `DN-${Date.now().toString(36).toUpperCase()}`;
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO debit_notes (uuid, organization_id, merchant_id, invoice_id, debit_ref, amount, currency, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), orgId, data.merchantId, data.invoiceId ?? null, debitRef, data.amount, data.currency ?? 'USD', data.reason ?? null, data.status ?? 'draft'],
    );
    return result.insertId;
  }

  async getInvoiceAnalytics() {
    const orgId = getOrganizationId();
    const params: unknown[] = [];
    let orgClause = '';
    if (orgId) { orgClause = ' AND organization_id = ?'; params.push(orgId); }
    const [stats] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status='paid' THEN 1 ELSE 0 END) AS paid,
              SUM(CASE WHEN status='overdue' THEN 1 ELSE 0 END) AS overdue,
              COALESCE(SUM(total), 0) AS total_billed,
              COALESCE(SUM(amount_paid), 0) AS total_collected
       FROM invoices WHERE deleted_at IS NULL${orgClause}`, params,
    );
    const revenue = await this.getRevenueByMonth(6);
    return { summary: stats[0], revenueByMonth: revenue };
  }

  async getPdfMetadata(id: number) {
    const invoice = await this.findById(id);
    if (!invoice) return null;
    return {
      invoiceId: invoice.id, invoiceNumber: invoice.invoice_number, status: invoice.status,
      total: Number(invoice.total), currency: invoice.currency,
      issueDate: invoice.issue_date, dueDate: invoice.due_date,
      merchantName: invoice.merchant_name, customerName: invoice.customer_name,
      templateId: invoice.template_id, generatedAt: new Date().toISOString(),
    };
  }
}
