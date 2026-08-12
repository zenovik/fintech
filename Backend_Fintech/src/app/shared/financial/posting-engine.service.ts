import { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { randomUUID } from 'crypto';
import { getPool } from '../../database';
import { ValidationError } from '../exceptions/app.exception';
import { cacheGet, cacheSet } from '../infrastructure/redis.client';

export interface JournalLineInput {
  accountCode: string;
  lineType: 'debit' | 'credit';
  amount: number;
  description?: string;
}

export interface PostJournalInput {
  description: string;
  referenceType?: string;
  referenceId?: number;
  currency?: string;
  lines: JournalLineInput[];
  organizationId?: number;
  createdBy?: number;
}

export class PostingEngineRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async findAccountByCode(code: string, conn?: PoolConnection): Promise<RowDataPacket | null> {
    const db = conn ?? this.pool;
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT * FROM ledger_accounts WHERE account_code = ? AND is_active = 1 LIMIT 1`,
      [code],
    );
    return rows[0] ?? null;
  }

  async createJournalEntry(
    input: PostJournalInput & { totalDebit: number; totalCredit: number },
    conn: PoolConnection,
  ): Promise<number> {
    const journalRef = `JRN-${Date.now().toString(36).toUpperCase()}`;
    const [result] = await conn.query(
      `INSERT INTO journal_entries (uuid, journal_ref, organization_id, status, reference_type, reference_id,
        description, currency, total_debit, total_credit, posted_at, created_by)
       VALUES (?, ?, ?, 'posted', ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [
        randomUUID(), journalRef, input.organizationId ?? null,
        input.referenceType ?? null, input.referenceId ?? null,
        input.description, input.currency ?? 'USD',
        input.totalDebit, input.totalCredit, input.createdBy ?? null,
      ],
    );
    return Number((result as { insertId: number }).insertId);
  }

  async createJournalLine(
    journalEntryId: number,
    accountId: number,
    line: JournalLineInput,
    lineNumber: number,
    currency: string,
    conn: PoolConnection,
  ): Promise<void> {
    await conn.query(
      `INSERT INTO journal_lines (uuid, journal_entry_id, account_id, line_type, amount, currency, description, line_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), journalEntryId, accountId, line.lineType, line.amount, currency, line.description ?? null, lineNumber],
    );
  }

  async syncLedgerEntry(
    journalEntryId: number,
    accountId: number,
    line: JournalLineInput,
    referenceType: string | undefined,
    referenceId: number | undefined,
    currency: string,
    createdBy: number | undefined,
    conn: PoolConnection,
  ): Promise<void> {
    const entryRef = `LE-${journalEntryId}-${accountId}-${line.lineType}`;
    await conn.query(
      `INSERT INTO ledger_entries (uuid, entry_ref, account_id, entry_type, amount, currency, reference_type, reference_id, description, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(), entryRef, accountId, line.lineType, line.amount, currency,
        referenceType ?? null, referenceId ?? null, line.description ?? null, createdBy ?? null,
      ],
    );
  }

  async upsertAccountBalance(accountId: number, delta: number, lineType: 'debit' | 'credit', journalEntryId: number, conn: PoolConnection): Promise<void> {
    const signedDelta = lineType === 'debit' ? delta : -delta;
    await conn.query(
      `INSERT INTO account_balances (account_id, balance, debit_total, credit_total, last_journal_entry_id)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         balance = balance + VALUES(balance),
         debit_total = debit_total + VALUES(debit_total),
         credit_total = credit_total + VALUES(credit_total),
         last_journal_entry_id = VALUES(last_journal_entry_id)`,
      [
        accountId,
        signedDelta,
        lineType === 'debit' ? delta : 0,
        lineType === 'credit' ? delta : 0,
        journalEntryId,
      ],
    );
    await conn.query(
      `UPDATE ledger_accounts SET balance = balance + ? WHERE id = ?`,
      [signedDelta, accountId],
    );
  }

  async getTrialBalance(): Promise<RowDataPacket[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT la.account_code, la.account_name, la.account_type,
        COALESCE(ab.debit_total, 0) AS debit_total,
        COALESCE(ab.credit_total, 0) AS credit_total,
        COALESCE(ab.balance, la.balance) AS balance
       FROM ledger_accounts la
       LEFT JOIN account_balances ab ON ab.account_id = la.id
       WHERE la.is_active = 1
       ORDER BY la.account_type, la.account_code`,
    );
    return rows;
  }

  async findJournalById(id: number): Promise<RowDataPacket | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(`SELECT * FROM journal_entries WHERE id = ?`, [id]);
    return rows[0] ?? null;
  }

  async listJournalLines(journalEntryId: number): Promise<RowDataPacket[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT jl.*, la.account_code, la.account_name FROM journal_lines jl
       JOIN ledger_accounts la ON la.id = jl.account_id WHERE jl.journal_entry_id = ? ORDER BY jl.line_number`,
      [journalEntryId],
    );
    return rows;
  }

  async markReversed(originalId: number, reversalId: number, conn: PoolConnection): Promise<void> {
    await conn.query(
      `UPDATE journal_entries SET status = 'reversed', version = version + 1 WHERE id = ?`,
      [originalId],
    );
    await conn.query(
      `UPDATE journal_entries SET reversal_of_id = ? WHERE id = ?`,
      [originalId, reversalId],
    );
  }
}

export class PostingEngineService {
  constructor(
    private readonly repo = new PostingEngineRepository(),
    private readonly pool: Pool = getPool(),
  ) {}

