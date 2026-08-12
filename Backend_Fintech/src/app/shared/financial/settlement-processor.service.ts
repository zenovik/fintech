import { Pool, RowDataPacket } from 'mysql2/promise';
import { randomUUID } from 'crypto';
import { getPool } from '../../database';
import { postingEngine } from '../financial/posting-engine.service';
import { eventBus } from '../events/event-bus.service';
import { auditRecorder } from '../../modules/audit';
import { logger } from '../logger';

export class SettlementProcessor {
  constructor(private readonly pool: Pool = getPool()) {}

  async runDailyBatch(mode: 'daily' | 'weekly' | 'manual' = 'daily'): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    const [merchants] = await this.pool.query<RowDataPacket[]>(
      `SELECT DISTINCT m.id AS merchant_id, m.organization_id
       FROM merchants m
       JOIN merchant_payment_method_config c ON c.merchant_id = m.id
       WHERE m.status = 'active' AND c.status = 'active'`,
    );

    for (const merchant of merchants) {
      const merchantId = Number(merchant.merchant_id);
      const orgId = Number(merchant.organization_id);
      try {
        const result = await this.settleMerchant(merchantId, orgId, mode);
        if (result) processed += 1;
      } catch (err) {
        failed += 1;
        logger.warn('Settlement batch failed for merchant', { merchantId, error: err instanceof Error ? err.message : String(err) });
      }
    }
    return { processed, failed };
  }

  async settleMerchant(merchantId: number, organizationId: number, runType: string): Promise<{ settlementId: number } | null> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();

      const [txns] = await conn.query<RowDataPacket[]>(
        `SELECT t.id, t.amount, t.currency FROM transactions t
         JOIN transaction_statuses ts ON ts.id = t.status_id
         WHERE t.merchant_id = ? AND ts.code IN ('settled', 'pending')
         AND t.id NOT IN (SELECT transaction_id FROM settlement_transactions WHERE transaction_id IS NOT NULL)
         LIMIT 500 FOR UPDATE`,
        [merchantId],
      );
      if (!txns.length) {
        await conn.commit();
        return null;
      }

      const grossAmount = txns.reduce((s, t) => s + Number(t.amount), 0);
      const feeAmount = Math.round(grossAmount * 0.02 * 100) / 100;
      const netAmount = grossAmount - feeAmount;

      const settlementRef = `STL-${Date.now().toString(36).toUpperCase()}`;
      const [settlementResult] = await conn.query(
        `INSERT INTO settlements (uuid, settlement_ref, merchant_id, gross_amount, fee_amount, adjustment_amount, amount, currency, status, settlement_cycle, scheduled_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, 'USD', 'pending', ?, NOW())`,
        [randomUUID(), settlementRef, merchantId, grossAmount, feeAmount, netAmount, runType === 'weekly' ? 'weekly' : 'daily'],
      );
      const settlementId = Number((settlementResult as { insertId: number }).insertId);

      for (const txn of txns) {
        await conn.query(
          `INSERT INTO settlement_transactions (settlement_id, transaction_id, amount) VALUES (?, ?, ?)`,
          [settlementId, txn.id, txn.amount],
        );
      }

      await conn.query(
        `INSERT INTO settlement_run_logs (merchant_id, settlement_id, run_type, status, amount_settled, transaction_count, completed_at)
         VALUES (?, ?, ?, 'completed', ?, ?, NOW())`,
        [merchantId, settlementId, runType === 'manual' ? 'manual' : 'scheduled', netAmount, txns.length],
      );

      await conn.commit();

      void postingEngine.postSettlement(netAmount, settlementId, organizationId).catch(() => {});
      void eventBus.publish({
        eventType: 'settlement.created',
        aggregateType: 'settlement',
        aggregateId: settlementId,
        organizationId,
        payload: { settlementId, merchantId, netAmount, transactionCount: txns.length },
      }).catch(() => {});
      void auditRecorder.record({
        module: 'settlements', categoryCode: 'settlements', actionCode: 'settlement_batch',
        entityType: 'settlement', entityId: String(settlementId),
        description: `Batch settlement ${settlementRef}`, riskLevel: 'medium',
      }).catch(() => {});

      return { settlementId };
    } catch (err) {
      await conn.rollback();
      await this.pool.query(
        `INSERT INTO settlement_run_logs (merchant_id, run_type, status, error_message, completed_at)
         VALUES (?, ?, 'failed', ?, NOW())`,
        [merchantId, runType === 'manual' ? 'manual' : 'scheduled', (err instanceof Error ? err.message : String(err)).slice(0, 1000)],
      );
      throw err;
    } finally {
      conn.release();
    }
  }

  async retryFailed(settlementId: number): Promise<void> {
    await this.pool.query(
      `UPDATE settlements SET status = 'pending', retry_count = retry_count + 1 WHERE id = ? AND status IN ('failed','processing')`,
      [settlementId],
    );
    void eventBus.publish({
      eventType: 'settlement.retry',
      aggregateType: 'settlement',
      aggregateId: settlementId,
      payload: { settlementId },
    }).catch(() => {});
  }
}

export const settlementProcessor = new SettlementProcessor();
