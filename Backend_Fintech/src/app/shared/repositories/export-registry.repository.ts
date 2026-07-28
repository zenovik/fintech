import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../database';

export interface ExportRegistryRow extends RowDataPacket {
  id: number;
  file_id: string;
  user_id: number;
  organization_id: number | null;
  permission_code: string;
}

export class ExportRegistryRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async register(input: {
    fileId: string;
    userId: number;
    organizationId?: number;
    permissionCode: string;
  }): Promise<void> {
    await this.pool.query<ResultSetHeader>(
      `INSERT INTO export_file_registry (file_id, user_id, organization_id, permission_code)
       VALUES (?, ?, ?, ?)`,
      [input.fileId, input.userId, input.organizationId ?? null, input.permissionCode],
    );
  }

  async findByFileId(fileId: string): Promise<ExportRegistryRow | null> {
    const [rows] = await this.pool.query<ExportRegistryRow[]>(
      `SELECT id, file_id, user_id, organization_id, permission_code
       FROM export_file_registry WHERE file_id = ? LIMIT 1`,
      [fileId],
    );
    return rows[0] ?? null;
  }
}
