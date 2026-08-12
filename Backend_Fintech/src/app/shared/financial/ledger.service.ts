import { Pool, RowDataPacket } from 'mysql2/promise';
import { randomUUID } from 'crypto';
import { getPool } from '../../database';
import { getOrganizationId } from '../context/org-context';
import { postingEngine, PostJournalInput } from '../financial/posting-engine.service';

export class LedgerRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async listJournals(query: { page: number; pageSize: number; status?: string }): Promise<{ items: RowDataPacket[]; total: number }> {
    const conditions = ['1=1'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('(organization_id IS NULL OR organization_id = ?)'); params.push(orgId); }
    if (query.status) { conditions.push('status = ?'); params.push(query.status); }
    const where = conditions.join(' AND ');
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM journal_entries WHERE ${where}`, params);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT * FROM journal_entries WHERE ${where} ORDER BY posted_at DESC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async getJournal(id: number): Promise<{ entry: RowDataPacket; lines: RowDataPacket[] } | null> {
    const [entries] = await this.pool.query<RowDataPacket[]>(`SELECT * FROM journal_entries WHERE id = ?`, [id]);
    if (!entries[0]) return null;
    const [lines] = await this.pool.query<RowDataPacket[]>(
      `SELECT jl.*, la.account_code, la.account_name FROM journal_lines jl
       JOIN ledger_accounts la ON la.id = jl.account_id WHERE jl.journal_entry_id = ? ORDER BY jl.line_number`,
      [id],
    );
    return { entry: entries[0], lines };
  }

  async listPeriods(): Promise<RowDataPacket[]> {
    const orgId = getOrganizationId();
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT * FROM accounting_periods WHERE organization_id = ? ORDER BY period_year DESC, period_month DESC`,
      [orgId],
    );
    return rows;
  }

  async closePeriod(year: number, month: number, actorId?: number): Promise<number> {
    const orgId = getOrganizationId();
    const [result] = await this.pool.query(
      `INSERT INTO accounting_periods (organization_id, period_year, period_month, status, closed_at, closed_by)
       VALUES (?, ?, ?, 'closed', NOW(), ?)
       ON DUPLICATE KEY UPDATE status = 'closed', closed_at = NOW(), closed_by = VALUES(closed_by)`,
      [orgId, year, month, actorId ?? null],
    );
    return Number((result as { insertId: number }).insertId);
  }
}

export class LedgerService {
  constructor(private readonly repo = new LedgerRepository()) {}

  async postJournal(input: PostJournalInput, actorId?: number) {
    const orgId = getOrganizationId();
    return postingEngine.postJournal({ ...input, organizationId: orgId ?? undefined, createdBy: actorId });
  }

  async reverseJournal(journalEntryId: number, actorId?: number, reason?: string) {
    return postingEngine.reverseJournal(journalEntryId, actorId, reason);
  }

  async trialBalance() {
    return postingEngine.trialBalance();
  }

  async validateBalances() {
    return postingEngine.validateBalances();
  }

  async listJournals(query: { page: number; pageSize: number; status?: string }) {
    const { items, total } = await this.repo.listJournals(query);
    return {
      items: items.map((j) => ({
        id: j.id, journalRef: j.journal_ref, status: j.status, version: j.version,
        totalDebit: Number(j.total_debit), totalCredit: Number(j.total_credit),
        referenceType: j.reference_type, referenceId: j.reference_id,
        description: j.description, postedAt: j.posted_at,
      })),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) || 1 },
    };
  }

  async getJournal(id: number) {
    const data = await this.repo.getJournal(id);
    if (!data) return null;
    return {
      entry: {
        id: data.entry.id, journalRef: data.entry.journal_ref, status: data.entry.status,
        description: data.entry.description, postedAt: data.entry.posted_at,
      },
      lines: data.lines.map((l) => ({
        accountCode: l.account_code, accountName: l.account_name,
        lineType: l.line_type, amount: Number(l.amount),
      })),
    };
  }

  async closePeriod(year: number, month: number, actorId?: number) {
    const id = await this.repo.closePeriod(year, month, actorId);
    return { id, year, month, status: 'closed' };
  }

  async listPeriods() {
    return (await this.repo.listPeriods()).map((p) => ({
      id: p.id, year: p.period_year, month: p.period_month, status: p.status, closedAt: p.closed_at,
    }));
  }
}
