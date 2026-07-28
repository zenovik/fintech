import { orgContextStorage } from '../../../shared/context/org-context';
import { NotFoundError, ValidationError, ForbiddenError } from '../../../shared/exceptions/app.exception';
import { assertMerchantInOrg, requireOrgId } from '../../../shared/helpers/tenant-scope.helper';
import { PaymentEngineService } from '../../payments/services/payment-engine.service';
import { CheckoutRepository } from '../repositories/checkout.repository';
import { auditRecorder } from '../../audit';

export class CheckoutService {
  constructor(
    private readonly repo = new CheckoutRepository(),
    private readonly paymentEngine = new PaymentEngineService(),
  ) {}

  private async withOrg<T>(orgId: number, fn: () => Promise<T>): Promise<T> {
    return orgContextStorage.run({ organizationId: orgId, organizationRoleCode: 'checkout' }, fn);
  }

  async createSession(dto: Record<string, unknown>, actorId?: number, reqMeta?: Record<string, unknown>) {
    const orgId = orgContextStorage.getStore()?.organizationId;
    if (!orgId) throw new ValidationError('Organization context is required');
    await assertMerchantInOrg(Number(dto.merchantId), orgId);
    const paymentResult = await this.paymentEngine.createPayment({
      merchantId: dto.merchantId,
      amount: dto.amount,
      currency: dto.currency,
      customerId: dto.customerId,
      merchantOrderId: dto.merchantOrderId,
      description: dto.description ?? 'Hosted checkout payment',
      paymentMethodCode: dto.paymentMethodCode,
      createOrder: true,
      createSession: true,
      metadata: dto.merchantMetadata,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      browser: reqMeta?.browser,
    }, actorId, dto.idempotencyKey as string | undefined);

    const expiryMinutes = Number(dto.expiryMinutes ?? 30);
    const checkoutId = await this.repo.createSession({
      paymentIntentId: paymentResult.intent.id,
      paymentSessionId: paymentResult.session?.id,
      orderId: paymentResult.orderId,
      merchantId: dto.merchantId,
      organizationId: orgId,
      customerId: dto.customerId,
      amount: dto.amount,
      currency: dto.currency,
      locale: dto.locale,
      themeId: dto.themeId,
      checkoutMode: dto.mode ?? 'hosted',
      returnUrl: dto.returnUrl,
      cancelUrl: dto.cancelUrl,
      successUrl: dto.successUrl,
      failureUrl: dto.failureUrl,
      pendingUrl: dto.pendingUrl,
      webhookUrl: dto.webhookUrl,
      merchantMetadata: dto.merchantMetadata,
      customerEmail: dto.customerEmail,
      customerPhone: dto.customerPhone,
      billingAddress: dto.billingAddress,
      shippingAddress: dto.shippingAddress,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      browser: reqMeta?.browser,
      deviceType: reqMeta?.deviceType,
      osName: reqMeta?.osName,
      countryCode: reqMeta?.countryCode,
      expiryMinutes,
      createdBy: actorId,
    });

    const session = await this.repo.findById(checkoutId);
    await this.repo.addEvent(checkoutId, 'created');
    void auditRecorder.record({
      module: 'checkout', categoryCode: 'checkout', actionCode: 'checkout_created',
      entityType: 'checkout_session', entityId: String(checkoutId),
      description: `Checkout session ${session!.checkout_ref} created`, userId: actorId, riskLevel: 'low',
    }).catch(() => {});

    const hostedUrl = `/pay/checkout/${session!.checkout_ref}`;
    return {
      checkoutSessionId: checkoutId,
      checkoutRef: session!.checkout_ref,
      clientSecret: session!.client_secret,
      recoveryToken: session!.recovery_token,
      hostedCheckoutUrl: hostedUrl,
      paymentIntentId: paymentResult.intent.id,
      paymentIntentRef: paymentResult.intent.intentRef,
      expiresAt: session!.expires_at,
      mode: session!.checkout_mode,
    };
  }

