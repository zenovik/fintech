import { randomUUID } from 'node:crypto';
import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';

export class ReconciliationRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async getDashboardStats() {
    const orgId = getOrganizationId();
    const params: unknown[] = [];
    let orgClause = '';
    if (orgId) { orgClause = ' WHERE organization_id = ?'; params.push(orgId); }
    const [imports] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed,
              SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) AS failed
       FROM reconciliation_imports${orgClause}`, params,
    );
    const recParams = [...params];
    const recOrg = orgId ? ' WHERE organization_id = ?' : '';
    const [records] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN match_status='unmatched' THEN 1 ELSE 0 END) AS unmatched,
              SUM(CASE WHEN match_status IN ('auto_matched','manual_matched') THEN 1 ELSE 0 END) AS matched,
              SUM(CASE WHEN match_status='exception' THEN 1 ELSE 0 END) AS exceptions
       FROM reconciliation_records${recOrg}`, recParams,
    );
    return { imports: imports[0], records: records[0] };
  }

  async listImports(query: { page: number; pageSize: number; status?: string }) {
    const conditions = ['1=1'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('ri.organization_id = ?'); params.push(orgId); }
    if (query.status) { conditions.push('ri.status = ?'); params.push(query.status); }
    const where = conditions.join(' AND ');
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM reconciliation_imports ri WHERE ${where}`, params);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT ri.* FROM reconciliation_imports ri WHERE ${where} ORDER BY ri.created_at DESC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async findImport(id: number): Promise<RowDataPacket | null> {
    const orgId = getOrganizationId();
    const params: unknown[] = [id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND organization_id = ?'; params.push(orgId); }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT * FROM reconciliation_imports WHERE id = ?${orgClause}`, params,
    );
    return rows[0] ?? null;
  }

  async createImport(data: Record<string, unknown>, orgId: number, actorId?: number): Promise<number> {
    const importRef = `REC-${Date.now().toString(36).toUpperCase()}`;
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO reconciliation_imports (uuid, organization_id, merchant_id, import_ref, source_type, file_name, imported_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), orgId, data.merchantId ?? null, importRef, data.sourceType ?? 'csv',
        data.fileName ?? null, actorId ?? null],
    );
    return result.insertId;
  }

  async updateImport(id: number, data: Record<string, unknown>): Promise<void> {
    const orgId = getOrganizationId();
    const params: unknown[] = [data.status, data.totalRows ?? 0, data.matchedRows ?? 0, data.unmatchedRows ?? 0, id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND organization_id = ?'; params.push(orgId); }
    const completed = data.status === 'completed' ? ', completed_at = NOW()' : '';
    await this.pool.query(
      `UPDATE reconciliation_imports SET status = ?, total_rows = ?, matched_rows = ?, unmatched_rows = ?${completed} WHERE id = ?${orgClause}`, params,
    );
  }

  async deleteImport(id: number): Promise<void> {
    const orgId = getOrganizationId();
    const params: unknown[] = [id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND organization_id = ?'; params.push(orgId); }
    await this.pool.query(`DELETE FROM reconciliation_imports WHERE id = ?${orgClause}`, params);
  }

  async listRecords(query: { page: number; pageSize: number; importId?: number; matchStatus?: string }) {
    const conditions = ['1=1'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('rr.organization_id = ?'); params.push(orgId); }
    if (query.importId) { conditions.push('rr.import_id = ?'); params.push(query.importId); }
    if (query.matchStatus) { conditions.push('rr.match_status = ?'); params.push(query.matchStatus); }
    const where = conditions.join(' AND ');
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM reconciliation_records rr WHERE ${where}`, params);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT rr.* FROM reconciliation_records rr WHERE ${where} ORDER BY rr.record_date DESC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async findRecord(id: number): Promise<RowDataPacket | null> {
    const orgId = getOrganizationId();
    const params: unknown[] = [id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND organization_id = ?'; params.push(orgId); }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT * FROM reconciliation_records WHERE id = ?${orgClause}`, params,
    );
    return rows[0] ?? null;
  }

  async createRecord(importId: number, data: Record<string, unknown>, orgId: number): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO reconciliation_records (uuid, import_id, organization_id, merchant_id, external_ref, amount, currency, record_date, record_type, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), importId, orgId, data.merchantId ?? null, data.externalRef, data.amount,
        data.currency ?? 'USD', data.recordDate, data.recordType ?? 'settlement',
        data.metadata ? JSON.stringify(data.metadata) : null],
    );
    return result.insertId;
  }

  async matchRecord(id: number, matchType: 'auto' | 'manual', actorId?: number, transactionId?: number, settlementId?: number): Promise<void> {
    await this.pool.query(
      `UPDATE reconciliation_records SET match_status = ?, matched_at = NOW(), matched_by = ?,
        transaction_id = ?, settlement_id = ? WHERE id = ?`,
      [matchType === 'auto' ? 'auto_matched' : 'manual_matched', actorId ?? null, transactionId ?? null, settlementId ?? null, id],
    );
  }

  async autoMatchImport(importId: number, actorId?: number): Promise<{ matched: number; exceptions: number }> {
    const [records] = await this.pool.query<RowDataPacket[]>(
      `SELECT * FROM reconciliation_records WHERE import_id = ? AND match_status = 'unmatched'`,
      [importId],
    );
    let matched = 0;
    let exceptions = 0;
    for (const rec of records) {
      const amount = Number(rec.amount);
      const [txns] = await this.pool.query<RowDataPacket[]>(
        `SELECT id, amount FROM transactions WHERE merchant_id = ? AND ABS(amount - ?) < 0.01 LIMIT 1`,
        [rec.merchant_id, amount],
      );
      if (txns[0]) {
        await this.matchRecord(Number(rec.id), 'auto', actorId, Number(txns[0].id));
        await this.pool.query(
          `INSERT INTO reconciliation_matches (uuid, record_id, match_type, matched_entity_type, matched_entity_id, status, matched_by)
           VALUES (?, ?, 'automatic', 'transaction', ?, 'matched', ?)`,
          [randomUUID(), rec.id, txns[0].id, actorId ?? null],
        );
        matched += 1;
      } else {
        exceptions += 1;
      }
    }
    return { matched, exceptions };
  }
}
