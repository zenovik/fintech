import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

import { randomUUID } from 'node:crypto';

import { getPool } from '../../../database';

import { getOrganizationId } from '../../../shared/context/org-context';



export class ReportCenterRepository {

  constructor(private readonly pool: Pool = getPool()) {}



  private orgMerchantJoin(orgId: number | undefined, alias: string): { clause: string; params: unknown[] } {

    if (!orgId) return { clause: '', params: [] };

    return { clause: ` JOIN merchants m ON m.id = ${alias}.merchant_id AND m.organization_id = ?`, params: [orgId] };

  }



  async getCatalog(): Promise<RowDataPacket[]> {

    const [rows] = await this.pool.query<RowDataPacket[]>(

      `SELECT * FROM report_center_catalog WHERE is_active = 1 ORDER BY display_order`,

    );

    return rows;

  }



  async getSavedFilters(userId: number, reportType?: string): Promise<RowDataPacket[]> {

    const orgId = getOrganizationId();

    const params: unknown[] = [userId, orgId ?? null];

    let typeClause = '';

    if (reportType) { typeClause = ' AND report_type = ?'; params.push(reportType); }

    const [rows] = await this.pool.query<RowDataPacket[]>(

      `SELECT * FROM report_saved_filters WHERE user_id = ? AND organization_id = ?${typeClause} ORDER BY is_default DESC, filter_name`,

      params,

    );

    return rows;

  }



  async saveFilter(data: Record<string, unknown>, userId: number, orgId: number): Promise<number> {

    if (data.id) {

      await this.pool.query(

        `UPDATE report_saved_filters SET filter_name = ?, filters = ?, is_default = ? WHERE id = ? AND user_id = ?`,

        [data.filterName, JSON.stringify(data.filters), data.isDefault ? 1 : 0, data.id, userId],

      );

      return Number(data.id);

    }

    const [result] = await this.pool.query<ResultSetHeader>(

      `INSERT INTO report_saved_filters (uuid, user_id, organization_id, report_type, filter_name, filters, is_default)

       VALUES (?, ?, ?, ?, ?, ?, ?)`,

      [randomUUID(), userId, orgId, data.reportType, data.filterName, JSON.stringify(data.filters), data.isDefault ? 1 : 0],

    );

    return result.insertId;

  }



  async deleteFilter(id: number, userId: number): Promise<void> {

    await this.pool.query('DELETE FROM report_saved_filters WHERE id = ? AND user_id = ?', [id, userId]);

  }



  async runReportSummary(reportType: string): Promise<{ headers: string[]; rows: Record<string, unknown>[] }> {

    const orgId = getOrganizationId();



    switch (reportType) {

      case 'merchant_summary': {

        const params: unknown[] = [];

        let orgClause = '';

        if (orgId) { orgClause = ' AND organization_id = ?'; params.push(orgId); }

        const [rows] = await this.pool.query<RowDataPacket[]>(

          `SELECT status, COUNT(*) AS count FROM merchants WHERE deleted_at IS NULL${orgClause} GROUP BY status`, params,

        );

        return { headers: ['Status', 'Count'], rows: rows.map((r) => ({ Status: r.status, Count: r.count })) };

      }

      case 'transaction_summary': {

        const join = this.orgMerchantJoin(orgId, 't');

        const [rows] = await this.pool.query<RowDataPacket[]>(

          `SELECT DATE(t.processed_at) AS dt, COUNT(*) AS cnt, SUM(t.amount) AS volume

           FROM transactions t${join.clause}

           WHERE t.deleted_at IS NULL AND t.processed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)

           GROUP BY DATE(t.processed_at) ORDER BY dt DESC LIMIT 30`, join.params,

        );

        return { headers: ['Date', 'Count', 'Volume'], rows: rows.map((r) => ({ Date: r.dt, Count: r.cnt, Volume: r.volume })) };

      }

      case 'settlement_summary': {

        const join = this.orgMerchantJoin(orgId, 's');

        const [rows] = await this.pool.query<RowDataPacket[]>(

          `SELECT s.status, COUNT(*) AS cnt, SUM(s.amount) AS total

           FROM settlements s${join.clause} WHERE s.deleted_at IS NULL GROUP BY s.status`, join.params,

        );

        return { headers: ['Status', 'Count', 'Total'], rows: rows.map((r) => ({ Status: r.status, Count: r.cnt, Total: r.total })) };

      }

      case 'fraud_summary': {

        const params: unknown[] = [];

        let orgClause = '';

        if (orgId) { orgClause = ' AND m.organization_id = ?'; params.push(orgId); }

        const [rows] = await this.pool.query<RowDataPacket[]>(

          `SELECT fc.status, COUNT(*) AS cnt, AVG(fc.fraud_score) AS avg_score

           FROM fraud_cases fc JOIN merchants m ON m.id = fc.merchant_id

           WHERE 1=1${orgClause} GROUP BY fc.status`, params,

        );

        return { headers: ['Status', 'Count', 'AvgScore'], rows: rows.map((r) => ({ Status: r.status, Count: r.cnt, AvgScore: r.avg_score })) };

      }

      case 'device_summary': {

        const params: unknown[] = [];

        let orgClause = '';

        if (orgId) { orgClause = ' AND organization_id = ?'; params.push(orgId); }

        const [rows] = await this.pool.query<RowDataPacket[]>(

          `SELECT device_type, status, COUNT(*) AS cnt FROM payment_devices

           WHERE deleted_at IS NULL${orgClause} GROUP BY device_type, status`, params,

        );

        return { headers: ['Type', 'Status', 'Count'], rows: rows.map((r) => ({ Type: r.device_type, Status: r.status, Count: r.cnt })) };

      }

      default: {

        const [rows] = await this.pool.query<RowDataPacket[]>(

          `SELECT code, name FROM report_center_catalog WHERE code = ?`, [reportType],

        );

        return { headers: ['Report', 'Status'], rows: [{ Report: rows[0]?.name ?? reportType, Status: 'No data adapter — use analytics module' }] };

      }

    }

  }



  async recordExport(userId: number, reportType: string, format: string, fileId: string, rowCount: number): Promise<void> {

    await this.pool.query(

      `INSERT INTO report_exports (uuid, user_id, report_id, report_type, format, file_name, status, row_count, completed_at)

       VALUES (?, ?, NULL, ?, ?, ?, 'completed', ?, NOW())`,

      [randomUUID(), userId, reportType, format, fileId, rowCount],

    );

  }



  async getExportHistory(userId: number, limit = 50): Promise<RowDataPacket[]> {

    const [rows] = await this.pool.query<RowDataPacket[]>(

      `SELECT * FROM report_exports WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`, [userId, limit],

    );

    return rows;

  }

}

