import { randomUUID } from 'crypto';
import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';
import {
  CreateBatchBodyDto,
  CreateSettlementBodyDto,
  ExportQueryDto,
  ReversalBodyDto,
  SettlementListQueryDto,
  SettlementSearchQueryDto,
  UpdateSettlementStatusBodyDto,
} from '../dto';
import {
  SettlementAdjustmentRow,
  SettlementBankTransferRow,
  SettlementBatchRow,
  SettlementFeeRow,
  SettlementNoteRow,
  SettlementReversalRow,
  SettlementRow,
  SettlementStatisticsRow,
  SettlementStatusHistoryRow,
  SettlementTransactionRow,
} from '../types/settlement.types';

interface SettlementFilterQuery {
  search?: string;
  status?: string;
  merchantId?: number;
  batchId?: number;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

export class SettlementRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  private buildFilters(query: SettlementFilterQuery): { clause: string; params: unknown[] } {
    const params: unknown[] = [];
    let clause = ' AND s.deleted_at IS NULL';

    if (query.search) {
      clause += ' AND (s.settlement_ref LIKE ? OR m.display_name LIKE ? OR m.merchant_code LIKE ? OR s.bank_transfer_ref LIKE ?)';
      const term = `%${query.search}%`;
      params.push(term, term, term, term);
    }
    if (query.status) {
      clause += ' AND s.status = ?';
      params.push(query.status);
    }
    if (query.merchantId) {
      clause += ' AND s.merchant_id = ?';
      params.push(query.merchantId);
    }
    if (query.batchId) {
      clause += ' AND s.batch_id = ?';
      params.push(query.batchId);
    }
    if (query.dateFrom) {
      clause += ' AND DATE(COALESCE(s.processed_at, s.created_at)) >= ?';
      params.push(query.dateFrom);
    }
    if (query.dateTo) {
      clause += ' AND DATE(COALESCE(s.processed_at, s.created_at)) <= ?';
      params.push(query.dateTo);
    }
    if (query.minAmount !== undefined) {
      clause += ' AND s.amount >= ?';
      params.push(query.minAmount);
    }
    if (query.maxAmount !== undefined) {
      clause += ' AND s.amount <= ?';
      params.push(query.maxAmount);
    }

    const orgId = getOrganizationId();
    if (orgId) {
      clause += ' AND m.organization_id = ?';
      params.push(orgId);
    }

    return { clause, params };
  }

  private baseSelect = `
    SELECT s.id, s.uuid, s.settlement_ref, s.merchant_id, m.merchant_code, m.display_name AS merchant_name,
           s.batch_id, sb.batch_ref, s.gross_amount, s.fee_amount, s.adjustment_amount, s.amount,
           s.currency, s.status, s.settlement_cycle, s.scheduled_at, s.processed_at,
           s.bank_transfer_ref, s.created_at, s.updated_at
    FROM settlements s
    JOIN merchants m ON m.id = s.merchant_id AND m.deleted_at IS NULL
    LEFT JOIN settlement_batches sb ON sb.id = s.batch_id
  `;

