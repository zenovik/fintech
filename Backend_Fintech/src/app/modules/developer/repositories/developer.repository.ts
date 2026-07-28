import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';

export class DeveloperRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async getDashboardStats() {
    const orgId = getOrganizationId();
    const params: unknown[] = [];
    let orgClause = '';
    if (orgId) { orgClause = ' WHERE organization_id = ?'; params.push(orgId); }
    const [profiles] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM developer_profiles${orgClause}`, params,
    );
    const [apps] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active FROM oauth_applications${orgClause}`, params,
    );
    const usageParams = [...params];
    const [usage] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS requests_24h FROM api_usage_logs
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)${orgId ? ' AND organization_id = ?' : ''}`, usageParams,
    );
    const [keys] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM organization_api_keys WHERE status = 'active'${orgId ? ' AND organization_id = ?' : ''}`, params,
    );
    return { profiles: profiles[0], oauthApps: apps[0], usage24h: usage[0], apiKeys: keys[0] };
  }

  async listProfiles(query: { page: number; pageSize: number }) {
    const conditions = ['1=1'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('dp.organization_id = ?'); params.push(orgId); }
    const where = conditions.join(' AND ');
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM developer_profiles dp WHERE ${where}`, params);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT dp.*, u.email AS user_email FROM developer_profiles dp
       JOIN users u ON u.id = dp.user_id WHERE ${where} ORDER BY dp.created_at DESC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async findProfile(id: number): Promise<RowDataPacket | null> {
    const orgId = getOrganizationId();
    const params: unknown[] = [id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND dp.organization_id = ?'; params.push(orgId); }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT dp.*, u.email AS user_email FROM developer_profiles dp
       JOIN users u ON u.id = dp.user_id WHERE dp.id = ?${orgClause}`, params,
    );
    return rows[0] ?? null;
  }

  async createProfile(data: Record<string, unknown>, orgId: number): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO developer_profiles (uuid, user_id, organization_id, company_name, website, sandbox_enabled)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [randomUUID(), data.userId, orgId, data.companyName ?? null, data.website ?? null, data.sandboxEnabled ?? 1],
    );
    return result.insertId;
  }

  async updateProfile(id: number, data: Record<string, unknown>): Promise<void> {
    const orgId = getOrganizationId();
    const params: unknown[] = [data.companyName ?? null, data.website ?? null, data.sandboxEnabled ?? 1, id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND organization_id = ?'; params.push(orgId); }
    await this.pool.query(
      `UPDATE developer_profiles SET company_name = ?, website = ?, sandbox_enabled = ? WHERE id = ?${orgClause}`, params,
    );
  }

  async deleteProfile(id: number): Promise<void> {
    const orgId = getOrganizationId();
    const params: unknown[] = [id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND organization_id = ?'; params.push(orgId); }
    await this.pool.query(`DELETE FROM developer_profiles WHERE id = ?${orgClause}`, params);
  }

  async listOAuthApps(query: { page: number; pageSize: number; status?: string }) {
    const conditions = ['1=1'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('oa.organization_id = ?'); params.push(orgId); }
    if (query.status) { conditions.push('oa.status = ?'); params.push(query.status); }
    const where = conditions.join(' AND ');
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM oauth_applications oa WHERE ${where}`, params);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT oa.id, oa.uuid, oa.organization_id, oa.name, oa.client_id, oa.redirect_uris, oa.scopes,
              oa.environment, oa.status, oa.created_by, oa.created_at
       FROM oauth_applications oa WHERE ${where} ORDER BY oa.created_at DESC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async findOAuthApp(id: number): Promise<RowDataPacket | null> {
    const orgId = getOrganizationId();
    const params: unknown[] = [id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND organization_id = ?'; params.push(orgId); }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id, uuid, organization_id, name, client_id, redirect_uris, scopes, environment, status, created_by, created_at
       FROM oauth_applications WHERE id = ?${orgClause}`, params,
    );
    return rows[0] ?? null;
  }

  async createOAuthApp(data: Record<string, unknown>, orgId: number, actorId?: number): Promise<{ id: number; clientId: string; clientSecret: string }> {
    const clientId = `cli_${randomBytes(16).toString('hex')}`;
    const clientSecret = randomBytes(32).toString('hex');
    const secretHash = createHash('sha256').update(clientSecret).digest('hex');
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO oauth_applications (uuid, organization_id, name, client_id, client_secret_hash, redirect_uris, scopes, environment, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), orgId, data.name, clientId, secretHash,
        JSON.stringify(data.redirectUris ?? []), JSON.stringify(data.scopes ?? []),
        data.environment ?? 'sandbox', actorId ?? null],
    );
    return { id: result.insertId, clientId, clientSecret };
  }

  async updateOAuthApp(id: number, data: Record<string, unknown>): Promise<void> {
    const orgId = getOrganizationId();
    const params: unknown[] = [data.name, JSON.stringify(data.redirectUris ?? []), JSON.stringify(data.scopes ?? []), data.environment ?? 'sandbox', id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND organization_id = ?'; params.push(orgId); }
    await this.pool.query(
      `UPDATE oauth_applications SET name = ?, redirect_uris = ?, scopes = ?, environment = ? WHERE id = ?${orgClause}`, params,
    );
  }

  async revokeOAuthApp(id: number): Promise<void> {
    const orgId = getOrganizationId();
    const params: unknown[] = [id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND organization_id = ?'; params.push(orgId); }
    await this.pool.query(`UPDATE oauth_applications SET status = 'revoked' WHERE id = ?${orgClause}`, params);
  }

  async listApiUsageLogs(query: { page: number; pageSize: number; method?: string; statusCode?: number }) {
    const conditions = ['1=1'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('aul.organization_id = ?'); params.push(orgId); }
    if (query.method) { conditions.push('aul.method = ?'); params.push(query.method); }
    if (query.statusCode) { conditions.push('aul.status_code = ?'); params.push(query.statusCode); }
    const where = conditions.join(' AND ');
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM api_usage_logs aul WHERE ${where}`, params);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT aul.* FROM api_usage_logs aul WHERE ${where} ORDER BY aul.created_at DESC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async listApiKeys() {
    const orgId = getOrganizationId();
    if (!orgId) return [];
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id, uuid, name, key_prefix, environment, status, rate_limit_per_minute, last_used_at, created_at
       FROM organization_api_keys WHERE organization_id = ? ORDER BY created_at DESC`, [orgId],
    );
    return rows;
  }
}
