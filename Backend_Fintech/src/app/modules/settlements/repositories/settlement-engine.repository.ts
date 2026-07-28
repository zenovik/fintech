import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { randomUUID } from 'node:crypto';
import { getPool } from '../../../database';

export class SettlementEngineRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async getCalendar(year?: number): Promise<RowDataPacket[]> {
    const y = year ?? new Date().getFullYear();
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT * FROM settlement_calendar WHERE YEAR(calendar_date) = ? ORDER BY calendar_date`, [y],
    );
    return rows;
  }

  async hold(settlementId: number, amount: number, holdType: string, reason: string, userId?: number): Promise<number> {
    const uuid = randomUUID();
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO settlement_holds (uuid, settlement_id, hold_type, amount, reason, held_by) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuid, settlementId, holdType, amount, reason, userId ?? null],
    );
    await this.pool.query(
      `UPDATE settlements SET hold_status = 'held', hold_reason = ? WHERE id = ?`, [reason, settlementId],
    );
    return result.insertId;
  }

  async release(settlementId: number, userId?: number): Promise<void> {
    await this.pool.query(
      `UPDATE settlement_holds SET status = 'released', released_by = ?, released_at = NOW()
       WHERE settlement_id = ? AND status = 'active'`, [userId ?? null, settlementId],
    );
    await this.pool.query(
      `UPDATE settlements SET hold_status = 'released' WHERE id = ?`, [settlementId],
    );
  }

  async createReserve(merchantId: number, data: Record<string, unknown>): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO settlement_reserves (uuid, merchant_id, reserve_type, reserve_pct, reserve_amount, currency)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [randomUUID(), merchantId, data.reserveType ?? 'rolling', data.reservePct ?? null, data.reserveAmount ?? 0, data.currency ?? 'USD'],
    );
    return result.insertId;
  }

  async retry(settlementId: number): Promise<void> {
    await this.pool.query(
      `UPDATE settlements SET status = 'pending', retry_count = retry_count + 1 WHERE id = ?`, [settlementId],
    );
  }

  async listReserves(merchantId?: number): Promise<RowDataPacket[]> {
    const params: unknown[] = [];
    let where = "WHERE status = 'active'";
    if (merchantId) { where += ' AND merchant_id = ?'; params.push(merchantId); }
    const [rows] = await this.pool.query<RowDataPacket[]>(`SELECT * FROM settlement_reserves ${where}`, params);
    return rows;
  }
}
