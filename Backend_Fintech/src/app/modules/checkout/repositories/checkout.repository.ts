import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';

export class CheckoutRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async createSession(data: Record<string, unknown>): Promise<number> {
    const checkoutRef = `chk_${randomBytes(16).toString('hex')}`;
    const clientSecret = `cs_${randomBytes(24).toString('hex')}`;
    const recoveryToken = `rcv_${randomBytes(16).toString('hex')}`;
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO checkout_sessions (uuid, checkout_ref, client_secret, recovery_token, payment_intent_id, payment_session_id,
        order_id, merchant_id, organization_id, customer_id, amount, currency, locale, theme_id, checkout_mode, status,
        return_url, cancel_url, success_url, failure_url, pending_url, webhook_url, merchant_metadata,
        customer_email, customer_phone, billing_address, shipping_address, ip_address, user_agent, browser,
        device_type, os_name, country_code, max_retries, expires_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), ?)`,
      [randomUUID(), checkoutRef, clientSecret, recoveryToken, data.paymentIntentId, data.paymentSessionId ?? null,
        data.orderId ?? null, data.merchantId, data.organizationId, data.customerId ?? null,
        data.amount, data.currency ?? 'USD', data.locale ?? 'en-US', data.themeId ?? null, data.checkoutMode ?? 'hosted',
        data.returnUrl ?? null, data.cancelUrl ?? null, data.successUrl ?? null, data.failureUrl ?? null,
        data.pendingUrl ?? null, data.webhookUrl ?? null, data.merchantMetadata ? JSON.stringify(data.merchantMetadata) : null,
        data.customerEmail ?? null, data.customerPhone ?? null,
        data.billingAddress ? JSON.stringify(data.billingAddress) : null,
        data.shippingAddress ? JSON.stringify(data.shippingAddress) : null,
        data.ipAddress ?? null, data.userAgent ?? null, data.browser ?? null,
        data.deviceType ?? null, data.osName ?? null, data.countryCode ?? null,
        data.maxRetries ?? 3, data.expiryMinutes ?? 30, data.createdBy ?? null],
    );
    return result.insertId;
  }

  async findByRef(checkoutRef: string): Promise<RowDataPacket | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT cs.*, m.display_name AS merchant_display_name, pi.status AS intent_status, pi.intent_ref,
              (cs.expires_at <= NOW()) AS is_expired
       FROM checkout_sessions cs
       JOIN merchants m ON m.id = cs.merchant_id
       JOIN payment_intents pi ON pi.id = cs.payment_intent_id
       WHERE cs.checkout_ref = ?`, [checkoutRef],
    );
    return rows[0] ?? null;
  }

  async findById(id: number): Promise<RowDataPacket | null> {
    const orgId = getOrganizationId();
    const params: unknown[] = [id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND cs.organization_id = ?'; params.push(orgId); }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT cs.*, pi.intent_ref, pi.status AS intent_status FROM checkout_sessions cs
       JOIN payment_intents pi ON pi.id = cs.payment_intent_id WHERE cs.id = ?${orgClause}`, params,
    );
    return rows[0] ?? null;
  }

  async findByRecoveryToken(token: string): Promise<RowDataPacket | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT * FROM checkout_sessions WHERE recovery_token = ? AND status = \'open\' AND expires_at > NOW()', [token],
    );
    return rows[0] ?? null;
  }

  async list(query: { page: number; pageSize: number; status?: string; merchantId?: number }) {
    const conditions = ['1=1'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('cs.organization_id = ?'); params.push(orgId); }
    if (query.status) { conditions.push('cs.status = ?'); params.push(query.status); }
    if (query.merchantId) { conditions.push('cs.merchant_id = ?'); params.push(query.merchantId); }
    const where = conditions.join(' AND ');
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM checkout_sessions cs WHERE ${where}`, params);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT cs.*, pi.intent_ref FROM checkout_sessions cs JOIN payment_intents pi ON pi.id = cs.payment_intent_id
       WHERE ${where} ORDER BY cs.created_at DESC LIMIT ? OFFSET ?`, [...params, query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async updateStatus(id: number, status: string, extra: Record<string, unknown> = {}): Promise<void> {
    const sets = ['status = ?'];
    const params: unknown[] = [status];
    if (extra.viewedAt) { sets.push('viewed_at = NOW()'); }
    if (extra.paymentStartedAt) { sets.push('payment_started_at = NOW()'); }
    if (extra.completedAt) { sets.push('completed_at = NOW()'); }
    if (extra.retryCount != null) { sets.push('retry_count = ?'); params.push(extra.retryCount); }
    if (extra.lastFailureReason) { sets.push('last_failure_reason = ?'); params.push(extra.lastFailureReason); }
    params.push(id);
    await this.pool.query(`UPDATE checkout_sessions SET ${sets.join(', ')} WHERE id = ?`, params);
  }

  async addEvent(sessionId: number, eventType: string, meta: Record<string, unknown> = {}): Promise<void> {
    await this.pool.query(
      `INSERT INTO checkout_session_events (uuid, checkout_session_id, event_type, payment_method_code, metadata, browser, os_name, country_code, device_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), sessionId, eventType, meta.paymentMethodCode ?? null,
        Object.keys(meta).length ? JSON.stringify(meta) : null,
        meta.browser ?? null, meta.osName ?? null, meta.countryCode ?? null, meta.deviceType ?? null],
    );
  }

  async getEvents(sessionId: number): Promise<RowDataPacket[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT * FROM checkout_session_events WHERE checkout_session_id = ? ORDER BY created_at ASC', [sessionId],
    );
    return rows;
  }

  async getBranding(merchantId: number): Promise<RowDataPacket | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT b.*, t.code AS theme_code, t.name AS theme_name, t.primary_color AS theme_primary,
              t.secondary_color AS theme_secondary, t.accent_color AS theme_accent, t.font_family AS theme_font,
              t.button_style AS theme_button_style, t.border_radius AS theme_border_radius
       FROM merchant_checkout_branding b
       LEFT JOIN checkout_themes t ON t.id = b.theme_id
       WHERE b.merchant_id = ?`, [merchantId],
    );
    return rows[0] ?? null;
  }

  async upsertBranding(merchantId: number, orgId: number, data: Record<string, unknown>, actorId?: number): Promise<void> {
    const [existing] = await this.pool.query<RowDataPacket[]>('SELECT id FROM merchant_checkout_branding WHERE merchant_id = ?', [merchantId]);
    if (existing[0]) {
      await this.pool.query(
        `UPDATE merchant_checkout_branding SET theme_id = ?, logo_url = ?, favicon_url = ?, primary_color = ?,
          secondary_color = ?, accent_color = ?, font_family = ?, button_style = ?, border_radius = ?,
          support_email = ?, support_phone = ?, terms_url = ?, privacy_url = ?, merchant_name = ?,
          merchant_address = ?, brand_banner_url = ?, allowed_origins = ?, dark_mode_default = ?, updated_by = ?
         WHERE merchant_id = ?`,
        [data.themeId ?? null, data.logoUrl ?? null, data.faviconUrl ?? null, data.primaryColor ?? null,
          data.secondaryColor ?? null, data.accentColor ?? null, data.fontFamily ?? null, data.buttonStyle ?? null,
          data.borderRadius ?? null, data.supportEmail ?? null, data.supportPhone ?? null, data.termsUrl ?? null,
          data.privacyUrl ?? null, data.merchantName ?? null, data.merchantAddress ?? null, data.brandBannerUrl ?? null,
          data.allowedOrigins ? JSON.stringify(data.allowedOrigins) : null, data.darkModeDefault ? 1 : 0,
          actorId ?? null, merchantId],
      );
    } else {
      await this.pool.query(
        `INSERT INTO merchant_checkout_branding (uuid, merchant_id, organization_id, theme_id, logo_url, primary_color,
          support_email, support_phone, terms_url, privacy_url, merchant_name, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [randomUUID(), merchantId, orgId, data.themeId ?? 1, data.logoUrl ?? null, data.primaryColor ?? '#003d9b',
          data.supportEmail ?? null, data.supportPhone ?? null, data.termsUrl ?? null, data.privacyUrl ?? null,
          data.merchantName ?? null, actorId ?? null],
      );
    }
  }

  async listThemes(): Promise<RowDataPacket[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>('SELECT * FROM checkout_themes WHERE is_active = 1 ORDER BY name');
    return rows;
  }

  async getAnalytics(merchantId?: number, days = 30) {
    const conditions = ['analytics_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)'];
    const params: unknown[] = [days];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('organization_id = ?'); params.push(orgId); }
    if (merchantId) { conditions.push('merchant_id = ?'); params.push(merchantId); }
    const [daily] = await this.pool.query<RowDataPacket[]>(
      `SELECT * FROM checkout_analytics_daily WHERE ${conditions.join(' AND ')} ORDER BY analytics_date DESC`, params,
    );

    const sessionConditions = ['1=1'];
    const sessionParams: unknown[] = [];
    if (orgId) { sessionConditions.push('organization_id = ?'); sessionParams.push(orgId); }
    if (merchantId) { sessionConditions.push('merchant_id = ?'); sessionParams.push(merchantId); }
    const [summary] = await this.pool.query<RowDataPacket[]>(
      `SELECT status, COUNT(*) AS cnt FROM checkout_sessions WHERE ${sessionConditions.join(' AND ')} GROUP BY status`, sessionParams,
    );

    const [events] = await this.pool.query<RowDataPacket[]>(
      `SELECT e.event_type, COUNT(*) AS cnt FROM checkout_session_events e
       JOIN checkout_sessions cs ON cs.id = e.checkout_session_id
       WHERE ${sessionConditions.map(c => c.replace('organization_id', 'cs.organization_id').replace('merchant_id', 'cs.merchant_id')).join(' AND ')}
       GROUP BY e.event_type`, sessionParams,
    );

    return { daily, summary, events };
  }

  buildChecksum(payload: Record<string, unknown>, secret: string): string {
    return createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
  }
}
