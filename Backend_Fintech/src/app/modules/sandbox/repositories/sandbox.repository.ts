import { randomBytes, randomUUID } from 'node:crypto';
import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';

export class SandboxRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async getDashboardStats() {
    const orgId = getOrganizationId();
    const params: unknown[] = [];
    let orgClause = '';
    if (orgId) { orgClause = ' WHERE organization_id = ?'; params.push(orgId); }
    const [accounts] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active FROM sandbox_accounts${orgClause}`, params,
    );
    const simParams = [...params];
    const [sims] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN is_enabled=1 THEN 1 ELSE 0 END) AS enabled FROM sandbox_simulations${orgClause}`, simParams,
    );
    const [cards] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM sandbox_test_cards WHERE is_active = 1`,
    );
    return { accounts: accounts[0], simulations: sims[0], testCards: cards[0] };
  }

  async listAccounts(query: { page: number; pageSize: number; status?: string }) {
    const conditions = ['1=1'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('sa.organization_id = ?'); params.push(orgId); }
    if (query.status) { conditions.push('sa.status = ?'); params.push(query.status); }
    const where = conditions.join(' AND ');
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM sandbox_accounts sa WHERE ${where}`, params);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT sa.* FROM sandbox_accounts sa WHERE ${where} ORDER BY sa.created_at DESC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async findAccount(id: number): Promise<RowDataPacket | null> {
    const orgId = getOrganizationId();
    const params: unknown[] = [id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND organization_id = ?'; params.push(orgId); }
    const [rows] = await this.pool.query<RowDataPacket[]>(`SELECT * FROM sandbox_accounts WHERE id = ?${orgClause}`, params);
    return rows[0] ?? null;
  }

  async createAccount(data: Record<string, unknown>, orgId: number, actorId?: number): Promise<number> {
    const prefix = `sb_${randomBytes(8).toString('hex')}`;
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO sandbox_accounts (uuid, organization_id, merchant_id, account_name, api_key_prefix, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [randomUUID(), orgId, data.merchantId ?? null, data.accountName, prefix, actorId ?? null],
    );
    return result.insertId;
  }

  async updateAccount(id: number, data: Record<string, unknown>): Promise<void> {
    const orgId = getOrganizationId();
    const params: unknown[] = [data.accountName, data.status ?? 'active', id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND organization_id = ?'; params.push(orgId); }
    await this.pool.query(`UPDATE sandbox_accounts SET account_name = ?, status = ? WHERE id = ?${orgClause}`, params);
  }

  async deleteAccount(id: number): Promise<void> {
    const orgId = getOrganizationId();
    const params: unknown[] = [id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND organization_id = ?'; params.push(orgId); }
    await this.pool.query(`UPDATE sandbox_accounts SET status = 'archived' WHERE id = ?${orgClause}`, params);
  }

  async listTestCards() {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id, uuid, card_number, brand, scenario, description, is_active FROM sandbox_test_cards WHERE is_active = 1 ORDER BY brand`,
    );
    return rows;
  }

  async listSimulations(query: { page: number; pageSize: number }) {
    const conditions = ['1=1'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('ss.organization_id = ?'); params.push(orgId); }
    const where = conditions.join(' AND ');
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM sandbox_simulations ss WHERE ${where}`, params);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT ss.* FROM sandbox_simulations ss WHERE ${where} ORDER BY ss.created_at DESC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async findSimulation(id: number): Promise<RowDataPacket | null> {
    const orgId = getOrganizationId();
    const params: unknown[] = [id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND organization_id = ?'; params.push(orgId); }
    const [rows] = await this.pool.query<RowDataPacket[]>(`SELECT * FROM sandbox_simulations WHERE id = ?${orgClause}`, params);
    return rows[0] ?? null;
  }

  async createSimulation(data: Record<string, unknown>, orgId: number): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO sandbox_simulations (uuid, organization_id, simulation_type, config_json, is_enabled)
       VALUES (?, ?, ?, ?, ?)`,
      [randomUUID(), orgId, data.simulationType, JSON.stringify(data.configJson ?? {}), data.isEnabled ?? 0],
    );
    return result.insertId;
  }

  async updateSimulation(id: number, data: Record<string, unknown>): Promise<void> {
    const orgId = getOrganizationId();
    const params: unknown[] = [data.simulationType, JSON.stringify(data.configJson ?? {}), data.isEnabled ?? 0, id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND organization_id = ?'; params.push(orgId); }
    await this.pool.query(
      `UPDATE sandbox_simulations SET simulation_type = ?, config_json = ?, is_enabled = ? WHERE id = ?${orgClause}`, params,
    );
  }

  async deleteSimulation(id: number): Promise<void> {
    const orgId = getOrganizationId();
    const params: unknown[] = [id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND organization_id = ?'; params.push(orgId); }
    await this.pool.query(`DELETE FROM sandbox_simulations WHERE id = ?${orgClause}`, params);
  }
}
