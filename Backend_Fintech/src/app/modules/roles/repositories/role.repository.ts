import { randomUUID } from 'crypto';
import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { AssignRolePermissionsBodyDto, CreateRoleBodyDto, RoleListQueryDto, UpdateRoleBodyDto } from '../dto';

export interface RoleRow extends RowDataPacket {
  id: number;
  uuid: string;
  code: string;
  name: string;
  description: string | null;
  is_system: number;
  created_at: Date;
  updated_at: Date;
  user_count: number;
  permission_count: number;
}

export class RoleRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async findAll(query: RoleListQueryDto): Promise<RoleRow[]> {
    const conditions = ['r.deleted_at IS NULL'];
    const params: unknown[] = [];
    if (query.search) {
      conditions.push('(r.name LIKE ? OR r.code LIKE ?)');
      const term = `%${query.search}%`;
      params.push(term, term);
    }
    const [rows] = await this.pool.query<RoleRow[]>(
      `SELECT r.id, r.uuid, r.code, r.name, r.description, r.is_system, r.created_at, r.updated_at,
              COUNT(DISTINCT ur.user_id) AS user_count,
              COUNT(DISTINCT rp.permission_id) AS permission_count
       FROM roles r
       LEFT JOIN user_roles ur ON ur.role_id = r.id
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       WHERE ${conditions.join(' AND ')}
       GROUP BY r.id
       ORDER BY r.name
       LIMIT ? OFFSET ?`,
      [...params, query.pageSize, (query.page - 1) * query.pageSize],
    );
    return rows;
  }

  async findById(id: number): Promise<RoleRow | null> {
    const [rows] = await this.pool.query<RoleRow[]>(
      `SELECT r.id, r.uuid, r.code, r.name, r.description, r.is_system, r.created_at, r.updated_at,
              COUNT(DISTINCT ur.user_id) AS user_count,
              COUNT(DISTINCT rp.permission_id) AS permission_count
       FROM roles r
       LEFT JOIN user_roles ur ON ur.role_id = r.id
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       WHERE r.id = ? AND r.deleted_at IS NULL
       GROUP BY r.id`,
      [id],
    );
    return rows[0] ?? null;
  }

  async findPermissionIds(roleId: number): Promise<number[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT permission_id FROM role_permissions WHERE role_id = ?', [roleId],
    );
    return rows.map((r) => Number(r['permission_id']));
  }

  async create(dto: CreateRoleBodyDto, actorId?: number): Promise<number> {
    const uuid = randomUUID();
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO roles (uuid, code, name, description, created_by) VALUES (?, ?, ?, ?, ?)`,
      [uuid, dto.code, dto.name, dto.description ?? null, actorId ?? null],
    );
    const roleId = result.insertId;
    if (dto.permissionIds?.length) await this.setPermissions(roleId, dto.permissionIds, actorId);
    return roleId;
  }

  async update(id: number, dto: UpdateRoleBodyDto, actorId?: number): Promise<void> {
    const fields: string[] = [];
    const params: unknown[] = [];
    if (dto.name !== undefined) { fields.push('name = ?'); params.push(dto.name); }
    if (dto.description !== undefined) { fields.push('description = ?'); params.push(dto.description); }
    if (!fields.length) return;
    fields.push('updated_by = ?'); params.push(actorId ?? null);
    params.push(id);
    await this.pool.query(`UPDATE roles SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`, params);
  }

  async softDelete(id: number): Promise<void> {
    await this.pool.query(
      `UPDATE roles
       SET deleted_at = NOW(),
           code = IF(LOCATE('_deleted_', code) > 0, code, CONCAT(code, '_deleted_', id))
       WHERE id = ? AND is_system = 0`,
      [id],
    );
  }

  async releaseSoftDeletedCode(code: string): Promise<void> {
    await this.pool.query(
      `UPDATE roles
       SET code = CONCAT(code, '_deleted_', id)
       WHERE code = ? AND deleted_at IS NOT NULL AND LOCATE('_deleted_', code) = 0`,
      [code],
    );
  }

  async setPermissions(roleId: number, permissionIds: number[], actorId?: number): Promise<void> {
    await this.pool.query('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
    if (!permissionIds.length) return;
    const values = permissionIds.map((pid) => [roleId, pid, actorId ?? null]);
    await this.pool.query('INSERT INTO role_permissions (role_id, permission_id, granted_by) VALUES ?', [values]);
  }

  async codeExists(code: string, excludeId?: number): Promise<boolean> {
    const params: unknown[] = [code];
    let sql = 'SELECT 1 FROM roles WHERE code = ? AND deleted_at IS NULL';
    if (excludeId) { sql += ' AND id != ?'; params.push(excludeId); }
    const [rows] = await this.pool.query<RowDataPacket[]>(sql, params);
    return rows.length > 0;
  }
}
