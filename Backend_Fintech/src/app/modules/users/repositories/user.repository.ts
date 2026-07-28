import { randomUUID } from 'crypto';
import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { AssignUserRolesBodyDto, CreateUserBodyDto, UpdateUserBodyDto, UpdateUserStatusBodyDto, UserListQueryDto } from '../dto';

export interface UserRow extends RowDataPacket {
  id: number;
  uuid: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  status: string;
  mfa_enabled: number;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
  role_names: string | null;
  role_ids: string | null;
}

export class UserAdminRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async findAll(query: UserListQueryDto): Promise<{ items: UserRow[]; total: number }> {
    const conditions = ['u.deleted_at IS NULL'];
    const params: unknown[] = [];
    if (query.search) {
      conditions.push('(u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)');
      const term = `%${query.search}%`;
      params.push(term, term, term);
    }
    if (query.status) { conditions.push('u.status = ?'); params.push(query.status); }
    if (query.roleId) {
      conditions.push('EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = ?)');
      params.push(query.roleId);
    }
    const where = conditions.join(' AND ');
    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT u.id) AS total FROM users u WHERE ${where}`, params,
    );
    const total = Number(countRows[0]?.['total'] ?? 0);
    const offset = (query.page - 1) * query.pageSize;
    const [rows] = await this.pool.query<UserRow[]>(
      `SELECT u.id, u.uuid, u.email, u.first_name, u.last_name, u.phone_number, u.status,
              u.mfa_enabled, u.last_login_at, u.created_at, u.updated_at,
              GROUP_CONCAT(DISTINCT r.name ORDER BY r.name SEPARATOR ', ') AS role_names,
              GROUP_CONCAT(DISTINCT r.id ORDER BY r.id SEPARATOR ',') AS role_ids
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id AND r.deleted_at IS NULL
       WHERE ${where}
       GROUP BY u.id
       ORDER BY u.${query.sortBy} ${query.sortOrder}
       LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total };
  }

  async findById(id: number): Promise<UserRow | null> {
    const [rows] = await this.pool.query<UserRow[]>(
      `SELECT u.id, u.uuid, u.email, u.first_name, u.last_name, u.phone_number, u.status,
              u.mfa_enabled, u.last_login_at, u.created_at, u.updated_at,
              GROUP_CONCAT(DISTINCT r.name ORDER BY r.name SEPARATOR ', ') AS role_names,
              GROUP_CONCAT(DISTINCT r.id ORDER BY r.id SEPARATOR ',') AS role_ids
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id AND r.deleted_at IS NULL
       WHERE u.id = ? AND u.deleted_at IS NULL
       GROUP BY u.id`,
      [id],
    );
    return rows[0] ?? null;
  }

  async create(dto: CreateUserBodyDto, passwordHash: string, actorId?: number): Promise<number> {
    const uuid = randomUUID();
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO users (uuid, email, password_hash, first_name, last_name, phone_number, status, email_verified_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [uuid, dto.email.toLowerCase(), passwordHash, dto.firstName, dto.lastName, dto.phoneNumber ?? null, dto.status],
    );
    const userId = result.insertId;
    if (dto.roleIds?.length) await this.setRoles(userId, dto.roleIds, actorId);
    return userId;
  }

  async update(id: number, dto: UpdateUserBodyDto): Promise<void> {
    const fields: string[] = [];
    const params: unknown[] = [];
    if (dto.email !== undefined) { fields.push('email = ?'); params.push(dto.email.toLowerCase()); }
    if (dto.firstName !== undefined) { fields.push('first_name = ?'); params.push(dto.firstName); }
    if (dto.lastName !== undefined) { fields.push('last_name = ?'); params.push(dto.lastName); }
    if (dto.phoneNumber !== undefined) { fields.push('phone_number = ?'); params.push(dto.phoneNumber); }
    if (dto.status !== undefined) { fields.push('status = ?'); params.push(dto.status); }
    if (!fields.length) return;
    params.push(id);
    await this.pool.query(`UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`, params);
  }

  async updateStatus(id: number, dto: UpdateUserStatusBodyDto): Promise<void> {
    await this.pool.query(
      `UPDATE users SET status = ?, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      [dto.status, id],
    );
  }

  async softDelete(id: number): Promise<void> {
    await this.pool.query(
      `UPDATE users
       SET deleted_at = NOW(),
           status = 'inactive',
           email = IF(LOCATE('.deleted.', email) > 0, email, CONCAT(email, '.deleted.', id))
       WHERE id = ?`,
      [id],
    );
  }

  async releaseSoftDeletedEmail(email: string): Promise<void> {
    await this.pool.query(
      `UPDATE users
       SET email = CONCAT(email, '.deleted.', id)
       WHERE email = ? AND deleted_at IS NOT NULL AND LOCATE('.deleted.', email) = 0`,
      [email.toLowerCase()],
    );
  }

  async setRoles(userId: number, roleIds: number[], actorId?: number): Promise<void> {
    await this.pool.query('DELETE FROM user_roles WHERE user_id = ?', [userId]);
    if (!roleIds.length) return;
    const values = roleIds.map((roleId) => [userId, roleId, actorId ?? null]);
    await this.pool.query(
      'INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ?',
      [values],
    );
  }

  async getRoleIds(userId: number): Promise<number[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT role_id FROM user_roles WHERE user_id = ?', [userId],
    );
    return rows.map((r) => Number(r['role_id']));
  }

  async findActivityLogs(userId: number, limit = 20) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT uuid, action, resource_type, resource_id, ip_address, metadata, created_at
       FROM user_activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [userId, limit],
    );
    return rows;
  }

  async findLoginHistory(userId: number, limit = 20) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT email_attempted, ip_address, user_agent, success, failure_reason, created_at
       FROM login_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [userId, limit],
    );
    return rows;
  }

  async logActivity(userId: number, action: string, actorId: number | undefined, meta: Record<string, unknown> = {}): Promise<void> {
    await this.pool.query(
      `INSERT INTO user_activity_logs (uuid, user_id, actor_user_id, action, metadata) VALUES (?, ?, ?, ?, ?)`,
      [randomUUID(), userId, actorId ?? null, action, JSON.stringify(meta)],
    );
  }
}
