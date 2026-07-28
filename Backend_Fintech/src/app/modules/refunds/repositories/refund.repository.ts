import { randomUUID } from 'crypto';
import { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { appendMerchantOrgFilter } from '../../../shared/context/org-context';
import { CreateRefundBodyDto, RefundListQueryDto } from '../dto';
import { RefundHistoryRow, RefundRow, RefundStatisticsRow } from '../types/refund.types';

export class RefundRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  private baseSelect = `
    SELECT r.*, t.transaction_ref, t.amount AS transaction_amount,
           m.display_name AS merchant_name, m.merchant_code,
           c.display_name AS customer_name, c.email AS customer_email,
           CONCAT(ru.first_name, ' ', ru.last_name) AS requested_by_name,
           CONCAT(au.first_name, ' ', au.last_name) AS approved_by_name,
           CONCAT(rej.first_name, ' ', rej.last_name) AS rejected_by_name
    FROM transaction_refunds r
    JOIN transactions t ON t.id = r.transaction_id
    JOIN merchants m ON m.id = r.merchant_id
    LEFT JOIN customers c ON c.id = r.customer_id
    LEFT JOIN users ru ON ru.id = r.requested_by
    LEFT JOIN users au ON au.id = r.approved_by
    LEFT JOIN users rej ON rej.id = r.rejected_by
  `;

  async findAll(query: RefundListQueryDto): Promise<{ items: RefundRow[]; total: number }> {
    const { page, pageSize, search, status, refundType, merchantId, customerId, transactionId, dateFrom, dateTo, sortBy, sortOrder } = query;
    const conditions = ['r.deleted_at IS NULL'];
    const params: unknown[] = [];

    if (search) {
      conditions.push('(r.refund_ref LIKE ? OR t.transaction_ref LIKE ? OR m.display_name LIKE ? OR c.display_name LIKE ? OR c.email LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }
    if (status) { conditions.push('r.status = ?'); params.push(status); }
    if (refundType) { conditions.push('r.refund_type = ?'); params.push(refundType); }
    if (merchantId) { conditions.push('r.merchant_id = ?'); params.push(merchantId); }
    if (customerId) { conditions.push('r.customer_id = ?'); params.push(customerId); }
    if (transactionId) { conditions.push('r.transaction_id = ?'); params.push(transactionId); }
    if (dateFrom) { conditions.push('DATE(r.created_at) >= ?'); params.push(dateFrom); }
    if (dateTo) { conditions.push('DATE(r.created_at) <= ?'); params.push(dateTo); }

    appendMerchantOrgFilter(conditions, params);

    const where = `WHERE ${conditions.join(' AND ')}`;
    const allowedSort = ['created_at', 'amount', 'status', 'processed_at'];
    const sortCol = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const offset = (page - 1) * pageSize;

    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM transaction_refunds r
       JOIN transactions t ON t.id = r.transaction_id
       JOIN merchants m ON m.id = r.merchant_id
       LEFT JOIN customers c ON c.id = r.customer_id
       ${where}`,
      params,
    );
    const total = Number(countRows[0]?.total ?? 0);

    const [rows] = await this.pool.query<RefundRow[]>(
      `${this.baseSelect} ${where} ORDER BY r.${sortCol} ${order} LIMIT ? OFFSET ?`,
      [...params, pageSize, offset],
    );
    return { items: rows, total };
  }

  async getStatistics(): Promise<RefundStatisticsRow> {
    const [rows] = await this.pool.query<RefundStatisticsRow[]>(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
         SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
         SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count,
         SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END) AS processed_count,
         SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_count,
         COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS pending_amount,
         COALESCE(SUM(CASE WHEN status = 'processed' THEN amount ELSE 0 END), 0) AS processed_amount
       FROM transaction_refunds WHERE deleted_at IS NULL`,
    );
    return rows[0]!;
  }

  async findById(id: number): Promise<RefundRow | null> {
    const [rows] = await this.pool.query<RefundRow[]>(`${this.baseSelect} WHERE r.id = ? AND r.deleted_at IS NULL`, [id]);
    return rows[0] ?? null;
  }

  async findHistory(refundId: number): Promise<RefundHistoryRow[]> {
    const [rows] = await this.pool.query<RefundHistoryRow[]>(
      `SELECT h.*, CONCAT(u.first_name, ' ', u.last_name) AS changed_by_name
       FROM refund_status_history h
       LEFT JOIN users u ON u.id = h.changed_by
       WHERE h.refund_id = ?
       ORDER BY h.created_at ASC`,
      [refundId],
    );
    return rows;
  }

  async getRefundedTotal(transactionId: number, excludeId?: number): Promise<number> {
    const params: unknown[] = [transactionId];
    let exclude = '';
    if (excludeId) {
      exclude = ' AND id != ?';
      params.push(excludeId);
    }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM transaction_refunds
       WHERE transaction_id = ? AND deleted_at IS NULL
         AND status IN ('pending', 'approved', 'processed') ${exclude}`,
      params,
    );
    return Number(rows[0]?.total ?? 0);
  }

  async getTransactionForRefund(transactionId: number) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id, merchant_id, customer_id, amount, currency, transaction_ref FROM transactions
       WHERE id = ? AND deleted_at IS NULL`,
      [transactionId],
    );
    return rows[0] ?? null;
  }

  private generateRef(prefix: string): string {
    return `${prefix}-${String(Math.floor(100000 + Math.random() * 900000))}`;
  }

  private async addHistory(conn: PoolConnection, refundId: number, from: string | null, to: string, reason: string | null, userId?: number) {
    await conn.query(
      `INSERT INTO refund_status_history (refund_id, from_status, to_status, reason, changed_by) VALUES (?, ?, ?, ?, ?)`,
      [refundId, from, to, reason, userId ?? null],
    );
  }

  async createRequest(dto: CreateRefundBodyDto, userId?: number): Promise<number> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const tx = await this.getTransactionForRefund(dto.transactionId);
      if (!tx) throw new Error('TRANSACTION_NOT_FOUND');

      const txAmount = Number(tx.amount);
      const alreadyRefunded = await this.getRefundedTotal(dto.transactionId);
      const remaining = txAmount - alreadyRefunded;
      if (dto.amount > remaining + 0.001) throw new Error('AMOUNT_EXCEEDS_REMAINING');

      const refundType = dto.amount >= txAmount - alreadyRefunded - 0.001 ? 'full' : 'partial';
      const uuid = randomUUID();
      const refundRef = this.generateRef('REF');

      const [result] = await conn.query<ResultSetHeader>(
        `INSERT INTO transaction_refunds (
          uuid, transaction_id, merchant_id, customer_id, refund_ref, refund_type,
          amount, currency, reason, status, requested_by, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
        [
          uuid, dto.transactionId, tx.merchant_id, tx.customer_id ?? null, refundRef, refundType,
          dto.amount, tx.currency, dto.reason ?? null, userId ?? null, userId ?? null,
        ],
      );
      const refundId = result.insertId;

      await conn.query(
        `INSERT INTO transaction_events (uuid, transaction_id, event_type, event_data, actor_user_id)
         VALUES (?, ?, 'refund.requested', ?, ?)`,
        [randomUUID(), dto.transactionId, JSON.stringify({ amount: dto.amount, refundRef }), userId ?? null],
      );

      await this.addHistory(conn, refundId, null, 'pending', dto.reason ?? 'Refund request submitted', userId);
      await conn.commit();
      return refundId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async approve(id: number, userId?: number): Promise<void> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const refund = await this.findById(id);
      if (!refund || refund.status !== 'pending') throw new Error('INVALID_STATUS');

      await conn.query(
        `UPDATE transaction_refunds SET status = 'processed', approved_by = ?, approved_at = NOW(), processed_at = NOW(), updated_by = ?
         WHERE id = ?`,
        [userId ?? null, userId ?? null, id],
      );

      await conn.query(
        `INSERT INTO transaction_events (uuid, transaction_id, event_type, event_data, actor_user_id)
         VALUES (?, ?, 'refund.processed', ?, ?)`,
        [randomUUID(), refund.transaction_id, JSON.stringify({ amount: refund.amount, refundRef: refund.refund_ref }), userId ?? null],
      );

      await this.addHistory(conn, id, 'pending', 'approved', 'Refund approved', userId);
      await this.addHistory(conn, id, 'approved', 'processed', 'Refund processed', userId);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async reject(id: number, reason: string, userId?: number): Promise<void> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const refund = await this.findById(id);
      if (!refund || refund.status !== 'pending') throw new Error('INVALID_STATUS');

      await conn.query(
        `UPDATE transaction_refunds SET status = 'rejected', rejected_by = ?, rejected_at = NOW(), rejection_reason = ?, updated_by = ?
         WHERE id = ?`,
        [userId ?? null, reason, userId ?? null, id],
      );

      await conn.query(
        `INSERT INTO transaction_events (uuid, transaction_id, event_type, event_data, actor_user_id)
         VALUES (?, ?, 'refund.rejected', ?, ?)`,
        [randomUUID(), refund.transaction_id, JSON.stringify({ reason, refundRef: refund.refund_ref }), userId ?? null],
      );

      await this.addHistory(conn, id, 'pending', 'rejected', reason, userId);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}
