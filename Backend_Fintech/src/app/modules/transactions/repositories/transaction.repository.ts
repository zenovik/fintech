import { randomUUID } from 'crypto';
import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { getOrganizationId, appendMerchantOrgFilter } from '../../../shared/context/org-context';
import {
  CreateDisputeBodyDto,
  CreateTransactionBodyDto,
  ExportQueryDto,
  RefundTransactionBodyDto,
  TransactionListQueryDto,
  TransactionSearchQueryDto,
  UpdateTransactionStatusBodyDto,
} from '../dto';
import { PERIOD_DAYS } from '../constants/transaction.constants';
import {
  TransactionAttachmentRow,
  TransactionDisputeRow,
  TransactionEventRow,
  TransactionFeeRow,
  TransactionNoteRow,
  TransactionRefundRow,
  TransactionRow,
  TransactionStatisticsRow,
  TransactionStatusHistoryRow,
} from '../types/transaction.types';

interface TransactionFilterQuery {
  search?: string;
  status?: string;
  merchantId?: number;
  regionId?: number;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  isHighValue?: boolean;
  period?: keyof typeof PERIOD_DAYS;
}

export class TransactionRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  private buildFilters(query: TransactionFilterQuery): { clause: string; params: unknown[] } {
    const params: unknown[] = [];
    let clause = ' AND t.deleted_at IS NULL';

    if ('period' in query && query.period) {
      clause += ' AND t.processed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)';
      params.push(PERIOD_DAYS[query.period]);
    }
    if (query.dateFrom) {
      clause += ' AND DATE(t.processed_at) >= ?';
      params.push(query.dateFrom);
    }
    if (query.dateTo) {
      clause += ' AND DATE(t.processed_at) <= ?';
      params.push(query.dateTo);
    }
    if ('search' in query && query.search) {
      clause += ' AND (t.transaction_ref LIKE ? OR m.display_name LIKE ? OR m.merchant_code LIKE ? OR t.customer_name LIKE ? OR t.customer_email LIKE ?)';
      const term = `%${query.search}%`;
      params.push(term, term, term, term, term);
    }
    if (query.status) {
      clause += ' AND ts.code = ?';
      params.push(query.status);
    }
    if (query.merchantId) {
      clause += ' AND t.merchant_id = ?';
      params.push(query.merchantId);
    }
    if ('regionId' in query && query.regionId) {
      clause += ' AND t.region_id = ?';
      params.push(query.regionId);
    }
    if ('paymentMethod' in query && query.paymentMethod) {
      clause += ' AND pmt.code = ?';
      params.push(query.paymentMethod);
    }
    if ('minAmount' in query && query.minAmount !== undefined) {
      clause += ' AND t.amount >= ?';
      params.push(query.minAmount);
    }
    if ('maxAmount' in query && query.maxAmount !== undefined) {
      clause += ' AND t.amount <= ?';
      params.push(query.maxAmount);
    }
    if (query.isHighValue) {
      clause += ' AND t.is_high_value = 1';
    }

    const orgId = getOrganizationId();
    if (orgId) {
      clause += ' AND m.organization_id = ?';
      params.push(orgId);
    }