  async findAll(query: SettlementListQueryDto): Promise<{ items: SettlementRow[]; total: number }> {
    const { clause, params } = this.buildFilters(query);
    const sortCol = ['processed_at', 'amount', 'settlement_ref', 'created_at'].includes(query.sortBy) ? query.sortBy : 'created_at';
    const order = query.sortOrder === 'asc' ? 'ASC' : 'DESC';
    const offset = (query.page - 1) * query.pageSize;

    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM settlements s JOIN merchants m ON m.id = s.merchant_id WHERE 1=1 ${clause}`,
      params,
    );
    const total = Number(countRows[0]?.total ?? 0);

    const [rows] = await this.pool.query<SettlementRow[]>(
      `${this.baseSelect} WHERE 1=1 ${clause} ORDER BY s.${sortCol} ${order} LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total };
  }

  async search(query: SettlementSearchQueryDto): Promise<SettlementRow[]> {
    const term = `%${query.q}%`;
    const [rows] = await this.pool.query<SettlementRow[]>(
      `${this.baseSelect} WHERE s.deleted_at IS NULL AND (s.settlement_ref LIKE ? OR m.display_name LIKE ?)
       ORDER BY s.created_at DESC LIMIT ?`,
      [term, term, query.limit],
    );
    return rows;
  }

  async getStatistics(query: SettlementFilterQuery): Promise<SettlementStatisticsRow> {
    const { clause, params } = this.buildFilters(query);
    const [rows] = await this.pool.query<SettlementStatisticsRow[]>(
      `SELECT COUNT(*) AS total, COALESCE(SUM(s.amount), 0) AS total_volume,
              SUM(CASE WHEN s.status = 'processed' THEN 1 ELSE 0 END) AS processed_count,
              SUM(CASE WHEN s.status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
              SUM(CASE WHEN s.status = 'processing' THEN 1 ELSE 0 END) AS processing_count,
              SUM(CASE WHEN s.status = 'failed' THEN 1 ELSE 0 END) AS failed_count,
              SUM(CASE WHEN s.status = 'reversed' THEN 1 ELSE 0 END) AS reversed_count
       FROM settlements s JOIN merchants m ON m.id = s.merchant_id WHERE 1=1 ${clause}`,
      params,
    );
    return rows[0]!;
  }

  async findById(id: number): Promise<SettlementRow | null> {
    const [rows] = await this.pool.query<SettlementRow[]>(
      `${this.baseSelect} WHERE s.id = ? AND s.deleted_at IS NULL`,
      [id],
    );
    return rows[0] ?? null;
  }

  async findByTransactionId(transactionId: number): Promise<SettlementRow | null> {
    const [rows] = await this.pool.query<SettlementRow[]>(
      `${this.baseSelect}
       JOIN settlement_transactions st ON st.settlement_id = s.id
       WHERE st.transaction_id = ? AND s.deleted_at IS NULL LIMIT 1`,
      [transactionId],
    );
    return rows[0] ?? null;
  }

  async findTransactions(settlementId: number): Promise<SettlementTransactionRow[]> {
    const [rows] = await this.pool.query<SettlementTransactionRow[]>(
      `SELECT st.id, st.transaction_id, t.transaction_ref, st.amount, t.currency,
              t.payment_method_detail, t.processed_at
       FROM settlement_transactions st
       JOIN transactions t ON t.id = st.transaction_id
       WHERE st.settlement_id = ? ORDER BY t.processed_at DESC`,
      [settlementId],
    );
    return rows;
  }

  async findStatusHistory(settlementId: number): Promise<SettlementStatusHistoryRow[]> {
    const [rows] = await this.pool.query<SettlementStatusHistoryRow[]>(
      `SELECT id, from_status, to_status, reason, created_at FROM settlement_status_history
       WHERE settlement_id = ? ORDER BY created_at ASC`,
      [settlementId],
    );
    return rows;
  }

  async findReversals(settlementId: number): Promise<SettlementReversalRow[]> {
    const [rows] = await this.pool.query<SettlementReversalRow[]>(
      `SELECT id, uuid, reversal_ref, amount, currency, reason, status, processed_at, created_at
       FROM settlement_reversals WHERE settlement_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`,
      [settlementId],
    );
    return rows;
  }

  async findFees(settlementId: number): Promise<SettlementFeeRow[]> {
    const [rows] = await this.pool.query<SettlementFeeRow[]>(
      `SELECT id, fee_type, amount, currency, description FROM settlement_fees WHERE settlement_id = ?`,
      [settlementId],
    );
    return rows;
  }

  async findBankTransfers(settlementId: number): Promise<SettlementBankTransferRow[]> {
    const [rows] = await this.pool.query<SettlementBankTransferRow[]>(
      `SELECT id, uuid, bank_name, account_masked, transfer_ref, amount, currency, status, sent_at, confirmed_at
       FROM settlement_bank_transfers WHERE settlement_id = ?`,
      [settlementId],
    );
    return rows;
  }

  async findNotes(settlementId: number): Promise<SettlementNoteRow[]> {
    const [rows] = await this.pool.query<SettlementNoteRow[]>(
      `SELECT id, uuid, note_text, is_internal, created_at FROM settlement_notes
       WHERE settlement_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`,
      [settlementId],
    );
    return rows;
  }

  async findAdjustments(settlementId: number): Promise<SettlementAdjustmentRow[]> {
    const [rows] = await this.pool.query<SettlementAdjustmentRow[]>(
      `SELECT id, uuid, adjustment_type, amount, currency, reason FROM settlement_adjustments
       WHERE settlement_id = ? AND deleted_at IS NULL`,
      [settlementId],
    );
    return rows;
  }

  async findBatches(): Promise<SettlementBatchRow[]> {
    const [rows] = await this.pool.query<SettlementBatchRow[]>(
      `SELECT id, uuid, batch_ref, status, total_amount, settlement_count, currency, scheduled_at, processed_at, created_at
       FROM settlement_batches WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 100`,
    );
    return rows;
  }

  async findBatchById(id: number): Promise<SettlementBatchRow | null> {
    const [rows] = await this.pool.query<SettlementBatchRow[]>(
      `SELECT id, uuid, batch_ref, status, total_amount, settlement_count, currency, scheduled_at, processed_at, created_at
       FROM settlement_batches WHERE id = ? AND deleted_at IS NULL`,
      [id],
    );
    return rows[0] ?? null;
  }

  private generateRef(prefix: string): string {
    return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  async create(dto: CreateSettlementBodyDto, userId?: number): Promise<number> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const uuid = randomUUID();
      const ref = this.generateRef('XJ');
      const feeAmount = dto.feeAmount ?? 0;
      const adjustment = dto.adjustmentAmount ?? 0;
      const netAmount = dto.grossAmount - feeAmount + adjustment;

      const [result] = await conn.query<ResultSetHeader>(
        `INSERT INTO settlements (uuid, settlement_ref, merchant_id, batch_id, gross_amount, fee_amount,
          adjustment_amount, amount, currency, status, settlement_cycle, scheduled_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW(), ?)`,
        [uuid, ref, dto.merchantId, dto.batchId ?? null, dto.grossAmount, feeAmount, adjustment,
          netAmount, dto.currency ?? 'USD', dto.settlementCycle ?? null, userId ?? null],
      );
      const settlementId = result.insertId;

      await conn.query(
        `INSERT INTO settlement_status_history (settlement_id, from_status, to_status, reason, changed_by)
         VALUES (?, NULL, 'pending', 'Settlement created', ?)`,
        [settlementId, userId ?? null],
      );

      if (dto.transactionIds?.length) {
        for (const txId of dto.transactionIds) {
          const [txRows] = await conn.query<RowDataPacket[]>(`SELECT amount FROM transactions WHERE id = ?`, [txId]);
          if (txRows[0]) {
            await conn.query(
              `INSERT INTO settlement_transactions (settlement_id, transaction_id, amount) VALUES (?, ?, ?)`,
              [settlementId, txId, txRows[0]['amount']],
            );
          }
        }
      }

      if (feeAmount > 0) {
        await conn.query(
          `INSERT INTO settlement_fees (settlement_id, fee_type, amount, currency, description) VALUES (?, 'processing', ?, ?, 'Processing fee')`,
          [settlementId, feeAmount, dto.currency ?? 'USD'],
        );
      }

      await conn.commit();
      return settlementId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async updateStatus(id: number, dto: UpdateSettlementStatusBodyDto, userId?: number): Promise<void> {
    const [current] = await this.pool.query<RowDataPacket[]>(
      `SELECT status FROM settlements WHERE id = ? AND deleted_at IS NULL`, [id],
    );
    if (!current[0]) throw new Error('Settlement not found');

    await this.pool.query(
      `UPDATE settlements SET status = ?, updated_by = ?,
        processed_at = CASE WHEN ? = 'processed' THEN NOW() ELSE processed_at END WHERE id = ?`,
      [dto.status, userId ?? null, dto.status, id],
    );
    await this.pool.query(
      `INSERT INTO settlement_status_history (settlement_id, from_status, to_status, reason, changed_by)
       VALUES (?, ?, ?, ?, ?)`,
      [id, current[0]['status'], dto.status, dto.reason ?? null, userId ?? null],
    );
  }

  async createReversal(settlementId: number, dto: ReversalBodyDto, userId?: number): Promise<number> {
    const uuid = randomUUID();
    const ref = this.generateRef('REV');
    const [settlement] = await this.pool.query<RowDataPacket[]>(
      `SELECT currency FROM settlements WHERE id = ?`, [settlementId],
    );
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO settlement_reversals (uuid, settlement_id, reversal_ref, amount, currency, reason, status, processed_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 'processed', NOW(), ?)`,
      [uuid, settlementId, ref, dto.amount, settlement[0]?.['currency'] ?? 'USD', dto.reason, userId ?? null],
    );
    await this.updateStatus(settlementId, { status: 'reversed', reason: dto.reason }, userId);
    return result.insertId;
  }

  async createBatch(dto: CreateBatchBodyDto, userId?: number): Promise<number> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const uuid = randomUUID();
      const batchRef = this.generateRef('BATCH');

      const [sumRows] = await conn.query<RowDataPacket[]>(
        `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS cnt, MAX(currency) AS currency
         FROM settlements WHERE id IN (?) AND deleted_at IS NULL`,
        [dto.settlementIds],
      );
      const total = Number(sumRows[0]?.['total'] ?? 0);
      const count = Number(sumRows[0]?.['cnt'] ?? 0);
      const currency = sumRows[0]?.['currency'] ?? 'USD';

      const [result] = await conn.query<ResultSetHeader>(
        `INSERT INTO settlement_batches (uuid, batch_ref, status, total_amount, settlement_count, currency, scheduled_at, created_by)
         VALUES (?, ?, 'processing', ?, ?, ?, ?, ?)`,
        [uuid, batchRef, total, count, currency, dto.scheduledAt ?? null, userId ?? null],
      );
      const batchId = result.insertId;

      await conn.query(`UPDATE settlements SET batch_id = ?, status = 'processing' WHERE id IN (?)`, [batchId, dto.settlementIds]);
      await conn.commit();
      return batchId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async createExport(userId: number, query: ExportQueryDto): Promise<string> {
    const uuid = randomUUID();
    const { clause, params } = this.buildFilters(query);
    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM settlements s JOIN merchants m ON m.id = s.merchant_id WHERE 1=1 ${clause}`,
      params,
    );
    const rowCount = Number(countRows[0]?.total ?? 0);
    await this.pool.query(
      `INSERT INTO settlement_exports (uuid, user_id, format, filter_params, status, row_count, completed_at)
       VALUES (?, ?, ?, ?, 'completed', ?, NOW())`,
      [uuid, userId, query.format ?? 'csv', JSON.stringify(query), rowCount],
    );
    return uuid;
  }

  async exportRows(query: ExportQueryDto): Promise<SettlementRow[]> {
    const { clause, params } = this.buildFilters(query);
    const [rows] = await this.pool.query<SettlementRow[]>(
      `${this.baseSelect} WHERE 1=1 ${clause} ORDER BY s.created_at DESC LIMIT 5000`,
      params,
    );
    return rows;
  }
}
