import { getPool } from '../../../database';

export class StatusSyncService {
  private readonly pool = getPool();

  async syncOnboardingStatus(applicationId: number, status: string, actorId?: number): Promise<void> {
    const sets = ['onboarding_status = ?', 'updated_by = ?', 'updated_at = NOW()'];
    const params: unknown[] = [status, actorId ?? null];
    if (status === 'approved') { sets.push('approved_at = NOW()'); }
    if (status === 'rejected') { sets.push('rejected_at = NOW()'); }
    if (status === 'go_live' || status === 'completed') { sets.push('go_live_at = NOW()'); }
    params.push(applicationId);
    await this.pool.query(
      `UPDATE merchant_onboarding_applications SET ${sets.join(', ')} WHERE id = ?`,
      params,
    );
  }

  async syncGoLive(applicationId: number, merchantId: number, actorId?: number): Promise<void> {
    await this.syncOnboardingStatus(applicationId, 'go_live', actorId);
    await this.pool.query(
      "UPDATE merchants SET status = 'active', kyc_status = 'verified', updated_by = ? WHERE id = ?",
      [actorId ?? null, merchantId],
    );
  }

  async syncSuspend(applicationId: number, merchantId: number, actorId?: number): Promise<void> {
    await this.syncOnboardingStatus(applicationId, 'suspended', actorId);
    await this.pool.query(
      "UPDATE merchants SET status = 'suspended', updated_by = ? WHERE id = ?",
      [actorId ?? null, merchantId],
    );
    await this.pool.query(
      "UPDATE merchant_outlets SET status = 'inactive', updated_by = ? WHERE merchant_id = ? AND deleted_at IS NULL",
      [actorId ?? null, merchantId],
    );
    await this.pool.query(
      `UPDATE merchant_users SET status = 'inactive', updated_by = ? WHERE merchant_id = ? AND deleted_at IS NULL`,
      [actorId ?? null, merchantId],
    );
  }

  async syncActivate(applicationId: number, merchantId: number, actorId?: number): Promise<void> {
    await this.syncOnboardingStatus(applicationId, 'go_live', actorId);
    await this.pool.query(
      "UPDATE merchants SET status = 'active', updated_by = ? WHERE id = ?",
      [actorId ?? null, merchantId],
    );
    await this.pool.query(
      "UPDATE merchant_outlets SET status = 'active', updated_by = ? WHERE merchant_id = ? AND deleted_at IS NULL",
      [actorId ?? null, merchantId],
    );
    await this.pool.query(
      `UPDATE merchant_users SET status = 'active', updated_by = ? WHERE merchant_id = ? AND deleted_at IS NULL`,
      [actorId ?? null, merchantId],
    );
  }
}
