import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getPool } from '../../database';

interface CodeConfigRow extends RowDataPacket {
  prefix: string;
  padding: number;
  next_value: number;
  legacy_random_enabled: number;
}

export class MerchantCodeGenerator {
  constructor(private readonly pool: Pool = getPool()) {}

  private legacyRandomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const prefix = chars[Math.floor(Math.random() * chars.length)]! +
      chars[Math.floor(Math.random() * chars.length)]!;
    const num = String(Math.floor(1000 + Math.random() * 9000));
    return `${prefix}-${num}`;
  }

  /** Deterministic MCH-00001 format (onboarding backward compat). */
  static fromApplicationId(applicationId: number, prefix = 'MCH', padding = 5): string {
    return `${prefix}-${String(applicationId).padStart(padding, '0')}`;
  }

  /** Detect legacy AB-1234 or MCH-00001 patterns. */
  static isLegacySequential(code: string, prefix = 'MCH'): boolean {
    return new RegExp(`^${prefix}-\\d+$`).test(code);
  }

  async generate(options?: { legacyRandom?: boolean; deterministicId?: number }): Promise<string> {
    if (options?.deterministicId != null) {
      const cfg = await this.getConfig();
      return MerchantCodeGenerator.fromApplicationId(options.deterministicId, cfg.prefix, cfg.padding);
    }

    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.query<CodeConfigRow[]>(
        'SELECT prefix, padding, next_value, legacy_random_enabled FROM merchant_code_sequences WHERE id = 1 FOR UPDATE',
      );
      const cfg = rows[0];
      if (!cfg || cfg.legacy_random_enabled === 1 || options?.legacyRandom) {
        await conn.commit();
        return this.legacyRandomCode();
      }

      const code = `${cfg.prefix}-${String(cfg.next_value).padStart(cfg.padding, '0')}`;
      await conn.query<ResultSetHeader>(
        'UPDATE merchant_code_sequences SET next_value = next_value + 1 WHERE id = 1',
      );
      await conn.commit();
      return code;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  private async getConfig(): Promise<CodeConfigRow> {
    const [rows] = await this.pool.query<CodeConfigRow[]>(
      'SELECT prefix, padding, next_value, legacy_random_enabled FROM merchant_code_sequences WHERE id = 1',
    );
    return rows[0] ?? { prefix: 'MCH', padding: 5, next_value: 1, legacy_random_enabled: 0 } as CodeConfigRow;
  }
}

export const merchantCodeGenerator = new MerchantCodeGenerator();
