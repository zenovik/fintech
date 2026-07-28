import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { randomUUID } from 'node:crypto';
import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';

export class PlatformConfigRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async findAll(group?: string): Promise<RowDataPacket[]> {
    const orgId = getOrganizationId();
    const params: unknown[] = [];
    let where = 'WHERE (organization_id IS NULL';
    if (orgId) { where += ' OR organization_id = ?'; params.push(orgId); }
    where += ')';
    if (group) { where += ' AND config_group = ?'; params.push(group); }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT * FROM platform_config ${where} ORDER BY config_group, config_key`, params,
    );
    return rows;
  }

  async upsert(key: string, group: string, value: unknown, actorId?: number, orgId?: number | null): Promise<void> {
    const [existing] = await this.pool.query<RowDataPacket[]>(
      'SELECT id FROM platform_config WHERE config_key = ? AND (organization_id <=> ?)', [key, orgId ?? null],
    );
    if (existing[0]) {
      await this.pool.query(
        'UPDATE platform_config SET config_value = ?, updated_by = ? WHERE id = ?',
        [JSON.stringify(value), actorId ?? null, existing[0].id],
      );
    } else {
      await this.pool.query(
        `INSERT INTO platform_config (uuid, config_key, config_group, config_value, organization_id, updated_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [randomUUID(), key, group, JSON.stringify(value), orgId ?? null, actorId ?? null],
      );
    }
  }
}
