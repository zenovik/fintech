import { randomUUID } from 'crypto';
import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { appendMerchantOrgFilter, getOrganizationId } from '../../../shared/context/org-context';
import { CreatePlanBodyDto, CreateSubscriptionBodyDto, PlanListQueryDto, SubscriptionListQueryDto } from '../dto';
import { BillingInterval, addBillingInterval, formatDate } from '../constants/subscriptions.constants';

export class SubscriptionRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  generatePlanCode(): string { return `PLAN-${Math.floor(1000 + Math.random() * 9000)}`; }
  generateSubRef(): string { return `SUB-${Math.floor(100000 + Math.random() * 900000)}`; }

  async findPlans(query: PlanListQueryDto) {
    const conditions = ['sp.deleted_at IS NULL'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('sp.organization_id = ?'); params.push(orgId); }
    if (query.search) { conditions.push('(sp.name LIKE ? OR sp.plan_code LIKE ?)'); const t = `%${query.search}%`; params.push(t, t); }
    if (query.merchantId) { conditions.push('sp.merchant_id = ?'); params.push(query.merchantId); }
    appendMerchantOrgFilter(conditions, params, 'm');
    const where = `WHERE ${conditions.join(' AND ')}`;
    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM subscription_plans sp JOIN merchants m ON m.id = sp.merchant_id ${where}`, params,
    );
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT sp.*, m.display_name AS merchant_name FROM subscription_plans sp
       JOIN merchants m ON m.id = sp.merchant_id ${where}
       ORDER BY sp.created_at DESC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, (query.page - 1) * query.pageSize],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async findPlanById(id: number) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT sp.*, m.display_name AS merchant_name FROM subscription_plans sp
       JOIN merchants m ON m.id = sp.merchant_id WHERE sp.id = ? AND sp.deleted_at IS NULL LIMIT 1`, [id],
    );
    return rows[0] ?? null;
  }

  async createPlan(dto: CreatePlanBodyDto, organizationId: number, userId?: number): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO subscription_plans (uuid, organization_id, merchant_id, plan_code, name, description, price, currency, billing_interval, trial_days, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), organizationId, dto.merchantId, this.generatePlanCode(), dto.name, dto.description ?? null,
        dto.price, dto.currency ?? 'USD', dto.billingInterval ?? 'monthly', dto.trialDays ?? 0, userId ?? null],
    );
    return result.insertId;
  }

  async findSubscriptions(query: SubscriptionListQueryDto) {
    const conditions = ['s.deleted_at IS NULL'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('s.organization_id = ?'); params.push(orgId); }
    if (query.search) {
      conditions.push('(s.subscription_ref LIKE ? OR c.display_name LIKE ? OR sp.name LIKE ?)');
      const t = `%${query.search}%`; params.push(t, t, t);
    }
    if (query.status) { conditions.push('s.status = ?'); params.push(query.status); }
    if (query.merchantId) { conditions.push('s.merchant_id = ?'); params.push(query.merchantId); }
    if (query.customerId) { conditions.push('s.customer_id = ?'); params.push(query.customerId); }
    appendMerchantOrgFilter(conditions, params, 'm');
    const where = `WHERE ${conditions.join(' AND ')}`;
    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM subscriptions s JOIN merchants m ON m.id = s.merchant_id JOIN customers c ON c.id = s.customer_id JOIN subscription_plans sp ON sp.id = s.plan_id ${where}`, params,
    );
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT s.*, sp.name AS plan_name, sp.price AS plan_price, sp.currency AS plan_currency, sp.billing_interval,
              m.display_name AS merchant_name, c.display_name AS customer_name, pl.link_ref AS payment_link_ref, pl.public_token
       FROM subscriptions s
       JOIN subscription_plans sp ON sp.id = s.plan_id
       JOIN merchants m ON m.id = s.merchant_id
       JOIN customers c ON c.id = s.customer_id
       LEFT JOIN payment_links pl ON pl.id = s.payment_link_id
       ${where} ORDER BY s.created_at DESC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, (query.page - 1) * query.pageSize],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async getSubscriptionStats() {
    const conditions = ['s.deleted_at IS NULL'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('s.organization_id = ?'); params.push(orgId); }
    appendMerchantOrgFilter(conditions, params, 'm');
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END) AS active_count,
              SUM(CASE WHEN s.status = 'paused' THEN 1 ELSE 0 END) AS paused_count,
              SUM(CASE WHEN s.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
              SUM(CASE WHEN s.status = 'failed' THEN 1 ELSE 0 END) AS failed_count,
              SUM(CASE WHEN s.status = 'renewed' THEN 1 ELSE 0 END) AS renewed_count,
              COALESCE(SUM(sp.price), 0) AS mrr_estimate
       FROM subscriptions s JOIN merchants m ON m.id = s.merchant_id
       JOIN subscription_plans sp ON sp.id = s.plan_id WHERE ${conditions.join(' AND ')}`, params,
    );
    return rows[0];
  }

  async findSubscriptionById(id: number) {
    const orgId = getOrganizationId();
    const orgClause = orgId ? ' AND s.organization_id = ?' : '';
    const params = orgId ? [id, orgId] : [id];
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT s.*, sp.name AS plan_name, sp.price AS plan_price, sp.currency AS plan_currency, sp.billing_interval, sp.trial_days,
              m.display_name AS merchant_name, c.display_name AS customer_name, c.email AS customer_email,
              pl.link_ref AS payment_link_ref, pl.public_token, pl.status AS payment_link_status
       FROM subscriptions s
       JOIN subscription_plans sp ON sp.id = s.plan_id
       JOIN merchants m ON m.id = s.merchant_id
       JOIN customers c ON c.id = s.customer_id
       LEFT JOIN payment_links pl ON pl.id = s.payment_link_id
       WHERE s.id = ? AND s.deleted_at IS NULL${orgClause} LIMIT 1`, params,
    );
    return rows[0] ?? null;
  }

  async findByInvoiceId(invoiceId: number) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT s.* FROM subscriptions s
       JOIN subscription_invoices si ON si.subscription_id = s.id
       WHERE si.invoice_id = ? AND s.deleted_at IS NULL LIMIT 1`, [invoiceId],
    );
    return rows[0] ?? null;
  }

  async createSubscription(dto: CreateSubscriptionBodyDto, organizationId: number, plan: RowDataPacket, userId?: number): Promise<number> {
    const start = dto.startDate ? new Date(dto.startDate) : new Date();
    const trialDays = Number(plan.trial_days ?? 0);
    const trialEnd = trialDays > 0 ? new Date(start.getTime() + trialDays * 86400000) : null;
    const billingStart = trialEnd ?? start;
    const periodEnd = addBillingInterval(billingStart, plan.billing_interval as BillingInterval);
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO subscriptions (uuid, organization_id, merchant_id, customer_id, plan_id, subscription_ref, status,
        start_date, trial_end_date, next_billing_date, current_period_start, current_period_end, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), organizationId, dto.merchantId, dto.customerId, dto.planId, this.generateSubRef(),
        formatDate(start), trialEnd ? formatDate(trialEnd) : null, formatDate(billingStart),
        formatDate(billingStart), formatDate(periodEnd), userId ?? null],
    );
    return result.insertId;
  }

  async setPaymentLinkId(id: number, paymentLinkId: number | null, userId?: number): Promise<void> {
    await this.pool.query(`UPDATE subscriptions SET payment_link_id = ?, updated_by = ? WHERE id = ?`, [paymentLinkId, userId ?? null, id]);
  }

  async linkInvoice(subscriptionId: number, invoiceId: number, billingPeriod?: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO subscription_invoices (subscription_id, invoice_id, billing_period) VALUES (?, ?, ?)`,
      [subscriptionId, invoiceId, billingPeriod ?? null],
    );
  }

  async setStatus(id: number, status: string, userId?: number, extra?: Record<string, unknown>): Promise<void> {
    const fields = ['status = ?', 'updated_by = ?'];
    const params: unknown[] = [status, userId ?? null];
    if (extra?.nextBillingDate) { fields.push('next_billing_date = ?'); params.push(extra.nextBillingDate); }
    if (extra?.currentPeriodStart) { fields.push('current_period_start = ?'); params.push(extra.currentPeriodStart); }
    if (extra?.currentPeriodEnd) { fields.push('current_period_end = ?'); params.push(extra.currentPeriodEnd); }
    if (extra?.renewalCount != null) { fields.push('renewal_count = ?'); params.push(extra.renewalCount); }
    if (extra?.endDate) { fields.push('end_date = ?'); params.push(extra.endDate); }
    params.push(id);
    await this.pool.query(`UPDATE subscriptions SET ${fields.join(', ')} WHERE id = ?`, params);
  }

  async validateMerchantInOrg(merchantId: number, organizationId: number): Promise<boolean> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id FROM merchants WHERE id = ? AND organization_id = ? AND deleted_at IS NULL LIMIT 1`, [merchantId, organizationId],
    );
    return !!rows[0];
  }

  async validateCustomerInOrg(customerId: number, organizationId: number): Promise<boolean> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id FROM customers WHERE id = ? AND organization_id = ? AND deleted_at IS NULL LIMIT 1`, [customerId, organizationId],
    );
    return !!rows[0];
  }

  async resumeSubscription(id: number, userId?: number): Promise<void> {
    await this.pool.query(
      `UPDATE subscriptions SET status = 'active', paused_at = NULL, updated_by = ? WHERE id = ? AND deleted_at IS NULL`, [userId ?? null, id],
    );
  }

  async upgradeSubscription(id: number, planId: number, userId?: number): Promise<void> {
    const [planRows] = await this.pool.query<RowDataPacket[]>(`SELECT * FROM subscription_plans WHERE id = ? AND deleted_at IS NULL`, [planId]);
    const plan = planRows[0];
    if (!plan) throw new Error('PLAN_NOT_FOUND');
    const periodEnd = addBillingInterval(new Date(), plan.billing_interval as BillingInterval);
    await this.pool.query(
      `UPDATE subscriptions SET plan_id = ?, status = 'active', current_period_start = ?, current_period_end = ?, next_billing_date = ?, updated_by = ? WHERE id = ?`,
      [planId, formatDate(new Date()), formatDate(periodEnd), formatDate(periodEnd), userId ?? null, id],
    );
  }

  async downgradeSubscription(id: number, planId: number, userId?: number): Promise<void> {
    await this.pool.query(
      `UPDATE subscriptions SET plan_id = ?, cancel_at_period_end = 1, updated_by = ? WHERE id = ? AND deleted_at IS NULL`,
      [planId, userId ?? null, id],
    );
  }

  async listDunningEvents(query: { page: number; pageSize: number; subscriptionId?: number }) {
    const conditions = ['1=1'];
    const params: unknown[] = [];
    if (query.subscriptionId) { conditions.push('sde.subscription_id = ?'); params.push(query.subscriptionId); }
    const where = conditions.join(' AND ');
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM subscription_dunning_events sde WHERE ${where}`, params,
    );
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT sde.*, s.subscription_ref FROM subscription_dunning_events sde
       JOIN subscriptions s ON s.id = sde.subscription_id WHERE ${where} ORDER BY sde.scheduled_at DESC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async listMandates(subscriptionId?: number) {
    const conditions = ['1=1'];
    const params: unknown[] = [];
    if (subscriptionId) { conditions.push('sm.subscription_id = ?'); params.push(subscriptionId); }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT sm.*, s.subscription_ref FROM subscription_mandates sm
       JOIN subscriptions s ON s.id = sm.subscription_id WHERE ${conditions.join(' AND ')} ORDER BY sm.created_at DESC`, params,
    );
    return rows;
  }

  async getAnalytics() {
    const orgId = getOrganizationId();
    const params: unknown[] = [];
    let orgClause = '';
    if (orgId) { orgClause = ' AND s.organization_id = ?'; params.push(orgId); }
    const [dunning] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS active_dunning FROM subscriptions s WHERE s.dunning_stage > 0 AND s.deleted_at IS NULL${orgClause}`, params,
    );
    const [churn] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS cancelled_30d FROM subscriptions s
       WHERE s.status = 'cancelled' AND s.updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND s.deleted_at IS NULL${orgClause}`, params,
    );
    const stats = await this.getSubscriptionStats();
    return {
      total: stats?.total,
      active_count: stats?.active_count,
      paused_count: stats?.paused_count,
      cancelled_count: stats?.cancelled_count,
      failed_count: stats?.failed_count,
      renewed_count: stats?.renewed_count,
      mrr_estimate: stats?.mrr_estimate,
      activeDunning: Number(dunning[0]?.active_dunning ?? 0),
      cancelled30d: Number(churn[0]?.cancelled_30d ?? 0),
    };
  }
}