  validateBalance(lines: JournalLineInput[]): { totalDebit: number; totalCredit: number } {
    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of lines) {
      if (!Number.isFinite(line.amount) || line.amount <= 0) {
        throw new ValidationError('Journal line amounts must be positive');
      }
      if (line.lineType === 'debit') totalDebit += line.amount;
      else totalCredit += line.amount;
    }
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new ValidationError(`Journal out of balance: debit ${totalDebit} != credit ${totalCredit}`);
    }
    return { totalDebit, totalCredit };
  }

  async postJournal(input: PostJournalInput, conn?: PoolConnection): Promise<{ journalEntryId: number; journalRef: string }> {
    const { totalDebit, totalCredit } = this.validateBalance(input.lines);
    const ownConn = conn ?? await this.pool.getConnection();
    const external = !conn;
    try {
      if (external) await ownConn.beginTransaction();

      const journalEntryId = await this.repo.createJournalEntry({ ...input, totalDebit, totalCredit }, ownConn);
      const [refRows] = await ownConn.query<RowDataPacket[]>(`SELECT journal_ref FROM journal_entries WHERE id = ?`, [journalEntryId]);
      const journalRef = String(refRows[0]?.journal_ref ?? '');

      let lineNumber = 1;
      for (const line of input.lines) {
        const account = await this.repo.findAccountByCode(line.accountCode, ownConn);
        if (!account) throw new ValidationError(`Ledger account not found: ${line.accountCode}`);
        await this.repo.createJournalLine(journalEntryId, Number(account.id), line, lineNumber++, input.currency ?? 'USD', ownConn);
        await this.repo.syncLedgerEntry(journalEntryId, Number(account.id), line, input.referenceType, input.referenceId, input.currency ?? 'USD', input.createdBy, ownConn);
        await this.repo.upsertAccountBalance(Number(account.id), line.amount, line.lineType, journalEntryId, ownConn);
        await cacheSet(`ledger:balance:${account.account_code}`, null, 1);
      }

      if (external) await ownConn.commit();
      return { journalEntryId, journalRef };
    } catch (err) {
      if (external) await ownConn.rollback();
      throw err;
    } finally {
      if (external) ownConn.release();
    }
  }

  async postPaymentCapture(amount: number, merchantId: number, transactionId: number, organizationId?: number, actorId?: number): Promise<void> {
    await this.postJournal({
      description: `Payment capture TXN-${transactionId}`,
      referenceType: 'transaction',
      referenceId: transactionId,
      organizationId,
      createdBy: actorId,
      lines: [
        { accountCode: '1000-CASH', lineType: 'debit', amount, description: 'Cash received' },
        { accountCode: '4000-REV', lineType: 'credit', amount, description: `Merchant ${merchantId} revenue` },
      ],
    });
  }

  async postSettlement(amount: number, settlementId: number, organizationId?: number, actorId?: number): Promise<void> {
    await this.postJournal({
      description: `Settlement STL-${settlementId}`,
      referenceType: 'settlement',
      referenceId: settlementId,
      organizationId,
      createdBy: actorId,
      lines: [
        { accountCode: '4000-REV', lineType: 'debit', amount, description: 'Settlement debit revenue' },
        { accountCode: '2000-SETTLE', lineType: 'credit', amount, description: 'Settlement payable' },
      ],
    });
  }

  async reverseJournal(journalEntryId: number, actorId?: number, reason?: string): Promise<{ reversalJournalId: number }> {
    const original = await this.repo.findJournalById(journalEntryId);
    if (!original) throw new ValidationError('Journal entry not found');
    if (original.status !== 'posted') throw new ValidationError('Only posted journals can be reversed');

    const lines = await this.repo.listJournalLines(journalEntryId);
    const reversedLines: JournalLineInput[] = lines.map((l) => ({
      accountCode: String(l.account_code),
      lineType: l.line_type === 'debit' ? 'credit' : 'debit',
      amount: Number(l.amount),
      description: reason ?? `Reversal of ${original.journal_ref}`,
    }));

    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const result = await this.postJournal({
        description: reason ?? `Reversal of ${original.journal_ref}`,
        referenceType: String(original.reference_type ?? 'journal_reversal'),
        referenceId: journalEntryId,
        organizationId: original.organization_id ? Number(original.organization_id) : undefined,
        createdBy: actorId,
        lines: reversedLines,
      }, conn);
      await this.repo.markReversed(journalEntryId, result.journalEntryId, conn);
      await conn.commit();
      return { reversalJournalId: result.journalEntryId };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async trialBalance(): Promise<Record<string, unknown>[]> {
    const cached = await cacheGet<Record<string, unknown>[]>('ledger:trial_balance');
    if (cached) return cached;
    const rows = await this.repo.getTrialBalance();
    const mapped = rows.map((r) => ({
      accountCode: r.account_code,
      accountName: r.account_name,
      accountType: r.account_type,
      debitTotal: Number(r.debit_total),
      creditTotal: Number(r.credit_total),
      balance: Number(r.balance),
    }));
    await cacheSet('ledger:trial_balance', mapped, 60);
    return mapped;
  }

  async validateBalances(): Promise<{ balanced: boolean; totalDebit: number; totalCredit: number }> {
    const tb = await this.trialBalance();
    const totalDebit = tb.reduce((s, r) => s + Number(r.debitTotal ?? 0), 0);
    const totalCredit = tb.reduce((s, r) => s + Number(r.creditTotal ?? 0), 0);
    return { balanced: Math.abs(totalDebit - totalCredit) < 0.01, totalDebit, totalCredit };
  }
}

export const postingEngine = new PostingEngineService();
