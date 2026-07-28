import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getPool } from '../../database';

const APAC_REGION_ID = 3;
const DEFAULT_REGION_ID = 1;

export class RegionResolver {
  constructor(private readonly pool: Pool = getPool()) {}

  async resolveRegionId(state?: string | null, country?: string | null): Promise<number> {
    if (state?.trim()) {
      const normalized = state.trim();
      const [rows] = await this.pool.query<RowDataPacket[]>(
        `SELECT region_id FROM state_region_mapping
         WHERE state_name = ? OR state_code = ?
         LIMIT 1`,
        [normalized, normalized.toUpperCase()],
      );
      if (rows[0]) return Number(rows[0].region_id);
    }

    const c = (country ?? '').trim().toUpperCase();
    if (c === 'IN' || c === 'INDIA') return APAC_REGION_ID;
    if (['US', 'USA', 'UNITED STATES', 'CA', 'CANADA', 'MX', 'MEXICO'].includes(c)) return 1;
    if (['GB', 'UK', 'DE', 'FR', 'EU', 'EMEA'].some((x) => c.includes(x))) return 2;
    if (['SG', 'AU', 'JP', 'CN', 'APAC', 'ASIA'].some((x) => c.includes(x))) return APAC_REGION_ID;

    return DEFAULT_REGION_ID;
  }

  async resolveFromAddress(state?: string | null, country?: string | null): Promise<number> {
    return this.resolveRegionId(state, country);
  }
}

export const regionResolver = new RegionResolver();
