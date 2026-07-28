import { Pool, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../database';

export interface RoleRow extends RowDataPacket {
  id: number;
  uuid: string;
  code: string;
  name: string;
  description: string | null;
}

export class PermissionRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async getPermissionCodesForUser(userId: number): Promise<string[]> {
    const [roleRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT r.code FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = ? AND r.deleted_at IS NULL`,
      [userId],
    );
    if (roleRows.some((r) => r['code'] === 'super_admin')) {
      return ['*'];
    }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT DISTINCT p.code FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       JOIN user_roles ur ON ur.role_id = rp.role_id
       WHERE ur.user_id = ?`,
      [userId],
    );
    return rows.map((r) => r['code'] as string);
  }

  async getRolesForUser(userId: number): Promise<RoleRow[]> {
    const [rows] = await this.pool.query<RoleRow[]>(
      `SELECT r.id, r.uuid, r.code, r.name, r.description
       FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = ? AND r.deleted_at IS NULL
       ORDER BY r.name`,
      [userId],
    );
    return rows;
  }

  async userHasPermission(userId: number, permission: string): Promise<boolean> {
    const codes = await this.getPermissionCodesForUser(userId);
    return codes.includes('*') || codes.includes(permission);
  }

  async getPermissionCodesForMerchantRole(roleCode: string): Promise<string[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT DISTINCT p.code FROM permissions p
       JOIN merchant_role_permissions mrp ON mrp.permission_id = p.id
       JOIN merchant_roles mr ON mr.id = mrp.merchant_role_id
       WHERE mr.code = ? AND mr.is_active = 1`,
      [roleCode],
    );
    return rows.map((r) => r['code'] as string);
  }
}
