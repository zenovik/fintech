import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { randomUUID } from 'node:crypto';
import { getPool } from '../../../database';
import { getOrganizationId, appendMerchantOrgFilter } from '../../../shared/context/org-context';
import { getMerchantId, getAccessibleOutletIds, appendOutletFilter } from '../../../shared/context/merchant-context';
import { CreateOutletBodyDto, OutletListQueryDto, UpdateOutletBodyDto } from '../dto';

export interface OutletRow extends RowDataPacket {
  id: number;
  uuid: string;
  outlet_code: string;
  outlet_name: string;
  merchant_id: number;
  organization_id: number;
  merchant_name?: string;
  organization_name?: string;
  branch_type: string;
  store_number: string | null;
  gst_number: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  opening_date: string | null;
  timezone: string;
  currency: string;
  is_primary: number;
  latitude: string | null;
  longitude: string | null;
  working_hours: string | null;
  address_line1: string | null;
  address_line2: string | null;
  country: string;
  state: string | null;
  city: string | null;
  pincode: string | null;
  notes: string | null;
  outlet_manager_id: number | null;
  manager_name?: string | null;
  created_at: string;
  updated_at: string;
}

export class OutletRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  private baseSelect = `
    SELECT o.*, m.display_name AS merchant_name, org.display_name AS organization_name,
           CONCAT(u.first_name, ' ', u.last_name) AS manager_name
    FROM merchant_outlets o
    JOIN merchants m ON m.id = o.merchant_id
    JOIN organizations org ON org.id = o.organization_id
    LEFT JOIN users u ON u.id = o.outlet_manager_id
  `;

  async findAll(query: OutletListQueryDto): Promise<{ items: OutletRow[]; total: number }> {
    const conditions = ['o.deleted_at IS NULL'];
    const params: unknown[] = [];
    appendMerchantOrgFilter(conditions, params, 'm');

    const orgId = getOrganizationId();
    if (orgId) {
      conditions.push('o.organization_id = ?');
      params.push(orgId);
    }
    if (query.organizationId) {
      conditions.push('o.organization_id = ?');
      params.push(query.organizationId);
    }
    if (query.merchantId) {
      conditions.push('o.merchant_id = ?');
      params.push(query.merchantId);
    } else {
      appendMerchantFilter(conditions, params, 'o.merchant_id');
    }
    appendOutletFilter(conditions, params, 'o.id');

    if (query.status) {
      conditions.push('o.status = ?');
      params.push(query.status);
    }
    if (query.search) {
      conditions.push('(o.outlet_name LIKE ? OR o.outlet_code LIKE ? OR o.city LIKE ?)');
      const s = `%${query.search}%`;
      params.push(s, s, s);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (query.page - 1) * query.pageSize;

    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM merchant_outlets o JOIN merchants m ON m.id = o.merchant_id ${where}`,
      params,
    );
    const [rows] = await this.pool.query<OutletRow[]>(
      `${this.baseSelect} ${where} ORDER BY o.is_primary DESC, o.outlet_name ASC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async findById(id: number): Promise<OutletRow | null> {
    const conditions = ['o.id = ?', 'o.deleted_at IS NULL'];
    const params: unknown[] = [id];
    appendMerchantOrgFilter(conditions, params, 'm');
    const orgId = getOrganizationId();
    if (orgId) {
      conditions.push('o.organization_id = ?');
      params.push(orgId);
    }
    appendMerchantFilter(conditions, params, 'o.merchant_id');
    appendOutletFilter(conditions, params, 'o.id');

    const [rows] = await this.pool.query<OutletRow[]>(
      `${this.baseSelect} WHERE ${conditions.join(' AND ')}`,
      params,
    );
    return rows[0] ?? null;
  }

  async create(dto: CreateOutletBodyDto, userId?: number): Promise<number> {
    const orgId = getOrganizationId() ?? dto.organizationId;
    const merchantId = getMerchantId() ?? dto.merchantId;
    const uuid = randomUUID();
    const code = dto.outletCode ?? `OUT-${String(Date.now()).slice(-8)}`;

    if (dto.isPrimary) {
      await this.pool.query(
        'UPDATE merchant_outlets SET is_primary = 0 WHERE merchant_id = ? AND deleted_at IS NULL',
        [merchantId],
      );
    }

    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO merchant_outlets (
        uuid, outlet_code, outlet_name, merchant_id, organization_id, branch_type, store_number,
        gst_number, phone, email, status, opening_date, timezone, currency, is_primary,
        latitude, longitude, working_hours, address_line1, address_line2, country, state, city,
        pincode, notes, outlet_manager_id, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuid, code, dto.outletName, merchantId, orgId, dto.branchType ?? 'branch', dto.storeNumber ?? null,
        dto.gstNumber ?? null, dto.phone ?? null, dto.email ?? null, dto.status ?? 'active',
        dto.openingDate ?? null, dto.timezone ?? 'Asia/Kolkata', dto.currency ?? 'INR', dto.isPrimary ? 1 : 0,
        dto.latitude ?? null, dto.longitude ?? null, dto.workingHours ? JSON.stringify(dto.workingHours) : null,
        dto.addressLine1 ?? null, dto.addressLine2 ?? null, dto.country ?? 'India', dto.state ?? null,
        dto.city ?? null, dto.pincode ?? null, dto.notes ?? null, dto.outletManagerId ?? null,
        userId ?? null, userId ?? null,
      ],
    );
    return result.insertId;
  }

  async update(id: number, dto: UpdateOutletBodyDto, userId?: number): Promise<void> {
    if (dto.isPrimary) {
      const existing = await this.findById(id);
      if (existing) {
        await this.pool.query(
          'UPDATE merchant_outlets SET is_primary = 0 WHERE merchant_id = ? AND id != ? AND deleted_at IS NULL',
          [existing.merchant_id, id],
        );
      }
    }

    const fields: string[] = [];
    const params: unknown[] = [];
    const map: Record<string, unknown> = {
      outlet_name: dto.outletName,
      branch_type: dto.branchType,
      store_number: dto.storeNumber,
      gst_number: dto.gstNumber,
      phone: dto.phone,
      email: dto.email,
      status: dto.status,
      opening_date: dto.openingDate,
      timezone: dto.timezone,
      currency: dto.currency,
      is_primary: dto.isPrimary != null ? (dto.isPrimary ? 1 : 0) : undefined,
      latitude: dto.latitude,
      longitude: dto.longitude,
      working_hours: dto.workingHours ? JSON.stringify(dto.workingHours) : undefined,
      address_line1: dto.addressLine1,
      address_line2: dto.addressLine2,
      country: dto.country,
      state: dto.state,
      city: dto.city,
      pincode: dto.pincode,
      notes: dto.notes,
      outlet_manager_id: dto.outletManagerId,
    };

    for (const [col, val] of Object.entries(map)) {
      if (val !== undefined) {
        fields.push(`${col} = ?`);
        params.push(val);
      }
    }
    if (!fields.length) return;

    fields.push('updated_by = ?');
    params.push(userId ?? null, id);
    await this.pool.query(`UPDATE merchant_outlets SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`, params);
  }

  async updateStatus(id: number, status: 'active' | 'inactive', userId?: number): Promise<void> {
    await this.pool.query(
      'UPDATE merchant_outlets SET status = ?, updated_by = ? WHERE id = ? AND deleted_at IS NULL',
      [status, userId ?? null, id],
    );
  }

  async merchantBelongsToOrg(merchantId: number, orgId: number): Promise<boolean> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT id FROM merchants WHERE id = ? AND organization_id = ? AND deleted_at IS NULL',
      [merchantId, orgId],
    );
    return rows.length > 0;
  }
}

function appendMerchantFilter(conditions: string[], params: unknown[], column: string): void {
  const merchantId = getMerchantId();
  if (merchantId) {
    conditions.push(`${column} = ?`);
    params.push(merchantId);
  }
}
