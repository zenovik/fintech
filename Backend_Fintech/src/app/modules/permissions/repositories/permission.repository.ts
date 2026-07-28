import { Pool, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';

export interface PermissionRow extends RowDataPacket {
  id: number;
  uuid: string;
  code: string;
  name: string;
  module: string;
  description: string | null;
}

export class PermissionRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async findAll(): Promise<PermissionRow[]> {
    const [rows] = await this.pool.query<PermissionRow[]>(
      `SELECT id, uuid, code, name, module, description FROM permissions ORDER BY module, code`,
    );
    return rows;
  }

  async findByModule(): Promise<Record<string, PermissionRow[]>> {
    const permissions = await this.findAll();
    return permissions.reduce<Record<string, PermissionRow[]>>((acc, p) => {
      if (!acc[p.module]) acc[p.module] = [];
      acc[p.module].push(p);
      return acc;
    }, {});
  }
}
