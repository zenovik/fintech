import { Pool, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';

export class PaymentPlatformStatsRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async getStats(): Promise<Record<string, number>> {
    const orgId = getOrganizationId();
    const orgFilter = orgId ? 'AND organization_id = ?' : '';
    const params = orgId ? [orgId] : [];

    const [devices] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total, SUM(status = 'active') AS active FROM payment_devices WHERE deleted_at IS NULL ${orgFilter}`, params,
    );
    const [qr] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total, SUM(status = 'active') AS active FROM qr_codes WHERE deleted_at IS NULL ${orgFilter}`, params,
    );
    const [settlements] = await this.pool.query<RowDataPacket[]>(
      `SELECT SUM(status = 'pending') AS pending, SUM(hold_status = 'held') AS held FROM settlements WHERE deleted_at IS NULL`,
    );
    const [fraud] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS pending FROM fraud_cases WHERE status IN ('pending','under_review') ${orgFilter}`, params,
    );
    const [risk] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS active FROM risk_rules WHERE is_active = 1`,
    );
    const [revenue] = await this.pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(amount), 0) AS today FROM settlements WHERE DATE(created_at) = CURDATE() AND status = 'processed'`,
    );

    return {
      devicesTotal: Number(devices[0]?.total ?? 0),
      devicesActive: Number(devices[0]?.active ?? 0),
      qrTotal: Number(qr[0]?.total ?? 0),
      qrActive: Number(qr[0]?.active ?? 0),
      settlementsPending: Number(settlements[0]?.pending ?? 0),
      settlementsHeld: Number(settlements[0]?.held ?? 0),
      fraudPending: Number(fraud[0]?.pending ?? 0),
      riskRulesActive: Number(risk[0]?.active ?? 0),
      revenueToday: Number(revenue[0]?.today ?? 0),
    };
  }
}
