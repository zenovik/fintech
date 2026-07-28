import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { randomBytes, randomUUID } from 'node:crypto';
import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';

export class SmartCollectRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async listVirtualAccounts(query: { page: number; pageSize: number; status?: string; merchantId?: number; accountType?: string }) {
    const conditions = ['1=1'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('va.organization_id = ?'); params.push(orgId); }
    if (query.status) { conditions.push('va.status = ?'); params.push(query.status); }
    if (query.merchantId) { conditions.push('va.merchant_id = ?'); params.push(query.merchantId); }
    if (query.accountType) { conditions.push('va.account_type = ?'); params.push(query.accountType); }
    const where = conditions.join(' AND ');
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM virtual_accounts va WHERE ${where}`, params);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT va.*, m.display_name AS merchant_name FROM virtual_accounts va
       JOIN merchants m ON m.id = va.merchant_id WHERE ${where} ORDER BY va.created_at DESC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async findVirtualAccount(id: number): Promise<RowDataPacket | null> {
    const orgId = getOrganizationId();
    const params: unknown[] = [id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND va.organization_id = ?'; params.push(orgId); }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT va.*, m.display_name AS merchant_name FROM virtual_accounts va
       JOIN merchants m ON m.id = va.merchant_id WHERE va.id = ?${orgClause}`, params,
    );
    return rows[0] ?? null;
  }

  async createVirtualAccount(data: Record<string, unknown>, orgId: number, actorId?: number): Promise<number> {
    const accountRef = `VA-${Date.now().toString(36).toUpperCase()}`;
    const accountNumber = `99${randomBytes(7).toString('hex').slice(0, 14)}`;
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO virtual_accounts (uuid, organization_id, merchant_id, customer_id, outlet_id, account_ref, account_number,
        ifsc_code, bank_name, account_type, currency, expected_amount, status, expires_at, metadata, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
      [randomUUID(), orgId, data.merchantId, data.customerId ?? null, data.outletId ?? null,
        accountRef, accountNumber, data.ifscCode ?? 'HDFC0001234', data.bankName ?? 'Partner Bank',
        data.accountType ?? 'dedicated', data.currency ?? 'INR', data.expectedAmount ?? null,
        data.expiresAt ?? null, data.metadata ? JSON.stringify(data.metadata) : null, actorId ?? null],
    );
    return result.insertId;
  }

  async listCollections(query: { page: number; pageSize: number; status?: string; merchantId?: number; virtualAccountId?: number }) {
    const conditions = ['1=1'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('c.organization_id = ?'); params.push(orgId); }
    if (query.status) { conditions.push('c.status = ?'); params.push(query.status); }
    if (query.merchantId) { conditions.push('c.merchant_id = ?'); params.push(query.merchantId); }
    if (query.virtualAccountId) { conditions.push('c.virtual_account_id = ?'); params.push(query.virtualAccountId); }
    const where = conditions.join(' AND ');
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM collections c WHERE ${where}`, params);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT c.*, va.account_number, m.display_name AS merchant_name FROM collections c
       JOIN virtual_accounts va ON va.id = c.virtual_account_id
       JOIN merchants m ON m.id = c.merchant_id WHERE ${where} ORDER BY c.received_at DESC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async findCollection(id: number): Promise<RowDataPacket | null> {
    const orgId = getOrganizationId();
    const params: unknown[] = [id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND c.organization_id = ?'; params.push(orgId); }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT c.*, va.account_ref, va.account_number FROM collections c
       JOIN virtual_accounts va ON va.id = c.virtual_account_id WHERE c.id = ?${orgClause}`, params,
    );
    return rows[0] ?? null;
  }

  async getCollectionEvents(collectionId: number): Promise<RowDataPacket[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT * FROM collection_events WHERE collection_id = ? ORDER BY created_at ASC', [collectionId],
    );
    return rows;
  }

  async matchCollection(id: number, matchType: 'auto' | 'manual', actorId?: number, transactionId?: number): Promise<void> {
    await this.pool.query(
      `UPDATE collections SET status = 'matched', match_type = ?, matched_at = NOW(), matched_by = ?, transaction_id = ? WHERE id = ?`,
      [matchType, actorId ?? null, transactionId ?? null, id],
    );
    await this.pool.query(
      'INSERT INTO collection_events (uuid, collection_id, event_type, actor_id) VALUES (?, ?, ?, ?)',
      [randomUUID(), id, matchType === 'auto' ? 'auto_match' : 'manual_match', actorId ?? null],
    );
  }

  async getDashboardStats(merchantId?: number) {
    const conditions = ['1=1'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('organization_id = ?'); params.push(orgId); }
    if (merchantId) { conditions.push('merchant_id = ?'); params.push(merchantId); }
    const where = conditions.join(' AND ');
    const [vaStats] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active FROM virtual_accounts WHERE ${where}`, params,
    );
    const [collStats] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status='matched' THEN 1 ELSE 0 END) AS matched,
              SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending,
              SUM(CASE WHEN status='unmatched' THEN 1 ELSE 0 END) AS unmatched,
              COALESCE(SUM(amount), 0) AS total_amount
       FROM collections WHERE ${where}`, params,
    );
    return { virtualAccounts: vaStats[0], collections: collStats[0] };
  }
}
