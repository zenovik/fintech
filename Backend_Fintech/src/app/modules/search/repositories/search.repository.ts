import { Pool, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';

export interface SearchResult {
  entityType: string;
  id: number;
  label: string;
  sublabel: string | null;
  route: string;
  score: number;
}

export class SearchRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    const q = query.trim();
    if (q.length < 2) return [];
    const like = `%${q}%`;
    const orgId = getOrganizationId();
    const results: SearchResult[] = [];

    const merchantParams: unknown[] = [like, like, like];
    let merchantOrg = '';
    if (orgId) { merchantOrg = ' AND organization_id = ?'; merchantParams.push(orgId); }
    const [merchants] = await this.pool.query<RowDataPacket[]>(
      `SELECT id, merchant_code, display_name FROM merchants
       WHERE deleted_at IS NULL AND (display_name LIKE ? OR merchant_code LIKE ? OR legal_name LIKE ?)${merchantOrg}
       LIMIT ?`, [...merchantParams, limit],
    );
    for (const m of merchants) {
      results.push({ entityType: 'merchant', id: m.id, label: m.display_name, sublabel: m.merchant_code, route: `/merchants/${m.id}`, score: 100 });
    }

    const outletParams: unknown[] = [like, like, like];
    let outletOrg = '';
    if (orgId) { outletOrg = ' AND o.organization_id = ?'; outletParams.push(orgId); }
    const [outlets] = await this.pool.query<RowDataPacket[]>(
      `SELECT o.id, o.outlet_code, o.outlet_name FROM merchant_outlets o
       WHERE o.deleted_at IS NULL AND (o.outlet_name LIKE ? OR o.outlet_code LIKE ? OR o.city LIKE ?)${outletOrg} LIMIT ?`,
      [...outletParams, limit],
    );
    for (const o of outlets) {
      results.push({ entityType: 'outlet', id: o.id, label: o.outlet_name, sublabel: o.outlet_code, route: `/outlets/${o.id}`, score: 90 });
    }

    const [users] = await this.pool.query<RowDataPacket[]>(
      `SELECT id, email, CONCAT(first_name,' ',last_name) AS name FROM users
       WHERE deleted_at IS NULL AND (email LIKE ? OR first_name LIKE ? OR last_name LIKE ?) LIMIT ?`,
      [like, like, like, limit],
    );
    for (const u of users) {
      results.push({ entityType: 'user', id: u.id, label: u.name, sublabel: u.email, route: `/users/${u.id}`, score: 85 });
    }

    const deviceParams: unknown[] = [like, like, like];
    let deviceOrg = '';
    if (orgId) { deviceOrg = ' AND organization_id = ?'; deviceParams.push(orgId); }
    const [devices] = await this.pool.query<RowDataPacket[]>(
      `SELECT id, device_ref, serial_number, device_type FROM payment_devices
       WHERE deleted_at IS NULL AND (device_ref LIKE ? OR serial_number LIKE ? OR device_id LIKE ?)${deviceOrg} LIMIT ?`,
      [...deviceParams, limit],
    );
    for (const d of devices) {
      results.push({ entityType: 'device', id: d.id, label: d.device_ref, sublabel: d.serial_number, route: `/devices`, score: 80 });
    }

    const [settlements] = await this.pool.query<RowDataPacket[]>(
      `SELECT s.id, s.settlement_ref, m.display_name FROM settlements s
       JOIN merchants m ON m.id = s.merchant_id
       WHERE s.deleted_at IS NULL AND s.settlement_ref LIKE ? LIMIT ?`, [like, limit],
    );
    for (const s of settlements) {
      results.push({ entityType: 'settlement', id: s.id, label: s.settlement_ref, sublabel: s.display_name, route: `/settlements/${s.id}`, score: 75 });
    }

    const [transactions] = await this.pool.query<RowDataPacket[]>(
      `SELECT t.id, t.transaction_ref, t.customer_name FROM transactions t
       WHERE t.deleted_at IS NULL AND (t.transaction_ref LIKE ? OR t.customer_email LIKE ? OR t.customer_name LIKE ?) LIMIT ?`,
      [like, like, like, limit],
    );
    for (const t of transactions) {
      results.push({ entityType: 'transaction', id: t.id, label: t.transaction_ref, sublabel: t.customer_name, route: `/transactions/${t.id}`, score: 70 });
    }

    const qrParams: unknown[] = [like, like];
    let qrOrg = '';
    if (orgId) { qrOrg = ' AND organization_id = ?'; qrParams.push(orgId); }
    const [qrs] = await this.pool.query<RowDataPacket[]>(
      `SELECT id, qr_ref, title FROM qr_codes WHERE deleted_at IS NULL AND (qr_ref LIKE ? OR title LIKE ?)${qrOrg} LIMIT ?`,
      [...qrParams, limit],
    );
    for (const q of qrs) {
      results.push({ entityType: 'qr', id: q.id, label: q.title, sublabel: q.qr_ref, route: `/qr-payments/${q.id}`, score: 65 });
    }

    const appParams: unknown[] = [like];
    let appOrg = '';
    if (orgId) { appOrg = ' AND organization_id = ?'; appParams.push(orgId); }
    const [apps] = await this.pool.query<RowDataPacket[]>(
      `SELECT id, application_ref, onboarding_status FROM merchant_onboarding_applications
       WHERE application_ref LIKE ?${appOrg} LIMIT ?`, [...appParams, limit],
    );
    for (const a of apps) {
      results.push({ entityType: 'application', id: a.id, label: a.application_ref, sublabel: a.onboarding_status, route: `/merchant-onboarding/${a.id}`, score: 60 });
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}