    return { clause, params };
  }

  private baseSelect = `
    SELECT t.id, t.uuid, t.transaction_ref, t.merchant_id, m.merchant_code, m.display_name AS merchant_name,
           m.logo_initials, m.logo_color, t.customer_name, t.customer_email, t.description,
           t.amount, t.fee_amount, t.net_amount, t.currency, t.payment_method_type_id,
           t.payment_method_detail, pmt.icon_key AS payment_icon_key,
           t.status_id, ts.code AS status_code, ts.label AS status_label, ts.badge_color,
           t.region_id, r.code AS region_code, t.is_high_value, t.processed_at, t.settled_at,
           t.created_at, t.updated_at
    FROM transactions t
    JOIN merchants m ON m.id = t.merchant_id AND m.deleted_at IS NULL
    JOIN payment_method_types pmt ON pmt.id = t.payment_method_type_id
    JOIN transaction_statuses ts ON ts.id = t.status_id
    LEFT JOIN regions r ON r.id = t.region_id
  `;

  async findAll(query: TransactionListQueryDto): Promise<{ items: TransactionRow[]; total: number }> {
    const { clause, params } = this.buildFilters(query);
    const sortCol = ['processed_at', 'amount', 'transaction_ref'].includes(query.sortBy) ? query.sortBy : 'processed_at';
    const order = query.sortOrder === 'asc' ? 'ASC' : 'DESC';
    const offset = (query.page - 1) * query.pageSize;

    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM transactions t
       JOIN merchants m ON m.id = t.merchant_id AND m.deleted_at IS NULL
       JOIN transaction_statuses ts ON ts.id = t.status_id
       JOIN payment_method_types pmt ON pmt.id = t.payment_method_type_id
       WHERE 1=1 ${clause}`,
      params,
    );
    const total = Number(countRows[0]?.total ?? 0);

    const [rows] = await this.pool.query<TransactionRow[]>(
      `${this.baseSelect} WHERE 1=1 ${clause} ORDER BY t.${sortCol} ${order} LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total };
  }

  async search(query: TransactionSearchQueryDto): Promise<TransactionRow[]> {
    const term = `%${query.q}%`;
    const [rows] = await this.pool.query<TransactionRow[]>(
      `${this.baseSelect}
       WHERE t.deleted_at IS NULL
         AND (t.transaction_ref LIKE ? OR m.display_name LIKE ? OR t.customer_name LIKE ?)
       ORDER BY t.processed_at DESC LIMIT ?`,
      [term, term, term, query.limit],
    );
    return rows;
  }

  async getStatistics(query: TransactionFilterQuery): Promise<TransactionStatisticsRow> {
    const { clause, params } = this.buildFilters(query);
    const [rows] = await this.pool.query<TransactionStatisticsRow[]>(
      `SELECT
         COUNT(*) AS total,
         COALESCE(SUM(t.amount), 0) AS total_volume,
         SUM(CASE WHEN ts.code = 'settled' THEN 1 ELSE 0 END) AS settled_count,
         SUM(CASE WHEN ts.code = 'pending' THEN 1 ELSE 0 END) AS pending_count,
         SUM(CASE WHEN ts.code = 'failed' THEN 1 ELSE 0 END) AS failed_count,
         SUM(CASE WHEN ts.code = 'flagged' THEN 1 ELSE 0 END) AS flagged_count,
         SUM(CASE WHEN t.is_high_value = 1 THEN 1 ELSE 0 END) AS high_value_count,
         (SELECT COUNT(*) FROM transaction_refunds tr JOIN transactions tx ON tx.id = tr.transaction_id WHERE tr.deleted_at IS NULL AND tx.deleted_at IS NULL) AS refund_count,
         (SELECT COUNT(*) FROM transaction_disputes td WHERE td.deleted_at IS NULL) AS dispute_count
       FROM transactions t
       JOIN transaction_statuses ts ON ts.id = t.status_id
       JOIN merchants m ON m.id = t.merchant_id
       WHERE 1=1 ${clause}`,
      params,
    );
    return rows[0]!;
  }

  async findById(id: number): Promise<TransactionRow | null> {
    const [rows] = await this.pool.query<TransactionRow[]>(
      `${this.baseSelect} WHERE t.id = ? AND t.deleted_at IS NULL`,
      [id],
    );
    return rows[0] ?? null;
  }

  async findLinkedSettlement(transactionId: number): Promise<RowDataPacket | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT s.id, s.uuid, s.settlement_ref, s.amount, s.currency, s.status, s.processed_at
       FROM settlement_transactions st
       JOIN settlements s ON s.id = st.settlement_id AND s.deleted_at IS NULL
       WHERE st.transaction_id = ? LIMIT 1`,
      [transactionId],
    );
    return rows[0] ?? null;
  }

  async findEvents(transactionId: number): Promise<TransactionEventRow[]> {
    const [rows] = await this.pool.query<TransactionEventRow[]>(
      `SELECT id, uuid, event_type, event_data, created_at FROM transaction_events
       WHERE transaction_id = ? ORDER BY created_at ASC`,
      [transactionId],
    );
    return rows;
  }

  async findStatusHistory(transactionId: number): Promise<TransactionStatusHistoryRow[]> {
    const [rows] = await this.pool.query<TransactionStatusHistoryRow[]>(
      `SELECT h.id, fs.code AS from_status_code, fs.label AS from_status_label,
              ts.code AS to_status_code, ts.label AS to_status_label, h.reason, h.created_at
       FROM transaction_status_history h
       LEFT JOIN transaction_statuses fs ON fs.id = h.from_status_id
       JOIN transaction_statuses ts ON ts.id = h.to_status_id
       WHERE h.transaction_id = ? ORDER BY h.created_at ASC`,
      [transactionId],
    );
    return rows;
  }

  async findRefunds(transactionId: number): Promise<TransactionRefundRow[]> {
    const [rows] = await this.pool.query<TransactionRefundRow[]>(
      `SELECT id, uuid, refund_ref, amount, currency, reason, status, processed_at, created_at
       FROM transaction_refunds WHERE transaction_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`,
      [transactionId],
    );
    return rows;
  }

  async findFees(transactionId: number): Promise<TransactionFeeRow[]> {
    const [rows] = await this.pool.query<TransactionFeeRow[]>(
      `SELECT id, fee_type, amount, currency, description FROM transaction_fees WHERE transaction_id = ?`,
      [transactionId],
    );
    return rows;
  }

  async findNotes(transactionId: number): Promise<TransactionNoteRow[]> {
    const [rows] = await this.pool.query<TransactionNoteRow[]>(
      `SELECT id, uuid, note_text, is_internal, created_at FROM transaction_notes
       WHERE transaction_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`,
      [transactionId],
    );
    return rows;
  }

  async findAttachments(transactionId: number): Promise<TransactionAttachmentRow[]> {
    const [rows] = await this.pool.query<TransactionAttachmentRow[]>(
      `SELECT id, uuid, file_name, file_url, mime_type, created_at FROM transaction_attachments
       WHERE transaction_id = ? AND deleted_at IS NULL`,
      [transactionId],
    );
    return rows;
  }

  async findDisputes(transactionId?: number): Promise<TransactionDisputeRow[]> {
    const conditions = ['td.deleted_at IS NULL'];
    const params: unknown[] = [];
    if (transactionId) {
      conditions.push('td.transaction_id = ?');
      params.push(transactionId);
    }
    const [rows] = await this.pool.query<TransactionDisputeRow[]>(
      `SELECT td.id, td.uuid, td.dispute_ref, td.transaction_id, t.transaction_ref,
              m.display_name AS merchant_name, td.reason, td.status, td.amount, td.currency,
              td.evidence_due_at, td.resolved_at, td.created_at
       FROM transaction_disputes td
       JOIN transactions t ON t.id = td.transaction_id
       JOIN merchants m ON m.id = t.merchant_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY td.created_at DESC LIMIT 100`,
      params,
    );
    return rows;
  }

  async getStatusIdByCode(code: string): Promise<number | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id FROM transaction_statuses WHERE code = ? LIMIT 1`,
      [code],
    );
    return rows[0] ? Number(rows[0]['id']) : null;
  }

  private generateRef(prefix: string): string {
    const num = String(Math.floor(100000 + Math.random() * 900000));
    return `${prefix}-${num}`;
  }

  async create(dto: CreateTransactionBodyDto, userId?: number): Promise<number> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const uuid = randomUUID();
      const ref = this.generateRef('TXN');
      const statusId = await this.getStatusIdByCode('pending');
      const feeAmount = Math.round(dto.amount * 0.025 * 100) / 100;
      const netAmount = dto.amount - feeAmount;
      const isHighValue = dto.amount >= 50000 ? 1 : 0;

      const [merchantRows] = await conn.query<RowDataPacket[]>(
        `SELECT region_id FROM merchants WHERE id = ? AND deleted_at IS NULL`,
        [dto.merchantId],
      );
      if (!merchantRows[0]) throw new Error('Merchant not found');
      const regionId = dto.regionId ?? Number(merchantRows[0]['region_id']);

      const [result] = await conn.query<ResultSetHeader>(
        `INSERT INTO transactions (
          uuid, transaction_ref, merchant_id, customer_name, customer_email, description,
          amount, fee_amount, net_amount, currency, payment_method_type_id, payment_method_detail,
          status_id, region_id, is_high_value, processed_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
        [
          uuid, ref, dto.merchantId, dto.customerName ?? null, dto.customerEmail ?? null,
          dto.description ?? null, dto.amount, feeAmount, netAmount, dto.currency ?? 'USD',
          dto.paymentMethodTypeId, dto.paymentMethodDetail, statusId, regionId, isHighValue, userId ?? null,
        ],
      );
      const txId = result.insertId;

      await conn.query(
        `INSERT INTO transaction_events (uuid, transaction_id, event_type, actor_user_id)
         VALUES (?, ?, 'payment.created', ?)`,
        [randomUUID(), txId, userId ?? null],
      );
      await conn.query(
        `INSERT INTO transaction_status_history (transaction_id, from_status_id, to_status_id, reason, changed_by)
         VALUES (?, NULL, ?, 'Transaction created', ?)`,
        [txId, statusId, userId ?? null],
      );
      await conn.query(
        `INSERT INTO transaction_fees (transaction_id, fee_type, amount, currency, description)
         VALUES (?, 'processing', ?, ?, 'Processing fee')`,
        [txId, feeAmount, dto.currency ?? 'USD'],
      );

      await conn.commit();
      return txId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async updateStatus(id: number, dto: UpdateTransactionStatusBodyDto, userId?: number): Promise<void> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const [current] = await conn.query<RowDataPacket[]>(
        `SELECT status_id FROM transactions WHERE id = ? AND deleted_at IS NULL`,
        [id],
      );
      if (!current[0]) throw new Error('Transaction not found');

      const newStatusId = await this.getStatusIdByCode(dto.statusCode);
      if (!newStatusId) throw new Error('Invalid status');

      await conn.query(
        `UPDATE transactions SET status_id = ?, updated_by = ?, settled_at = CASE WHEN ? = (SELECT id FROM transaction_statuses WHERE code = 'settled') THEN NOW() ELSE settled_at END WHERE id = ?`,
        [newStatusId, userId ?? null, newStatusId, id],
      );
      await conn.query(
        `INSERT INTO transaction_status_history (transaction_id, from_status_id, to_status_id, reason, changed_by)
         VALUES (?, ?, ?, ?, ?)`,
        [id, current[0]['status_id'], newStatusId, dto.reason ?? null, userId ?? null],
      );
      await conn.query(
        `INSERT INTO transaction_events (uuid, transaction_id, event_type, event_data, actor_user_id)
         VALUES (?, ?, 'status.changed', ?, ?)`,
        [randomUUID(), id, JSON.stringify({ to: dto.statusCode, reason: dto.reason }), userId ?? null],
      );
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async createRefund(transactionId: number, dto: RefundTransactionBodyDto, userId?: number): Promise<number> {
    const uuid = randomUUID();
    const refundRef = this.generateRef('REF');
    const [txRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT currency FROM transactions WHERE id = ? AND deleted_at IS NULL`,
      [transactionId],
    );
    if (!txRows[0]) throw new Error('Transaction not found');

    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO transaction_refunds (uuid, transaction_id, refund_ref, amount, currency, reason, status, processed_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 'processed', NOW(), ?)`,
      [uuid, transactionId, refundRef, dto.amount, txRows[0]['currency'], dto.reason ?? null, userId ?? null],
    );

    await this.pool.query(
      `INSERT INTO transaction_events (uuid, transaction_id, event_type, event_data, actor_user_id)
       VALUES (?, ?, 'refund.processed', ?, ?)`,
      [randomUUID(), transactionId, JSON.stringify({ amount: dto.amount, refundRef }), userId ?? null],
    );

    return result.insertId;
  }

  async createDispute(dto: CreateDisputeBodyDto, userId?: number): Promise<number> {
    const [txRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT merchant_id, customer_id, amount, currency FROM transactions WHERE id = ? AND deleted_at IS NULL`,
      [dto.transactionId],
    );
    if (!txRows[0]) throw new Error('Transaction not found');

    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO transaction_disputes (uuid, transaction_id, merchant_id, customer_id, dispute_ref, reason, amount, currency, evidence_due_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), ?)`,
      [
        randomUUID(),
        dto.transactionId,
        txRows[0]['merchant_id'],
        txRows[0]['customer_id'] ?? null,
        this.generateRef('CB'),
        dto.reason,
        dto.amount ?? Number(txRows[0]['amount']),
        txRows[0]['currency'],
        userId ?? null,
      ],
    );

    await this.pool.query(
      `INSERT INTO transaction_events (uuid, transaction_id, event_type, event_data, actor_user_id)
       VALUES (?, ?, 'dispute.opened', ?, ?)`,
      [randomUUID(), dto.transactionId, JSON.stringify({ reason: dto.reason }), userId ?? null],
    );

    return result.insertId;
  }

  async createExport(userId: number, query: ExportQueryDto): Promise<string> {
    const uuid = randomUUID();
    const { clause, params } = this.buildFilters(query);
    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM transactions t
       JOIN transaction_statuses ts ON ts.id = t.status_id
       JOIN merchants m ON m.id = t.merchant_id
       WHERE 1=1 ${clause}`,
      params,
    );
    const rowCount = Number(countRows[0]?.total ?? 0);

    await this.pool.query(
      `INSERT INTO transaction_exports (uuid, user_id, format, filter_params, status, row_count, completed_at)
       VALUES (?, ?, ?, ?, 'completed', ?, NOW())`,
      [uuid, userId, query.format ?? 'csv', JSON.stringify(query), rowCount],
    );
    return uuid;
  }

  async exportRows(query: ExportQueryDto): Promise<TransactionRow[]> {
    const { clause, params } = this.buildFilters(query);
    const [rows] = await this.pool.query<TransactionRow[]>(
      `${this.baseSelect} WHERE 1=1 ${clause} ORDER BY t.processed_at DESC LIMIT 5000`,
      params,
    );
    return rows;
  }
}
