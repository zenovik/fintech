import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { randomUUID } from 'node:crypto';
import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';
import { appendMerchantFilter } from '../../../shared/context/merchant-context';

export interface DeviceRow extends RowDataPacket {
  id: number;
  uuid: string;
  device_ref: string;
  serial_number: string;
  device_id: string;
  device_type: string;
  model: string | null;
  manufacturer: string | null;
  firmware_version: string | null;
  status: string;
  merchant_id: number | null;
  outlet_id: number | null;
  organization_id: number;
  assigned_user_id: number | null;
  activated_at: Date | null;
  last_sync_at: Date | null;
  health_status: string;
  battery_pct: number | null;
  sim_number: string | null;
  network_type: string | null;
  latitude: number | null;
  longitude: number | null;
  location_label: string | null;
  merchant_name?: string;
  outlet_name?: string;
  assigned_user_name?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DeviceListQuery {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  deviceType?: string;
  merchantId?: number;
  outletId?: number;
  healthStatus?: string;
}

export class DeviceRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  private baseSelect = `
    SELECT d.*, m.display_name AS merchant_name, o.outlet_name,
           CONCAT(u.first_name, ' ', u.last_name) AS assigned_user_name
    FROM payment_devices d
    LEFT JOIN merchants m ON m.id = d.merchant_id
    LEFT JOIN merchant_outlets o ON o.id = d.outlet_id
    LEFT JOIN users u ON u.id = d.assigned_user_id
  `;

  async findAll(query: DeviceListQuery): Promise<{ items: DeviceRow[]; total: number }> {
    const conditions = ['d.deleted_at IS NULL'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('d.organization_id = ?'); params.push(orgId); }
    if (query.merchantId) { conditions.push('d.merchant_id = ?'); params.push(query.merchantId); }
    else { appendMerchantFilter(conditions, params, 'd.merchant_id'); }
    if (query.outletId) { conditions.push('d.outlet_id = ?'); params.push(query.outletId); }
    if (query.status) { conditions.push('d.status = ?'); params.push(query.status); }
    if (query.deviceType) { conditions.push('d.device_type = ?'); params.push(query.deviceType); }
    if (query.healthStatus) { conditions.push('d.health_status = ?'); params.push(query.healthStatus); }
    if (query.search) {
      conditions.push('(d.device_ref LIKE ? OR d.serial_number LIKE ? OR d.device_id LIKE ?)');
      const s = `%${query.search}%`;
      params.push(s, s, s);
    }
    const where = `WHERE ${conditions.join(' AND ')}`;
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM payment_devices d ${where}`, params);
    const [rows] = await this.pool.query<DeviceRow[]>(
      `${this.baseSelect} ${where} ORDER BY d.updated_at DESC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async findById(id: number): Promise<DeviceRow | null> {
    const orgId = getOrganizationId();
    const conditions = ['d.id = ?', 'd.deleted_at IS NULL'];
    const params: unknown[] = [id];
    if (orgId) { conditions.push('d.organization_id = ?'); params.push(orgId); }
    const [rows] = await this.pool.query<DeviceRow[]>(`${this.baseSelect} WHERE ${conditions.join(' AND ')}`, params);
    return rows[0] ?? null;
  }

  async getStatistics(): Promise<RowDataPacket> {
    const orgId = getOrganizationId();
    const params: unknown[] = [];
    let where = 'WHERE deleted_at IS NULL';
    if (orgId) { where += ' AND organization_id = ?'; params.push(orgId); }
    const [rows] = await this.pool.query<RowDataPacket[]>(`
      SELECT COUNT(*) AS total,
        SUM(status = 'active') AS active_count,
        SUM(status = 'provisioned') AS provisioned_count,
        SUM(health_status IN ('warning','critical','offline')) AS unhealthy_count,
        SUM(device_type = 'pos') AS pos_count,
        SUM(device_type = 'soundbox') AS soundbox_count
      FROM payment_devices ${where}`, params);
    return rows[0] ?? {};
  }

  async create(data: Record<string, unknown>, orgId: number, actorId?: number): Promise<number> {
    const ref = `DEV-${Date.now().toString(36).toUpperCase()}`;
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO payment_devices (uuid, device_ref, serial_number, device_id, device_type, model, manufacturer,
        firmware_version, status, organization_id, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'provisioned', ?, ?, ?)`,
      [randomUUID(), ref, data.serialNumber, data.deviceId, data.deviceType, data.model ?? null,
        data.manufacturer ?? null, data.firmwareVersion ?? null, orgId, actorId ?? null, actorId ?? null],
    );
    return result.insertId;
  }

  async updateStatus(id: number, status: string, extra: Record<string, unknown>, actorId?: number): Promise<void> {
    const sets = ['status = ?', 'updated_by = ?'];
    const params: unknown[] = [status, actorId ?? null];
    if (extra.merchantId !== undefined) { sets.push('merchant_id = ?'); params.push(extra.merchantId); }
    if (extra.outletId !== undefined) { sets.push('outlet_id = ?'); params.push(extra.outletId); }
    if (extra.assignedUserId !== undefined) { sets.push('assigned_user_id = ?'); params.push(extra.assignedUserId); }
    if (extra.activatedAt) { sets.push('activated_at = ?'); params.push(extra.activatedAt); }
    if (extra.replacedById) { sets.push('replaced_by_id = ?'); params.push(extra.replacedById); }
    params.push(id);
    await this.pool.query(`UPDATE payment_devices SET ${sets.join(', ')} WHERE id = ?`, params);
  }

  async syncDevice(id: number, data: Record<string, unknown>): Promise<void> {
    await this.pool.query(
      `UPDATE payment_devices SET last_sync_at = NOW(), battery_pct = ?, network_type = ?,
        firmware_version = COALESCE(?, firmware_version), health_status = ?, updated_at = NOW()
       WHERE id = ?`,
      [data.batteryPct ?? null, data.networkType ?? null, data.firmwareVersion ?? null, data.healthStatus ?? 'healthy', id],
    );
    await this.pool.query(
      `INSERT INTO device_sync_logs (device_id, sync_status, battery_pct, network_type, firmware_version, health_status)
       VALUES (?, 'success', ?, ?, ?, ?)`,
      [id, data.batteryPct ?? null, data.networkType ?? null, data.firmwareVersion ?? null, data.healthStatus ?? 'healthy'],
    );
  }

  async listInventory(query: DeviceListQuery): Promise<{ items: RowDataPacket[]; total: number }> {
    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('ti.organization_id = ?'); params.push(orgId); }
    if (query.status) { conditions.push('ti.status = ?'); params.push(query.status); }
    if (query.search) {
      conditions.push('(ti.inventory_ref LIKE ? OR ti.serial_number LIKE ?)');
      const s = `%${query.search}%`;
      params.push(s, s);
    }
    const where = `WHERE ${conditions.join(' AND ')}`;
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM terminal_inventory ti ${where}`, params);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT ti.* FROM terminal_inventory ti ${where} ORDER BY ti.updated_at DESC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }
}
