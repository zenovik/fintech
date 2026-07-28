import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { randomUUID } from 'crypto';
import { getPool } from '../../../database';

export class RiskReviewRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async findByApplication(applicationId: number): Promise<RowDataPacket | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT * FROM onboarding_risk_reviews WHERE application_id = ?',
      [applicationId],
    );
    return rows[0] ?? null;
  }

  async upsert(applicationId: number, data: Record<string, unknown>, reviewerId?: number): Promise<number> {
    const existing = await this.findByApplication(applicationId);
    if (existing) {
      const fields = Object.keys(data).map((k) => `${k} = ?`).join(', ');
      await this.pool.query(
        `UPDATE onboarding_risk_reviews SET ${fields}, reviewer_id = COALESCE(?, reviewer_id), updated_at = NOW() WHERE application_id = ?`,
        [...Object.values(data), reviewerId ?? null, applicationId],
      );
      return Number(existing.id);
    }
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO onboarding_risk_reviews (uuid, application_id, business_category, country, state,
        kyc_score, document_verification_score, watchlist_match, blacklist_match, manual_risk_score,
        final_risk_score, risk_level, reviewer_remarks, decision, reviewer_id, reviewed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(), applicationId,
        data.business_category ?? null, data.country ?? null, data.state ?? null,
        data.kyc_score ?? null, data.document_verification_score ?? null,
        data.watchlist_match ?? 0, data.blacklist_match ?? 0,
        data.manual_risk_score ?? null, data.final_risk_score ?? null,
        data.risk_level ?? 'low', data.reviewer_remarks ?? null,
        data.decision ?? 'pending', reviewerId ?? null,
        data.decision && data.decision !== 'pending' ? new Date() : null,
      ],
    );
    return result.insertId;
  }
}

export class KycReviewRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async listByApplication(applicationId: number): Promise<RowDataPacket[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT d.*, CONCAT(u.first_name, ' ', u.last_name) AS verifier_name
       FROM merchant_onboarding_kyc_documents d
       LEFT JOIN users u ON u.id = d.verified_by
       WHERE d.application_id = ? ORDER BY d.document_type`,
      [applicationId],
    );
    return rows;
  }

  async updateVerification(
    documentId: number, status: string, actorId?: number, remarks?: string,
  ): Promise<void> {
    await this.pool.query(
      `UPDATE merchant_onboarding_kyc_documents SET
        verification_status = ?, verified_by = ?, verified_at = NOW(), verifier_remarks = ?, updated_at = NOW()
       WHERE id = ?`,
      [status, actorId ?? null, remarks ?? null, documentId],
    );
  }

  async addVerificationEvent(
    documentId: number, applicationId: number, eventType: string, actorId?: number, remarks?: string,
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO onboarding_kyc_verification_events (uuid, document_id, application_id, event_type, actor_user_id, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [randomUUID(), documentId, applicationId, eventType, actorId ?? null, remarks ?? null],
    );
  }

  async getVerificationTimeline(applicationId: number): Promise<RowDataPacket[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT e.*, d.document_type, CONCAT(u.first_name, ' ', u.last_name) AS actor_name
       FROM onboarding_kyc_verification_events e
       JOIN merchant_onboarding_kyc_documents d ON d.id = e.document_id
       LEFT JOIN users u ON u.id = e.actor_user_id
       WHERE e.application_id = ? ORDER BY e.created_at DESC`,
      [applicationId],
    );
    return rows;
  }

  async requestReupload(documentId: number, applicationId: number, actorId?: number, remarks?: string): Promise<void> {
    await this.pool.query(
      `UPDATE merchant_onboarding_kyc_documents SET verification_status = 'reupload_requested',
        version = version + 1, verified_by = ?, verified_at = NOW(), verifier_remarks = ? WHERE id = ?`,
      [actorId ?? null, remarks ?? null, documentId],
    );
    await this.addVerificationEvent(documentId, applicationId, 'reupload_requested', actorId, remarks);
  }
}

export class TaxProfileRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async upsertFromBusiness(applicationId: number, business: RowDataPacket, actorId?: number): Promise<void> {
    await this.pool.query(
      `INSERT INTO merchant_tax_profiles (uuid, application_id, legal_name, trade_name, business_type, gst_number, pan_number, cin_number, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE legal_name = VALUES(legal_name), trade_name = VALUES(trade_name), gst_number = VALUES(gst_number)`,
      [randomUUID(), applicationId, business.legal_name, business.business_name, business.business_type,
        business.gst_number, business.pan_number, business.cin_number, actorId ?? null],
    );
  }

  async promoteToMerchant(applicationId: number, merchantId: number, actorId?: number): Promise<void> {
    await this.pool.query(
      'UPDATE merchant_tax_profiles SET is_current = 0, effective_to = NOW() WHERE merchant_id = ? AND is_current = 1',
      [merchantId],
    );
    await this.pool.query(
      `UPDATE merchant_tax_profiles SET merchant_id = ?, is_current = 1, effective_from = NOW()
       WHERE application_id = ? ORDER BY id DESC LIMIT 1`,
      [merchantId, applicationId],
    );
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT * FROM merchant_tax_profiles WHERE application_id = ? AND merchant_id IS NULL LIMIT 1',
      [applicationId],
    );
    if (rows[0]) {
      await this.pool.query(
        'UPDATE merchant_tax_profiles SET merchant_id = ?, is_current = 1 WHERE id = ?',
        [merchantId, rows[0].id],
      );
    }
  }
}
