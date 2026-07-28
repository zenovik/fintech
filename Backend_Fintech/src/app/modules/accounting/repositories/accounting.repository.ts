import { Pool, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';

export class AccountingRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async listAccounts(): Promise<RowDataPacket[]> {
    const orgId = getOrganizationId();
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT * FROM ledger_accounts WHERE is_active = 1 AND (? IS NULL OR organization_id IS NULL OR organization_id = ?) ORDER BY account_type`,
      [orgId ?? null, orgId ?? null],
    );
    return rows;
  }

  async listEntries(query: { page: number; pageSize: number; accountId?: number; referenceType?: string }): Promise<{ items: RowDataPacket[]; total: number }> {
    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];
    if (query.accountId) { conditions.push('le.account_id = ?'); params.push(query.accountId); }
    if (query.referenceType) { conditions.push('le.reference_type = ?'); params.push(query.referenceType); }
    const where = `WHERE ${conditions.join(' AND ')}`;
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM ledger_entries le ${where}`, params);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT le.*, la.account_code, la.account_name, la.account_type
       FROM ledger_entries le JOIN ledger_accounts la ON la.id = le.account_id
       ${where} ORDER BY le.posted_at DESC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async getSummary(): Promise<RowDataPacket[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT la.account_type, la.account_code, la.account_name, la.balance,
        (SELECT SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE -amount END) FROM ledger_entries WHERE account_id = la.id) AS computed_balance
       FROM ledger_accounts la WHERE la.is_active = 1 ORDER BY la.account_type`,
    );
    return rows;
  }
}