  async getPublicCheckout(checkoutRef: string, clientSecret: string) {
    const session = await this.validatePublicSession(checkoutRef, clientSecret);
    if (!session.viewed_at) {
      await this.repo.updateStatus(Number(session.id), 'open', { viewedAt: true });
      await this.repo.addEvent(Number(session.id), 'viewed', { browser: session.browser, countryCode: session.country_code });
    }

    const branding = await this.repo.getBranding(Number(session.merchant_id));
    const paymentMethods = await this.withOrg(Number(session.organization_id), () =>
      this.paymentEngine.merchantConfig(Number(session.merchant_id)),
    );

    let savedMethods: unknown[] = [];
    if (session.customer_id) {
      const profile = await this.withOrg(Number(session.organization_id), () =>
        this.paymentEngine.customerProfile(Number(session.customer_id)),
      );
      savedMethods = profile.savedMethods;
    }

    return {
      checkoutRef: session.checkout_ref,
      status: session.status,
      amount: Number(session.amount),
      currency: session.currency,
      locale: session.locale,
      mode: session.checkout_mode,
      merchantName: session.merchant_display_name,
      intentStatus: session.intent_status,
      intentRef: session.intent_ref,
      expiresAt: session.expires_at,
      retryCount: session.retry_count,
      maxRetries: session.max_retries,
      lastFailureReason: session.last_failure_reason,
      branding: this.mapBranding(branding),
      paymentMethods: paymentMethods.allowedPaymentMethods,
      savedMethods,
      redirectUrls: {
        success: session.success_url,
        failure: session.failure_url,
        cancel: session.cancel_url,
        pending: session.pending_url,
        return: session.return_url,
      },
    };
  }

  async processPayment(checkoutRef: string, clientSecret: string, dto: Record<string, unknown>) {
    const session = await this.validatePublicSession(checkoutRef, clientSecret);
    if (session.status !== 'open') throw new ValidationError('Checkout session is not open');

    await this.repo.updateStatus(Number(session.id), 'open', { paymentStartedAt: true });
    await this.repo.addEvent(Number(session.id), 'payment_started', { paymentMethodCode: dto.paymentMethodCode });

    try {
      const orgId = Number(session.organization_id);
      const result = await (async () => {
        if (dto.paymentMethodCode) {
          await this.paymentEngine.setPaymentMethodCodeInOrg(Number(session.payment_intent_id), orgId, String(dto.paymentMethodCode));
        }
        await this.paymentEngine.authorizeInOrg(Number(session.payment_intent_id), orgId);
        return this.paymentEngine.captureInOrg(Number(session.payment_intent_id), orgId, {
          amount: dto.amount ? Number(dto.amount) : undefined,
        });
      })();

      await this.repo.updateStatus(Number(session.id), 'complete', { completedAt: true });
      await this.repo.addEvent(Number(session.id), 'completed', { paymentMethodCode: dto.paymentMethodCode });

      void auditRecorder.record({
        module: 'checkout', categoryCode: 'checkout', actionCode: 'checkout_completed',
        entityType: 'checkout_session', entityId: String(session.id),
        description: `Checkout ${checkoutRef} completed`, riskLevel: 'low',
      }).catch(() => {});

      const redirectUrl = this.buildRedirectUrl(session.success_url ?? session.return_url, {
        checkout_ref: checkoutRef,
        intent_ref: result.intent.intentRef,
        status: 'success',
        checksum: this.repo.buildChecksum({ checkout_ref: checkoutRef, status: 'success' }, session.client_secret),
      });

      return {
        status: 'success',
        intent: result.intent,
        transactionId: result.transactionId,
        redirectUrl,
      };
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Payment failed';
      const retryCount = Number(session.retry_count) + 1;
      const newStatus = retryCount >= Number(session.max_retries) ? 'abandoned' : 'open';
      await this.repo.updateStatus(Number(session.id), newStatus, { retryCount, lastFailureReason: reason });
      await this.repo.addEvent(Number(session.id), 'failed', { paymentMethodCode: dto.paymentMethodCode, reason });

      const redirectUrl = this.buildRedirectUrl(session.failure_url, {
        checkout_ref: checkoutRef, status: 'failed', reason,
        checksum: this.repo.buildChecksum({ checkout_ref: checkoutRef, status: 'failed' }, session.client_secret),
      });

      throw Object.assign(new ValidationError(reason), { redirectUrl, canRetry: newStatus === 'open' });
    }
  }

  async retryPayment(checkoutRef: string, clientSecret: string, dto: Record<string, unknown>) {
    const session = await this.validatePublicSession(checkoutRef, clientSecret);
    if (Number(session.retry_count) >= Number(session.max_retries)) {
      throw new ValidationError('Maximum retry limit reached');
    }
    await this.repo.addEvent(Number(session.id), 'retry', { paymentMethodCode: dto.paymentMethodCode });
    if (dto.paymentMethodCode) {
      await this.repo.addEvent(Number(session.id), 'method_switched', { paymentMethodCode: dto.paymentMethodCode });
    }
    return this.processPayment(checkoutRef, clientSecret, dto);
  }

  async recoverSession(recoveryToken: string) {
    const session = await this.repo.findByRecoveryToken(recoveryToken);
    if (!session) throw new NotFoundError('Recovery session not found or expired');
    return {
      checkoutRef: session.checkout_ref,
      clientSecret: session.client_secret,
      hostedCheckoutUrl: `/pay/checkout/${session.checkout_ref}`,
      expiresAt: session.expires_at,
    };
  }

