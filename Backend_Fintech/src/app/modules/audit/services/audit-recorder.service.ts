import { randomUUID } from 'node:crypto';
import { AuditRepository, RecordAuditInput } from '../repositories/audit.repository';

import { getRequestId } from '../../../shared/context/request-context';

export interface AuditContext {
  userId?: number;
  actorName?: string;
  sessionId?: number;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
}

export class AuditRecorderService {
  constructor(private readonly repo = new AuditRepository()) {}

  async record(input: Omit<RecordAuditInput, 'correlationId'> & { correlationId?: string }, ctx?: AuditContext): Promise<void> {
    const correlationId = input.correlationId ?? ctx?.correlationId ?? getRequestId() ?? randomUUID();
    await this.repo.record({
      ...input,
      correlationId,
      userId: input.userId ?? ctx?.userId,
      actorName: input.actorName ?? ctx?.actorName,
      sessionId: input.sessionId ?? ctx?.sessionId,
      ipAddress: input.ipAddress ?? ctx?.ipAddress,
      userAgent: input.userAgent ?? ctx?.userAgent,
    });
  }

  async logApi(
    method: string, path: string, statusCode: number,
    ctx?: AuditContext & { responseTimeMs?: number; requestBody?: Record<string, unknown> },
  ): Promise<void> {
    await this.repo.logApi({
      correlationId: ctx?.correlationId ?? getRequestId(),
      userId: ctx?.userId,
      method, path, statusCode,
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
      responseTimeMs: ctx?.responseTimeMs,
      requestBody: ctx?.requestBody,
    });
  }

  // Auth events
  login(ctx: AuditContext) {
    return this.record({ module: 'authentication', categoryCode: 'authentication', actionCode: 'login', entityType: 'user', entityId: String(ctx.userId), description: 'Successful login.', riskLevel: 'low' }, ctx);
  }
  logout(ctx: AuditContext) {
    return this.record({ module: 'authentication', categoryCode: 'authentication', actionCode: 'logout', entityType: 'user', entityId: String(ctx.userId), description: 'User logged out.', riskLevel: 'low' }, ctx);
  }
  loginFailed(email: string, ctx: AuditContext) {
    return this.record({ module: 'authentication', categoryCode: 'authentication', actionCode: 'login_failed', description: `Failed login attempt for ${email}.`, riskLevel: 'high', metadata: { email } }, ctx);
  }
  passwordChange(ctx: AuditContext) {
    return this.record({ module: 'authentication', categoryCode: 'authentication', actionCode: 'password_change', entityType: 'user', entityId: String(ctx.userId), description: 'Password changed successfully.', riskLevel: 'medium' }, ctx);
  }
  mfaEnabled(ctx: AuditContext) {
    return this.record({ module: 'authentication', categoryCode: 'authentication', actionCode: 'mfa_enabled', entityType: 'user', entityId: String(ctx.userId), description: 'MFA enabled on account.', riskLevel: 'medium' }, ctx);
  }
  mfaDisabled(ctx: AuditContext) {
    return this.record({ module: 'authentication', categoryCode: 'authentication', actionCode: 'mfa_disabled', entityType: 'user', entityId: String(ctx.userId), description: 'MFA disabled on account.', riskLevel: 'high' }, ctx);
  }

  // User events
  userCreate(userId: number, email: string, ctx: AuditContext) {
    return this.record({ module: 'users', categoryCode: 'users', actionCode: 'create', entityType: 'user', entityId: String(userId), description: `Created user ${email}.`, afterValues: { email }, riskLevel: 'low' }, ctx);
  }
  userUpdate(userId: number, before: Record<string, unknown>, after: Record<string, unknown>, ctx: AuditContext) {
    return this.record({ module: 'users', categoryCode: 'users', actionCode: 'update', entityType: 'user', entityId: String(userId), description: `Updated user #${userId}.`, beforeValues: before, afterValues: after, riskLevel: 'low' }, ctx);
  }
  userDelete(userId: number, ctx: AuditContext) {
    return this.record({ module: 'users', categoryCode: 'users', actionCode: 'delete', entityType: 'user', entityId: String(userId), description: `Deleted user #${userId}.`, riskLevel: 'medium' }, ctx);
  }
  roleChange(userId: number, before: unknown, after: unknown, ctx: AuditContext) {
    return this.record({ module: 'users', categoryCode: 'users', actionCode: 'role_change', entityType: 'user', entityId: String(userId), description: `Changed roles for user #${userId}.`, beforeValues: { roles: before }, afterValues: { roles: after }, riskLevel: 'medium' }, ctx);
  }

