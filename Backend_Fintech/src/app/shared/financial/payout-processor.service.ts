import { Pool, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../database';
import { eventBus } from '../events/event-bus.service';
import { auditRecorder } from '../../modules/audit';
import { logger } from '../logger';

export class PayoutProcessor {
  constructor(private readonly pool: Pool = getPool()) {}

  async runScheduledBatch(): Promise<{ processed: number; failed: number }> {
    const [payouts] = await this.pool.query<RowDataPacket[]>(
      `SELECT p.id, p.merchant_id, p.amount, p.currency, p.status
       FROM payouts p
       WHERE p.status = 'scheduled' AND (p.scheduled_at IS NULL OR p.scheduled_at <= NOW())
       ORDER BY COALESCE(p.scheduled_at, p.created_at) ASC LIMIT 100`,
    );

    let processed = 0;
    let failed = 0;
    for (const payout of payouts) {
      try {
        await this.executePayout(Number(payout.id));
        processed += 1;
      } catch (err) {
        failed += 1;
        logger.warn('Payout batch item failed', { payoutId: payout.id, error: err instanceof Error ? err.message : String(err) });
      }
    }
    return { processed, failed };
  }

  async executePayout(payoutId: number, organizationId?: number): Promise<void> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT * FROM payouts WHERE id = ? AND status = 'scheduled' FOR UPDATE`,
        [payoutId],
      );
      const payout = rows[0];
      if (!payout) throw new Error('Payout not approved or not found');

      const [bankRows] = await conn.query<RowDataPacket[]>(
        `SELECT * FROM merchant_bank_accounts WHERE merchant_id = ? AND is_primary = 1 AND deleted_at IS NULL LIMIT 1`,
        [payout.merchant_id],
      );
      if (!bankRows[0]) throw new Error('No verified bank account');

      await conn.query(`UPDATE payouts SET status = 'processing' WHERE id = ?`, [payoutId]);
      await conn.query(
        `INSERT INTO payout_status_history (payout_id, from_status, to_status, changed_by, notes)
         VALUES (?, 'approved', 'processing', NULL, 'Batch payout processor')`,
        [payoutId],
      );
      await conn.commit();

      // Simulate bank transfer success (external rail integration point)
      await this.pool.query(`UPDATE payouts SET status = 'sent', processed_at = NOW() WHERE id = ?`, [payoutId]);
      await this.pool.query(
        `INSERT INTO payout_status_history (payout_id, from_status, to_status, notes) VALUES (?, 'processing', 'sent', 'Bank transfer completed')`,
        [payoutId],
      );

      void eventBus.publish({
        eventType: 'payout.sent',
        aggregateType: 'payout',
        aggregateId: payoutId,
        organizationId: organizationId ?? Number(payout.organization_id),
        payload: { payoutId, amount: Number(payout.amount), merchantId: Number(payout.merchant_id) },
      }).catch(() => {});
      void auditRecorder.record({
        module: 'payouts', categoryCode: 'payouts', actionCode: 'payout_sent',
        entityType: 'payout', entityId: String(payoutId),
        description: 'Batch payout executed', riskLevel: 'high',
      }).catch(() => {});
    } catch (err) {
      await conn.rollback();
      await this.pool.query(
        `UPDATE payouts SET status = 'failed', failure_reason = ? WHERE id = ?`,
        [(err instanceof Error ? err.message : String(err)).slice(0, 500), payoutId],
      );
      await this.pool.query(
        `INSERT INTO payout_status_history (payout_id, from_status, to_status, notes) VALUES (?, 'approved', 'failed', ?)`,
        [payoutId, (err instanceof Error ? err.message : String(err)).slice(0, 500)],
      );
      throw err;
    } finally {
      conn.release();
    }
  }

  async retryPayout(payoutId: number): Promise<void> {
    await this.pool.query(
      `UPDATE payouts SET status = 'scheduled', failure_reason = NULL WHERE id = ? AND status = 'failed'`,
      [payoutId],
    );
    void eventBus.publish({
      eventType: 'payout.retry',
      aggregateType: 'payout',
      aggregateId: payoutId,
      payload: { payoutId },
    }).catch(() => {});
  }
}

export const payoutProcessor = new PayoutProcessor();
