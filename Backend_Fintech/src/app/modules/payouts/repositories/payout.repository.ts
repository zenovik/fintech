import { randomUUID } from 'crypto';
import { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { appendMerchantOrgFilter } from '../../../shared/context/org-context';
import {
  BankAccountListQueryDto,
  CreateBankAccountBodyDto,
  CreatePayoutBodyDto,
  PayoutListQueryDto,
  UpdateBankAccountBodyDto,
} from '../dto';
import {
  BankAccountRow,
  PayoutHistoryRow,
  PayoutRow,
  PayoutStatisticsRow,
} from '../types/payout.types';

export class PayoutRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  private payoutSelect = `
    SELECT p.*, m.display_name AS merchant_name, m.merchant_code,
           s.settlement_ref,
           ba.bank_name, ba.account_number_masked AS account_masked,
           CONCAT(ab.first_name, ' ', ab.last_name) AS approved_by_name,
           CONCAT(cb.first_name, ' ', cb.last_name) AS created_by_name
    FROM payouts p
    JOIN merchants m ON m.id = p.merchant_id
    LEFT JOIN settlements s ON s.id = p.settlement_id
    LEFT JOIN merchant_bank_accounts ba ON ba.id = p.bank_account_id
    LEFT JOIN users ab ON ab.id = p.approved_by
    LEFT JOIN users cb ON cb.id = p.created_by
  `;

  async findAll(query: PayoutListQueryDto): Promise<{ items: PayoutRow[]; total: number }> {
    const {
      page, pageSize, search, status, payoutType, payoutMethod,
      merchantId, settlementId, dateFrom, dateTo, sortBy, sortOrder,
    } = query;
    const conditions = ['p.deleted_at IS NULL'];
    const params: unknown[] = [];

    if (search) {
      conditions.push('(p.payout_ref LIKE ? OR m.display_name LIKE ? OR s.settlement_ref LIKE ? OR p.transfer_ref LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }
    if (status) { conditions.push('p.status = ?'); params.push(status); }
    if (payoutType) { conditions.push('p.payout_type = ?'); params.push(payoutType); }
    if (payoutMethod) { conditions.push('p.payout_method = ?'); params.push(payoutMethod); }
    if (merchantId) { conditions.push('p.merchant_id = ?'); params.push(merchantId); }
    if (settlementId) { conditions.push('p.settlement_id = ?'); params.push(settlementId); }
    if (dateFrom) { conditions.push('DATE(p.created_at) >= ?'); params.push(dateFrom); }
    if (dateTo) { conditions.push('DATE(p.created_at) <= ?'); params.push(dateTo); }

    appendMerchantOrgFilter(conditions, params);

    const where = `WHERE ${conditions.join(' AND ')}`;
    const allowedSort = ['created_at', 'amount', 'status', 'scheduled_at', 'confirmed_at'];
    const sortCol = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const offset = (page - 1) * pageSize;

    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM payouts p
       JOIN merchants m ON m.id = p.merchant_id
       LEFT JOIN settlements s ON s.id = p.settlement_id
       ${where}`,
      params,
    );
    const total = Number(countRows[0]?.total ?? 0);

    const [rows] = await this.pool.query<PayoutRow[]>(
      `${this.payoutSelect} ${where} ORDER BY p.${sortCol} ${order} LIMIT ? OFFSET ?`,
      [...params, pageSize, offset],
    );
    return { items: rows, total };
  }

  async getStatistics(): Promise<PayoutStatisticsRow> {
    const [rows] = await this.pool.query<PayoutStatisticsRow[]>(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
         SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) AS scheduled_count,
         SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS processing_count,
         SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) AS sent_count,
         SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_count,
         SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_count,
         SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
         COALESCE(SUM(CASE WHEN status IN ('pending', 'scheduled', 'processing', 'sent') THEN amount ELSE 0 END), 0) AS pending_amount,
         COALESCE(SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END), 0) AS confirmed_amount,
         COALESCE(SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END), 0) AS failed_amount
       FROM payouts WHERE deleted_at IS NULL`,
    );
    return rows[0]!;
  }

  async findById(id: number): Promise<PayoutRow | null> {
    const [rows] = await this.pool.query<PayoutRow[]>(`${this.payoutSelect} WHERE p.id = ? AND p.deleted_at IS NULL`, [id]);
    return rows[0] ?? null;
  }

  async findHistory(payoutId: number): Promise<PayoutHistoryRow[]> {
    const [rows] = await this.pool.query<PayoutHistoryRow[]>(
      `SELECT h.*, CONCAT(u.first_name, ' ', u.last_name) AS changed_by_name
       FROM payout_status_history h
       LEFT JOIN users u ON u.id = h.changed_by
       WHERE h.payout_id = ?
       ORDER BY h.created_at ASC`,
      [payoutId],
    );
    return rows;
  }

  async findBankAccounts(query: BankAccountListQueryDto): Promise<BankAccountRow[]> {
    const conditions = ['ba.deleted_at IS NULL'];
    const params: unknown[] = [];
    if (query.merchantId) {
      conditions.push('ba.merchant_id = ?');
      params.push(query.merchantId);
    }
    const [rows] = await this.pool.query<BankAccountRow[]>(
      `SELECT ba.*, m.display_name AS merchant_name
       FROM merchant_bank_accounts ba
       JOIN merchants m ON m.id = ba.merchant_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY ba.is_primary DESC, ba.created_at DESC`,
      params,
    );
    return rows;
  }

  async findBankAccountById(id: number): Promise<BankAccountRow | null> {
    const [rows] = await this.pool.query<BankAccountRow[]>(
      `SELECT ba.*, m.display_name AS merchant_name
       FROM merchant_bank_accounts ba
       JOIN merchants m ON m.id = ba.merchant_id
       WHERE ba.id = ? AND ba.deleted_at IS NULL`,
      [id],
    );
    return rows[0] ?? null;
  }

  private generateRef(prefix: string): string {
    return `${prefix}-${String(Math.floor(100000 + Math.random() * 900000))}`;
  }

  private async addHistory(conn: PoolConnection, payoutId: number, from: string | null, to: string, reason: string | null, userId?: number) {
    await conn.query(
      `INSERT INTO payout_status_history (payout_id, from_status, to_status, reason, changed_by) VALUES (?, ?, ?, ?, ?)`,
      [payoutId, from, to, reason, userId ?? null],
    );
  }

  async getMerchantPrimaryBankAccount(merchantId: number): Promise<number | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id FROM merchant_bank_accounts WHERE merchant_id = ? AND deleted_at IS NULL ORDER BY is_primary DESC LIMIT 1`,
      [merchantId],
    );
    return rows[0] ? Number(rows[0]['id']) : null;
  }

  async getSettlementForPayout(settlementId: number) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id, merchant_id, amount, currency, settlement_ref, status FROM settlements
       WHERE id = ? AND deleted_at IS NULL`,
      [settlementId],
    );
    return rows[0] ?? null;
  }

  async create(dto: CreatePayoutBodyDto, userId?: number): Promise<number> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();

      let amount = dto.amount;
      let currency = 'USD';
      let merchantId = dto.merchantId;
      let bankAccountId = dto.bankAccountId ?? null;

      if (dto.settlementId) {
        const settlement = await this.getSettlementForPayout(dto.settlementId);
        if (!settlement) throw new Error('SETTLEMENT_NOT_FOUND');
        if (Number(settlement.merchant_id) !== merchantId) throw new Error('SETTLEMENT_MERCHANT_MISMATCH');
        amount = dto.amount || Number(settlement.amount);
        currency = settlement.currency as string;
      }

      if (!bankAccountId) {
        bankAccountId = await this.getMerchantPrimaryBankAccount(merchantId);
      } else {
        const [baRows] = await conn.query<RowDataPacket[]>(
          `SELECT merchant_id FROM merchant_bank_accounts WHERE id = ? AND deleted_at IS NULL`,
          [bankAccountId],
        );
        if (!baRows[0] || Number(baRows[0]['merchant_id']) !== merchantId) throw new Error('INVALID_BANK_ACCOUNT');
      }

      const isScheduled = dto.payoutType === 'scheduled' || (dto.scheduledAt && new Date(dto.scheduledAt) > new Date());
      const initialStatus = isScheduled ? 'scheduled' : 'pending';

      const uuid = randomUUID();
      const payoutRef = this.generateRef('PO');

      const [result] = await conn.query<ResultSetHeader>(
        `INSERT INTO payouts (
          uuid, payout_ref, merchant_id, settlement_id, bank_account_id,
          amount, fee_amount, currency, payout_type, payout_method, status,
          scheduled_at, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuid, payoutRef, merchantId, dto.settlementId ?? null, bankAccountId,
          amount, dto.feeAmount ?? 0, currency, dto.payoutType ?? 'manual', dto.payoutMethod ?? 'bank_transfer',
          initialStatus, dto.scheduledAt ?? null, dto.notes ?? null, userId ?? null,
        ],
      );
      const payoutId = result.insertId;

      await this.addHistory(conn, payoutId, null, initialStatus,
        isScheduled ? 'Scheduled payout created' : 'Manual payout request submitted', userId);

      await conn.commit();
      return payoutId;
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
      const payout = await this.findById(id);
      if (!payout || !['pending', 'scheduled'].includes(payout.status)) throw new Error('INVALID_STATUS');

      const fromStatus = payout.status;
      const transferRef = this.generateRef('PO-TX');

      await conn.query(
        `UPDATE payouts SET status = 'confirmed', transfer_ref = ?, approved_by = ?, approved_at = NOW(),
          processed_at = NOW(), confirmed_at = NOW(), updated_by = ? WHERE id = ?`,
        [transferRef, userId ?? null, userId ?? null, id],
      );

      await this.addHistory(conn, id, fromStatus, 'processing', 'Payout approved', userId);
      await this.addHistory(conn, id, 'processing', 'sent', `Transfer ${transferRef} initiated`, userId);
      await this.addHistory(conn, id, 'sent', 'confirmed', 'Bank confirmed receipt', userId);

      if (payout.settlement_id) {
        await conn.query(
          `UPDATE settlements SET status = 'processed', processed_at = NOW(), bank_transfer_ref = ?, updated_by = ?
           WHERE id = ? AND status IN ('pending', 'processing')`,
          [transferRef, userId ?? null, payout.settlement_id],
        );
      }

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
      const payout = await this.findById(id);
      if (!payout || payout.status !== 'pending') throw new Error('INVALID_STATUS');

      await conn.query(
        `UPDATE payouts SET status = 'cancelled', failure_reason = ?, updated_by = ? WHERE id = ?`,
        [reason, userId ?? null, id],
      );
      await this.addHistory(conn, id, 'pending', 'cancelled', reason, userId);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async retry(id: number, userId?: number): Promise<void> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const payout = await this.findById(id);
      if (!payout || payout.status !== 'failed') throw new Error('INVALID_STATUS');

      const transferRef = this.generateRef('PO-TX');
      await conn.query(
        `UPDATE payouts SET status = 'confirmed', transfer_ref = ?, failure_reason = NULL,
          processed_at = NOW(), confirmed_at = NOW(), updated_by = ? WHERE id = ?`,
        [transferRef, userId ?? null, id],
      );
      await this.addHistory(conn, id, 'failed', 'processing', 'Retry initiated', userId);
      await this.addHistory(conn, id, 'processing', 'sent', `Retry transfer ${transferRef}`, userId);
      await this.addHistory(conn, id, 'sent', 'confirmed', 'Retry succeeded', userId);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async createBankAccount(dto: CreateBankAccountBodyDto): Promise<number> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      if (dto.isPrimary) {
        await conn.query(
          `UPDATE merchant_bank_accounts SET is_primary = 0 WHERE merchant_id = ? AND deleted_at IS NULL`,
          [dto.merchantId],
        );
      }
      const [result] = await conn.query<ResultSetHeader>(
        `INSERT INTO merchant_bank_accounts (uuid, merchant_id, account_holder, bank_name, account_number_masked, iban, swift_bic, currency, is_primary)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          randomUUID(), dto.merchantId, dto.accountHolder, dto.bankName ?? null,
          dto.accountNumberMasked, dto.iban ?? null, dto.swiftBic ?? null,
          dto.currency ?? 'USD', dto.isPrimary ? 1 : 0,
        ],
      );
      await conn.commit();
      return result.insertId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async updateBankAccount(id: number, dto: UpdateBankAccountBodyDto): Promise<void> {
    const account = await this.findBankAccountById(id);
    if (!account) throw new Error('NOT_FOUND');

    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      if (dto.isPrimary) {
        await conn.query(
          `UPDATE merchant_bank_accounts SET is_primary = 0 WHERE merchant_id = ? AND deleted_at IS NULL`,
          [account.merchant_id],
        );
        await conn.query(`UPDATE merchant_bank_accounts SET is_primary = 1 WHERE id = ?`, [id]);
      }
      if (dto.bankName !== undefined) {
        await conn.query(`UPDATE merchant_bank_accounts SET bank_name = ? WHERE id = ?`, [dto.bankName, id]);
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}