  // Settings
  settingsChange(module: string, description: string, before?: Record<string, unknown>, after?: Record<string, unknown>, ctx?: AuditContext) {
    return this.record({ module: 'settings', categoryCode: 'settings', actionCode: 'settings_change', entityType: module, description, beforeValues: before, afterValues: after, riskLevel: 'medium' }, ctx);
  }

  // Notifications
  broadcast(title: string, recipientCount: number, ctx: AuditContext) {
    return this.record({ module: 'notifications', categoryCode: 'notifications', actionCode: 'broadcast', entityType: 'broadcast', description: `Sent broadcast: ${title} to ${recipientCount} recipients.`, afterValues: { title, recipientCount }, riskLevel: 'low' }, ctx);
  }
  templateChange(action: string, templateCode: string, ctx: AuditContext) {
    return this.record({ module: 'notifications', categoryCode: 'notifications', actionCode: 'template_change', entityType: 'template', entityId: templateCode, description: `${action} notification template ${templateCode}.`, riskLevel: 'low' }, ctx);
  }
  preferenceChange(ctx: AuditContext) {
    return this.record({ module: 'notifications', categoryCode: 'notifications', actionCode: 'preference_change', entityType: 'user', entityId: String(ctx.userId), description: 'Updated notification preferences.', riskLevel: 'low' }, ctx);
  }

  // Merchants
  merchantApprove(merchantId: number, name: string, ctx: AuditContext) {
    return this.record({ module: 'merchants', categoryCode: 'merchants', actionCode: 'approve', entityType: 'merchant', entityId: String(merchantId), description: `Approved merchant ${name}.`, beforeValues: { status: 'pending' }, afterValues: { status: 'active' }, riskLevel: 'low' }, ctx);
  }
  merchantReject(merchantId: number, name: string, reason: string | undefined, ctx: AuditContext) {
    return this.record({ module: 'merchants', categoryCode: 'merchants', actionCode: 'reject', entityType: 'merchant', entityId: String(merchantId), description: `Rejected/suspended merchant ${name}.${reason ? ` Reason: ${reason}` : ''}`, riskLevel: 'medium' }, ctx);
  }
  merchantCreate(merchantId: number, name: string, ctx: AuditContext) {
    return this.record({ module: 'merchants', categoryCode: 'merchants', actionCode: 'create', entityType: 'merchant', entityId: String(merchantId), description: `Created merchant ${name}.`, afterValues: { displayName: name }, riskLevel: 'low' }, ctx);
  }

  // Transactions
  refund(transactionId: number, ref: string, amount: string, ctx: AuditContext) {
    return this.record({ module: 'transactions', categoryCode: 'transactions', actionCode: 'refund', entityType: 'transaction', entityId: String(transactionId), description: `Refund of ${amount} for ${ref}.`, riskLevel: 'medium', metadata: { transactionRef: ref } }, ctx);
  }
  paymentFailed(transactionId: number, ref: string, reason: string | undefined, ctx: AuditContext) {
    return this.record({ module: 'transactions', categoryCode: 'transactions', actionCode: 'payment_failed', entityType: 'transaction', entityId: String(transactionId), description: `Payment failed for ${ref}.${reason ? ` ${reason}` : ''}`, riskLevel: 'high' }, ctx);
  }

  // Settlements
  settlementCompleted(settlementId: number, ref: string, amount: string, ctx: AuditContext) {
    return this.record({ module: 'settlements', categoryCode: 'settlements', actionCode: 'settlement', entityType: 'settlement', entityId: String(settlementId), description: `Settlement ${ref} completed for ${amount}.`, riskLevel: 'low' }, ctx);
  }

  // Reports
  exportReport(reportType: string, format: string, rowCount: number, ctx: AuditContext) {
    return this.record({ module: 'reports', categoryCode: 'reports', actionCode: 'export', entityType: 'report', entityId: reportType, description: `Exported ${reportType} report as ${format} (${rowCount} rows).`, afterValues: { format, rowCount }, riskLevel: 'low' }, ctx);
  }
}

export const auditRecorder = new AuditRecorderService();
