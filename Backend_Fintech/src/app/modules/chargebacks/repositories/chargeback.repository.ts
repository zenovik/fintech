import { randomUUID } from 'crypto';
import { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { appendMerchantOrgFilter } from '../../../shared/context/org-context';
import {
  AddEvidenceBodyDto,
  ChargebackListQueryDto,
  CreateChargebackBodyDto,
  RepresentmentBodyDto,
  ResolveChargebackBodyDto,
} from '../dto';
import {
  ChargebackEvidenceRow,
  ChargebackHistoryRow,
  ChargebackRow,
  ChargebackStatisticsRow,
} from '../types/chargeback.types';

export class ChargebackRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  private baseSelect = `
    SELECT d.*, t.transaction_ref, t.amount AS transaction_amount,
           m.display_name AS merchant_name, m.merchant_code,
           c.display_name AS customer_name, c.email AS customer_email,
           CONCAT(cb.first_name, ' ', cb.last_name) AS created_by_name,
           CONCAT(rb.first_name, ' ', rb.last_name) AS representment_submitted_by_name,
           CONCAT(res.first_name, ' ', res.last_name) AS resolved_by_name
    FROM transaction_disputes d
    JOIN transactions t ON t.id = d.transaction_id
    JOIN merchants m ON m.id = d.merchant_id
    LEFT JOIN customers c ON c.id = d.customer_id
    LEFT JOIN users cb ON cb.id = d.created_by
    LEFT JOIN users rb ON rb.id = d.representment_submitted_by
    LEFT JOIN users res ON res.id = d.resolved_by
  `;

  async findAll(query: ChargebackListQueryDto): Promise<{ items: ChargebackRow[]; total: number }> {
    const {
      page, pageSize, search, status, reasonCode, cardNetwork,
      merchantId, customerId, transactionId, dateFrom, dateTo, sortBy, sortOrder,
    } = query;
    const conditions = ['d.deleted_at IS NULL'];
    const params: unknown[] = [];

    if (search) {
      conditions.push('(d.dispute_ref LIKE ? OR t.transaction_ref LIKE ? OR m.display_name LIKE ? OR c.display_name LIKE ? OR c.email LIKE ? OR d.reason LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term, term, term);
    }
    if (status) { conditions.push('d.status = ?'); params.push(status); }
    if (reasonCode) { conditions.push('d.reason_code = ?'); params.push(reasonCode); }
    if (cardNetwork) { conditions.push('d.card_network = ?'); params.push(cardNetwork); }
    if (merchantId) { conditions.push('d.merchant_id = ?'); params.push(merchantId); }
    if (customerId) { conditions.push('d.customer_id = ?'); params.push(customerId); }
    if (transactionId) { conditions.push('d.transaction_id = ?'); params.push(transactionId); }
    if (dateFrom) { conditions.push('DATE(d.created_at) >= ?'); params.push(dateFrom); }
    if (dateTo) { conditions.push('DATE(d.created_at) <= ?'); params.push(dateTo); }

    appendMerchantOrgFilter(conditions, params);

    const where = `WHERE ${conditions.join(' AND ')}`;
    const allowedSort = ['created_at', 'amount', 'status', 'evidence_due_at', 'resolved_at'];
    const sortCol = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const offset = (page - 1) * pageSize;

    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM transaction_disputes d
       JOIN transactions t ON t.id = d.transaction_id
       JOIN merchants m ON m.id = d.merchant_id
       LEFT JOIN customers c ON c.id = d.customer_id
       ${where}`,
      params,
    );
    const total = Number(countRows[0]?.total ?? 0);

    const [rows] = await this.pool.query<ChargebackRow[]>(
      `${this.baseSelect} ${where} ORDER BY d.${sortCol} ${order} LIMIT ? OFFSET ?`,
      [...params, pageSize, offset],
    );
    return { items: rows, total };
  }

  async getStatistics(): Promise<ChargebackStatisticsRow> {
    const [rows] = await this.pool.query<ChargebackStatisticsRow[]>(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) AS open_count,
         SUM(CASE WHEN status = 'evidence_required' THEN 1 ELSE 0 END) AS evidence_required_count,
         SUM(CASE WHEN status = 'under_review' THEN 1 ELSE 0 END) AS under_review_count,
         SUM(CASE WHEN status = 'representment_submitted' THEN 1 ELSE 0 END) AS representment_count,
         SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) AS won_count,
         SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) AS lost_count,
         SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) AS closed_count,
         COALESCE(SUM(CASE WHEN status IN ('open', 'evidence_required', 'under_review', 'representment_submitted') THEN amount ELSE 0 END), 0) AS open_amount,
         COALESCE(SUM(CASE WHEN status = 'won' THEN amount ELSE 0 END), 0) AS won_amount,
         COALESCE(SUM(CASE WHEN status = 'lost' THEN amount ELSE 0 END), 0) AS lost_amount
       FROM transaction_disputes WHERE deleted_at IS NULL`,
    );
    return rows[0]!;
  }

  async findById(id: number): Promise<ChargebackRow | null> {
    const [rows] = await this.pool.query<ChargebackRow[]>(`${this.baseSelect} WHERE d.id = ? AND d.deleted_at IS NULL`, [id]);
    return rows[0] ?? null;
  }

  async findHistory(disputeId: number): Promise<ChargebackHistoryRow[]> {
    const [rows] = await this.pool.query<ChargebackHistoryRow[]>(
      `SELECT h.*, CONCAT(u.first_name, ' ', u.last_name) AS changed_by_name
       FROM dispute_status_history h
       LEFT JOIN users u ON u.id = h.changed_by
       WHERE h.dispute_id = ?
       ORDER BY h.created_at ASC`,
      [disputeId],
    );
    return rows;
  }

  async findEvidence(disputeId: number): Promise<ChargebackEvidenceRow[]> {
    const [rows] = await this.pool.query<ChargebackEvidenceRow[]>(
      `SELECT e.*, CONCAT(u.first_name, ' ', u.last_name) AS uploaded_by_name
       FROM dispute_evidence e
       LEFT JOIN users u ON u.id = e.uploaded_by
       WHERE e.dispute_id = ? AND e.deleted_at IS NULL
       ORDER BY e.created_at ASC`,
      [disputeId],
    );
    return rows;
  }

  private generateRef(prefix: string): string {
    return `${prefix}-${String(Math.floor(100000 + Math.random() * 900000))}`;
  }

  private async addHistory(conn: PoolConnection, disputeId: number, from: string | null, to: string, reason: string | null, userId?: number) {
    await conn.query(
      `INSERT INTO dispute_status_history (dispute_id, from_status, to_status, reason, changed_by) VALUES (?, ?, ?, ?, ?)`,
      [disputeId, from, to, reason, userId ?? null],
    );
  }

  async getTransactionForChargeback(transactionId: number) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id, merchant_id, customer_id, amount, currency, transaction_ref FROM transactions
       WHERE id = ? AND deleted_at IS NULL`,
      [transactionId],
    );
    return rows[0] ?? null;
  }

  async create(dto: CreateChargebackBodyDto, userId?: number): Promise<number> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const tx = await this.getTransactionForChargeback(dto.transactionId);
      if (!tx) throw new Error('TRANSACTION_NOT_FOUND');

      const uuid = randomUUID();
      const disputeRef = this.generateRef('CB');
      const amount = dto.amount ?? Number(tx.amount);
      const evidenceDue = dto.evidenceDueAt ?? null;

      const [result] = await conn.query<ResultSetHeader>(
        `INSERT INTO transaction_disputes (
          uuid, transaction_id, merchant_id, customer_id, dispute_ref, reason, reason_code,
          card_network, status, amount, currency, evidence_due_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ${evidenceDue ? '?' : 'DATE_ADD(NOW(), INTERVAL 7 DAY)'}, ?)`,
        evidenceDue
          ? [uuid, dto.transactionId, tx.merchant_id, tx.customer_id ?? null, disputeRef, dto.reason, dto.reasonCode, dto.cardNetwork, amount, tx.currency, evidenceDue, userId ?? null]
          : [uuid, dto.transactionId, tx.merchant_id, tx.customer_id ?? null, disputeRef, dto.reason, dto.reasonCode, dto.cardNetwork, amount, tx.currency, userId ?? null],
      );
      const disputeId = result.insertId;

      await conn.query(
        `INSERT INTO transaction_events (uuid, transaction_id, event_type, event_data, actor_user_id)
         VALUES (?, ?, 'dispute.opened', ?, ?)`,
        [randomUUID(), dto.transactionId, JSON.stringify({ disputeRef, reason: dto.reason }), userId ?? null],
      );

      await this.addHistory(conn, disputeId, null, 'open', dto.reason, userId);
      await conn.commit();
      return disputeId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async addEvidence(id: number, dto: AddEvidenceBodyDto, userId?: number): Promise<number> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const dispute = await this.findById(id);
      if (!dispute) throw new Error('NOT_FOUND');
      if (['won', 'lost', 'closed'].includes(dispute.status)) throw new Error('INVALID_STATUS');

      const [result] = await conn.query<ResultSetHeader>(
        `INSERT INTO dispute_evidence (uuid, dispute_id, file_name, file_url, mime_type, description, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [randomUUID(), id, dto.fileName, dto.fileUrl, dto.mimeType ?? null, dto.description ?? null, userId ?? null],
      );

      if (dispute.status === 'open') {
        await conn.query(
          `UPDATE transaction_disputes SET status = 'evidence_required', updated_by = ? WHERE id = ?`,
          [userId ?? null, id],
        );
        await this.addHistory(conn, id, 'open', 'evidence_required', 'Evidence uploaded — awaiting additional documents', userId);
      }

      await conn.commit();
      return result.insertId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async submitRepresentment(id: number, dto: RepresentmentBodyDto, userId?: number): Promise<void> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const dispute = await this.findById(id);
      if (!dispute) throw new Error('NOT_FOUND');
      if (!['open', 'evidence_required', 'under_review'].includes(dispute.status)) throw new Error('INVALID_STATUS');

      const fromStatus = dispute.status;
      await conn.query(
        `UPDATE transaction_disputes SET
          status = 'representment_submitted',
          representment_notes = ?,
          representment_submitted_at = NOW(),
          representment_submitted_by = ?,
          updated_by = ?
         WHERE id = ?`,
        [dto.notes, userId ?? null, userId ?? null, id],
      );

      await this.addHistory(conn, id, fromStatus, 'representment_submitted', dto.notes, userId);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async resolve(id: number, dto: ResolveChargebackBodyDto, userId?: number): Promise<void> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const dispute = await this.findById(id);
      if (!dispute) throw new Error('NOT_FOUND');
      if (['won', 'lost', 'closed'].includes(dispute.status)) throw new Error('INVALID_STATUS');

      const status =
        dto.outcome === 'merchant_won' ? 'won'
          : dto.outcome === 'merchant_lost' ? 'lost'
            : dto.outcome;

      const fromStatus = dispute.status;
      await conn.query(
        `UPDATE transaction_disputes SET
          status = ?,
          resolution_notes = ?,
          resolved_at = NOW(),
          resolved_by = ?,
          updated_by = ?
         WHERE id = ?`,
        [status, dto.notes ?? null, userId ?? null, userId ?? null, id],
      );

      await conn.query(
        `INSERT INTO transaction_events (uuid, transaction_id, event_type, event_data, actor_user_id)
         VALUES (?, ?, 'dispute.resolved', ?, ?)`,
        [randomUUID(), dispute.transaction_id, JSON.stringify({ outcome: dto.outcome, disputeRef: dispute.dispute_ref }), userId ?? null],
      );

      await this.addHistory(conn, id, fromStatus, status, dto.notes ?? `Chargeback ${status}`, userId);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async getSlaDashboard() {
    const conditions = ['d.deleted_at IS NULL'];
    const params: unknown[] = [];
    appendMerchantOrgFilter(conditions, params);
    const where = `WHERE ${conditions.join(' AND ')}`;
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN d.sla_due_at IS NOT NULL AND d.sla_due_at < NOW() AND d.status NOT IN ('won','lost','closed') THEN 1 ELSE 0 END) AS breached,
              SUM(CASE WHEN d.sla_due_at IS NOT NULL AND d.sla_due_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 DAY) THEN 1 ELSE 0 END) AS due_soon,
              SUM(CASE WHEN d.representment_status = 'pending' THEN 1 ELSE 0 END) AS pending_representment
       FROM transaction_disputes d JOIN merchants m ON m.id = d.merchant_id ${where}`, params,
    );
    return rows[0];
  }

  async submitArbitration(id: number, notes: string | undefined, userId?: number): Promise<void> {
    await this.pool.query(
      `UPDATE transaction_disputes SET arbitration_status = 'pending', representment_notes = COALESCE(?, representment_notes), updated_by = ? WHERE id = ?`,
      [notes ?? null, userId ?? null, id],
    );
  }

  async getAnalytics() {
    const conditions = ['d.deleted_at IS NULL'];
    const params: unknown[] = [];
    appendMerchantOrgFilter(conditions, params);
    const where = `WHERE ${conditions.join(' AND ')}`;
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN d.status = 'won' THEN 1 ELSE 0 END) AS won,
              SUM(CASE WHEN d.status = 'lost' THEN 1 ELSE 0 END) AS lost,
              COALESCE(SUM(d.amount), 0) AS total_amount,
              COALESCE(AVG(DATEDIFF(d.resolved_at, d.created_at)), 0) AS avg_resolution_days
       FROM transaction_disputes d JOIN merchants m ON m.id = d.merchant_id ${where}`, params,
    );
    return rows[0];
  }
}
