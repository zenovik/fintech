import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { randomUUID } from 'node:crypto';
import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';

export class FraudRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async findAll(query: { page: number; pageSize: number; status?: string; search?: string }): Promise<{ items: RowDataPacket[]; total: number }> {
    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('fc.organization_id = ?'); params.push(orgId); }
    if (query.status) { conditions.push('fc.status = ?'); params.push(query.status); }
    if (query.search) {
      conditions.push('(fc.case_ref LIKE ? OR fc.title LIKE ?)');
      const s = `%${query.search}%`;
      params.push(s, s);
    }
    const where = `WHERE ${conditions.join(' AND ')}`;
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM fraud_cases fc ${where}`, params);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT fc.*, m.display_name AS merchant_name FROM fraud_cases fc
       LEFT JOIN merchants m ON m.id = fc.merchant_id ${where}
       ORDER BY fc.fraud_score DESC, fc.created_at DESC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async findById(id: number): Promise<RowDataPacket | null> {
    const orgId = getOrganizationId();
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT fc.*, m.display_name AS merchant_name FROM fraud_cases fc
       LEFT JOIN merchants m ON m.id = fc.merchant_id WHERE fc.id = ? AND (? IS NULL OR fc.organization_id = ?)`,
      [id, orgId ?? null, orgId ?? null],
    );
    return rows[0] ?? null;
  }

  async getStatistics(): Promise<RowDataPacket> {
    const orgId = getOrganizationId();
    const params: unknown[] = [];
    let where = '';
    if (orgId) { where = 'WHERE organization_id = ?'; params.push(orgId); }
    const [rows] = await this.pool.query<RowDataPacket[]>(`
      SELECT COUNT(*) AS total,
        SUM(status = 'pending') AS pending_count,
        SUM(status = 'under_review') AS review_count,
        SUM(status = 'approved') AS approved_count,
        SUM(status = 'rejected') AS rejected_count,
        AVG(fraud_score) AS avg_score
      FROM fraud_cases ${where}`, params);
    return rows[0] ?? {};
  }

  async updateDecision(id: number, status: string, reviewerId?: number, remarks?: string): Promise<void> {
    await this.pool.query(
      `UPDATE fraud_cases SET status = ?, reviewer_id = ?, reviewed_at = NOW(), reviewer_remarks = ? WHERE id = ?`,
      [status, reviewerId ?? null, remarks ?? null, id],
    );
  }
}