  async cancelSession(checkoutRef: string, clientSecret: string) {
    const session = await this.validatePublicSession(checkoutRef, clientSecret);
    await this.paymentEngine.cancelInOrg(
      Number(session.payment_intent_id),
      Number(session.organization_id),
      'Checkout cancelled by customer',
    );
    await this.repo.updateStatus(Number(session.id), 'cancelled');
    await this.repo.addEvent(Number(session.id), 'cancelled');
    return {
      redirectUrl: this.buildRedirectUrl(session.cancel_url, { checkout_ref: checkoutRef, status: 'cancelled' }),
    };
  }

  async listSessions(query: { page: number; pageSize: number; status?: string; merchantId?: number }) {
    const { items, total } = await this.repo.list(query);
    return {
      items: items.map((s) => this.mapSession(s)),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) || 1 },
    };
  }

  async getSession(id: number) {
    const session = await this.repo.findById(id);
    if (!session) throw new NotFoundError('Checkout session not found');
    const events = await this.repo.getEvents(id);
    return { session: this.mapSession(session), events };
  }

  async getAnalytics(merchantId?: number, days?: number) {
    return this.repo.getAnalytics(merchantId, days ?? 30);
  }

  async getBranding(merchantId: number) {
    const orgId = requireOrgId();
    await assertMerchantInOrg(merchantId, orgId);
    const branding = await this.repo.getBranding(merchantId);
    return { branding: this.mapBranding(branding) };
  }

  async updateBranding(merchantId: number, data: Record<string, unknown>, actorId?: number) {
    const orgId = requireOrgId();
    await assertMerchantInOrg(merchantId, orgId);
    await this.repo.upsertBranding(merchantId, orgId, data, actorId);
    return this.getBranding(merchantId);
  }

  async listThemes() {
    return (await this.repo.listThemes()).map((t) => ({
      id: t.id, code: t.code, name: t.name, primaryColor: t.primary_color,
      secondaryColor: t.secondary_color, accentColor: t.accent_color,
      fontFamily: t.font_family, buttonStyle: t.button_style, borderRadius: t.border_radius,
    }));
  }

  private async validatePublicSession(checkoutRef: string, clientSecret: string) {
    const session = await this.repo.findByRef(checkoutRef);
    if (!session) throw new NotFoundError('Checkout session not found');
    if (session.client_secret !== clientSecret) throw new ForbiddenError('Invalid client secret');
    if (Number(session.is_expired) === 1 || new Date(session.expires_at) < new Date()) {
      if (session.status === 'open') {
        await this.repo.updateStatus(Number(session.id), 'expired');
        await this.repo.addEvent(Number(session.id), 'expired');
      }
      throw new ValidationError('Checkout session has expired');
    }
    return session;
  }

  private buildRedirectUrl(base: string | null, params: Record<string, string | undefined>): string | null {
    if (!base) return null;
    const url = new URL(base);
    for (const [k, v] of Object.entries(params)) {
      if (v) url.searchParams.set(k, v);
    }
    return url.toString();
  }

  private mapSession(s: Record<string, unknown>) {
    return {
      id: s.id, checkoutRef: s.checkout_ref, status: s.status, amount: Number(s.amount),
      currency: s.currency, mode: s.checkout_mode, merchantId: s.merchant_id,
      paymentIntentId: s.payment_intent_id, intentRef: s.intent_ref, intentStatus: s.intent_status,
      retryCount: s.retry_count, expiresAt: s.expires_at, completedAt: s.completed_at, createdAt: s.created_at,
    };
  }

  private mapBranding(b: Record<string, unknown> | null) {
    if (!b) return { primaryColor: '#003d9b', secondaryColor: '#64748b', accentColor: '#4f46e5', fontFamily: 'Inter, sans-serif', buttonStyle: 'rounded', borderRadius: '12px' };
    return {
      logoUrl: b.logo_url, faviconUrl: b.favicon_url,
      primaryColor: b.primary_color ?? b.theme_primary ?? '#003d9b',
      secondaryColor: b.secondary_color ?? b.theme_secondary ?? '#64748b',
      accentColor: b.accent_color ?? b.theme_accent ?? '#4f46e5',
      fontFamily: b.font_family ?? b.theme_font ?? 'Inter, sans-serif',
      buttonStyle: b.button_style ?? b.theme_button_style ?? 'rounded',
      borderRadius: b.border_radius ?? b.theme_border_radius ?? '12px',
      supportEmail: b.support_email, supportPhone: b.support_phone,
      termsUrl: b.terms_url, privacyUrl: b.privacy_url,
      merchantName: b.merchant_name, merchantAddress: b.merchant_address,
      brandBannerUrl: b.brand_banner_url, darkModeDefault: Boolean(b.dark_mode_default),
    };
  }
}
