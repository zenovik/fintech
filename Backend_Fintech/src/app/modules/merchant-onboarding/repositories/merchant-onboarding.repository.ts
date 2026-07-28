import { randomUUID } from 'crypto';
import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';
import {
  AddressesBodyDto, BankDetailsDto, BusinessInfoDto, KycDocumentsBodyDto,
  OnboardingListQueryDto, PaymentConfigDto, SettlementConfigDto,
} from '../dto';
import {
  AddressRow, ApplicationRow, BankDetailsRow, BusinessRow, KycDocumentRow,
  PaymentConfigRow, SettlementConfigRow, StatisticsRow, TimelineRow,
} from '../types/merchant-onboarding.types';
import { OnboardingStatus } from '../constants/merchant-onboarding.constants';
import { regionResolver } from '../../../shared/helpers/region-resolver';
import { MerchantCodeGenerator } from '../../../shared/helpers/merchant-code.generator';

function maskAccountNumber(num: string): string {
  if (num.length <= 4) return num;
  return `****${num.slice(-4)}`;
}

export class MerchantOnboardingRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  private orgClause(alias = 'a'): { clause: string; params: unknown[] } {
    const orgId = getOrganizationId();
    if (!orgId) return { clause: '', params: [] };
    return { clause: ` AND ${alias}.organization_id = ?`, params: [orgId] };
  }

  async getStatistics(): Promise<StatisticsRow> {
    const { clause, params } = this.orgClause();
    const [rows] = await this.pool.query<StatisticsRow[]>(
      `SELECT
         COUNT(*) AS total,
         SUM(onboarding_status = 'draft') AS draft_count,
         SUM(onboarding_status = 'submitted') AS submitted_count,
         SUM(onboarding_status = 'kyc_pending') AS kyc_pending_count,
         SUM(onboarding_status = 'under_review') AS under_review_count,
         SUM(onboarding_status = 'approved') AS approved_count,
         SUM(onboarding_status = 'rejected') AS rejected_count,
         SUM(onboarding_status = 'go_live') AS go_live_count,
         SUM(onboarding_status = 'suspended') AS suspended_count,
         SUM(onboarding_status = 'inactive') AS inactive_count,
         SUM(onboarding_status IN ('submitted','kyc_pending','under_review')) AS pending_onboarding
       FROM merchant_onboarding_applications a
       WHERE a.deleted_at IS NULL${clause}`,
      params,
    );
    return rows[0] ?? { total: 0, draft_count: 0, submitted_count: 0, kyc_pending_count: 0, under_review_count: 0, approved_count: 0, rejected_count: 0, go_live_count: 0, suspended_count: 0, inactive_count: 0, pending_onboarding: 0 } as StatisticsRow;
  }

  async findAll(query: OnboardingListQueryDto): Promise<{ items: ApplicationRow[]; total: number }> {
    const conditions = ['a.deleted_at IS NULL'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) {
      conditions.push('a.organization_id = ?');
      params.push(orgId);
    }

    if (query.search) {
      conditions.push('(a.application_ref LIKE ? OR b.business_name LIKE ? OR b.legal_name LIKE ?)');
      const term = `%${query.search}%`;
      params.push(term, term, term);
    }
    if (query.status) {
      conditions.push('a.onboarding_status = ?');
      params.push(query.status);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const sortCol = ['created_at', 'submitted_at', 'application_ref'].includes(query.sortBy) ? query.sortBy : 'created_at';
    const offset = (query.page - 1) * query.pageSize;

    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM merchant_onboarding_applications a
       LEFT JOIN merchant_onboarding_business b ON b.application_id = a.id
       ${where}`,
      params,
    );

    const [rows] = await this.pool.query<ApplicationRow[]>(
      `SELECT a.*, o.display_name AS organization_name, b.business_name, b.legal_name, b.industry
       FROM merchant_onboarding_applications a
       LEFT JOIN organizations o ON o.id = a.organization_id
       LEFT JOIN merchant_onboarding_business b ON b.application_id = a.id
       ${where}
       ORDER BY a.${sortCol} ${query.sortOrder === 'asc' ? 'ASC' : 'DESC'}
       LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );

    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async findById(id: number): Promise<ApplicationRow | null> {
    const { clause, params } = this.orgClause();
    const [rows] = await this.pool.query<ApplicationRow[]>(
      `SELECT a.*, o.display_name AS organization_name
       FROM merchant_onboarding_applications a
       LEFT JOIN organizations o ON o.id = a.organization_id
       WHERE a.id = ? AND a.deleted_at IS NULL${clause}`,
      [id, ...params],
    );
    return rows[0] ?? null;
  }

  async create(organizationId: number, userId?: number): Promise<number> {
    const uuid = randomUUID();
    const ref = `MOB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO merchant_onboarding_applications
         (uuid, application_ref, organization_id, onboarding_status, current_step, created_by, updated_by)
       VALUES (?, ?, ?, 'draft', 1, ?, ?)`,
      [uuid, ref, organizationId, userId ?? null, userId ?? null],
    );
    const id = result.insertId;
    await this.addTimeline(id, 'created', 'Onboarding application created', userId);
    return id;
  }

  async upsertBusiness(applicationId: number, dto: BusinessInfoDto): Promise<void> {
    await this.pool.query(
      `INSERT INTO merchant_onboarding_business
         (application_id, business_name, legal_name, merchant_category, industry, website, email, phone, gst_number, pan_number, cin_number, business_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         business_name = VALUES(business_name), legal_name = VALUES(legal_name),
         merchant_category = VALUES(merchant_category), industry = VALUES(industry),
         website = VALUES(website), email = VALUES(email), phone = VALUES(phone),
         gst_number = VALUES(gst_number), pan_number = VALUES(pan_number),
         cin_number = VALUES(cin_number), business_type = VALUES(business_type)`,
      [applicationId, dto.businessName, dto.legalName, dto.merchantCategory ?? null, dto.industry ?? null,
        dto.website || null, dto.email, dto.phone ?? null, dto.gstNumber ?? null, dto.panNumber ?? null,
        dto.cinNumber ?? null, dto.businessType ?? null],
    );
    await this.updateStep(applicationId, 2);
  }

  async upsertAddresses(applicationId: number, dto: AddressesBodyDto): Promise<void> {
    for (const addr of dto.addresses) {
      const uuid = randomUUID();
      await this.pool.query(
        `INSERT INTO merchant_onboarding_addresses
           (uuid, application_id, address_type, line1, line2, country, state, city, pincode, latitude, longitude)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           line1 = VALUES(line1), line2 = VALUES(line2), country = VALUES(country),
           state = VALUES(state), city = VALUES(city), pincode = VALUES(pincode),
           latitude = VALUES(latitude), longitude = VALUES(longitude)`,
        [uuid, applicationId, addr.addressType, addr.line1, addr.line2 ?? null, addr.country,
          addr.state ?? null, addr.city, addr.pincode ?? null, addr.latitude ?? null, addr.longitude ?? null],
      );
    }
    await this.updateStep(applicationId, 3);
  }

  async upsertKycDocuments(applicationId: number, dto: KycDocumentsBodyDto, userId?: number): Promise<void> {
    for (const doc of dto.documents) {
      const uuid = randomUUID();
      await this.pool.query(
        `INSERT INTO merchant_onboarding_kyc_documents
           (uuid, application_id, document_type, file_name, file_size, mime_type, storage_path, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           file_name = VALUES(file_name), file_size = VALUES(file_size),
           mime_type = VALUES(mime_type), storage_path = VALUES(storage_path), uploaded_by = VALUES(uploaded_by)`,
        [uuid, applicationId, doc.documentType, doc.fileName, doc.fileSize ?? null,
          doc.mimeType ?? null, doc.storagePath ?? null, userId ?? null],
      );
    }
    await this.updateStep(applicationId, 4);
  }

  async upsertBankDetails(applicationId: number, dto: BankDetailsDto): Promise<void> {
    await this.pool.query(
      `INSERT INTO merchant_onboarding_bank_details
         (application_id, account_holder, account_number_masked, ifsc, bank_name, branch, account_type, verification_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         account_holder = VALUES(account_holder), account_number_masked = VALUES(account_number_masked),
         ifsc = VALUES(ifsc), bank_name = VALUES(bank_name), branch = VALUES(branch),
         account_type = VALUES(account_type), verification_status = VALUES(verification_status)`,
      [applicationId, dto.accountHolder, maskAccountNumber(dto.accountNumber), dto.ifsc,
        dto.bankName, dto.branch ?? null, dto.accountType, dto.verificationStatus],
    );
    await this.updateStep(applicationId, 5);
  }

  async upsertSettlementConfig(applicationId: number, dto: SettlementConfigDto): Promise<void> {
    await this.pool.query(
      `INSERT INTO merchant_onboarding_settlement_config
         (application_id, settlement_cycle, settlement_currency, settlement_method, min_settlement_amount, reserve_pct, rolling_reserve_pct)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         settlement_cycle = VALUES(settlement_cycle), settlement_currency = VALUES(settlement_currency),
         settlement_method = VALUES(settlement_method), min_settlement_amount = VALUES(min_settlement_amount),
         reserve_pct = VALUES(reserve_pct), rolling_reserve_pct = VALUES(rolling_reserve_pct)`,
      [applicationId, dto.settlementCycle, dto.settlementCurrency, dto.settlementMethod,
        dto.minSettlementAmount, dto.reservePct, dto.rollingReservePct],
    );
    await this.updateStep(applicationId, 6);
  }

  async upsertPaymentConfig(applicationId: number, dto: PaymentConfigDto): Promise<void> {
    await this.pool.query(
      `INSERT INTO merchant_onboarding_payment_config
         (application_id, enable_cards, enable_upi, enable_net_banking, enable_wallet, enable_emi, enable_bnpl, enable_qr, enable_payment_links, enable_subscriptions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         enable_cards = VALUES(enable_cards), enable_upi = VALUES(enable_upi),
         enable_net_banking = VALUES(enable_net_banking), enable_wallet = VALUES(enable_wallet),
         enable_emi = VALUES(enable_emi), enable_bnpl = VALUES(enable_bnpl),
         enable_qr = VALUES(enable_qr), enable_payment_links = VALUES(enable_payment_links),
         enable_subscriptions = VALUES(enable_subscriptions)`,
      [applicationId, dto.enableCards ? 1 : 0, dto.enableUpi ? 1 : 0, dto.enableNetBanking ? 1 : 0,
        dto.enableWallet ? 1 : 0, dto.enableEmi ? 1 : 0, dto.enableBnpl ? 1 : 0,
        dto.enableQr ? 1 : 0, dto.enablePaymentLinks ? 1 : 0, dto.enableSubscriptions ? 1 : 0],
    );
    await this.updateStep(applicationId, 7);
  }

  async submit(applicationId: number, userId?: number): Promise<void> {
    await this.pool.query(
      `UPDATE merchant_onboarding_applications
       SET onboarding_status = 'submitted', current_step = 8, submitted_at = NOW(), updated_by = ?
       WHERE id = ?`,
      [userId ?? null, applicationId],
    );
    await this.addTimeline(applicationId, 'submitted', 'Application submitted for review', userId);
  }

  async updateStatus(applicationId: number, status: OnboardingStatus, userId?: number, reason?: string): Promise<void> {
    const fields: string[] = ['onboarding_status = ?', 'updated_by = ?'];
    const params: unknown[] = [status, userId ?? null];

    if (status === 'approved') { fields.push('approved_at = NOW()'); }
    if (status === 'rejected') { fields.push('rejected_at = NOW()', 'rejection_reason = ?'); params.push(reason ?? null); }
    if (status === 'go_live') { fields.push('go_live_at = NOW()'); }
    params.push(applicationId);

    await this.pool.query(
      `UPDATE merchant_onboarding_applications SET ${fields.join(', ')} WHERE id = ?`,
      params,
    );
    await this.addTimeline(applicationId, status as TimelineRow['event_type'], `Status changed to ${status}${reason ? `: ${reason}` : ''}`, userId);
  }

  async linkMerchant(applicationId: number, merchantId: number, userId?: number): Promise<void> {
    await this.pool.query(
      `UPDATE merchant_onboarding_applications SET merchant_id = ?, updated_by = ? WHERE id = ?`,
      [merchantId, userId ?? null, applicationId],
    );
  }

  async updateStep(applicationId: number, step: number): Promise<void> {
    await this.pool.query(
      `UPDATE merchant_onboarding_applications SET current_step = GREATEST(current_step, ?) WHERE id = ?`,
      [step, applicationId],
    );
  }

  async addTimeline(applicationId: number, eventType: string, summary: string, userId?: number, metadata?: object): Promise<void> {
    await this.pool.query(
      `INSERT INTO merchant_onboarding_timeline_events (uuid, application_id, event_type, summary, actor_user_id, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [randomUUID(), applicationId, eventType, summary, userId ?? null, metadata ? JSON.stringify(metadata) : null],
    );
  }

  async getBusiness(applicationId: number): Promise<BusinessRow | null> {
    const [rows] = await this.pool.query<BusinessRow[]>(
      `SELECT * FROM merchant_onboarding_business WHERE application_id = ?`, [applicationId],
    );
    return rows[0] ?? null;
  }

  async getAddresses(applicationId: number): Promise<AddressRow[]> {
    const [rows] = await this.pool.query<AddressRow[]>(
      `SELECT * FROM merchant_onboarding_addresses WHERE application_id = ? ORDER BY address_type`, [applicationId],
    );
    return rows;
  }

  async getKycDocuments(applicationId: number): Promise<KycDocumentRow[]> {
    const [rows] = await this.pool.query<KycDocumentRow[]>(
      `SELECT * FROM merchant_onboarding_kyc_documents WHERE application_id = ?`, [applicationId],
    );
    return rows;
  }

  async getBankDetails(applicationId: number): Promise<BankDetailsRow | null> {
    const [rows] = await this.pool.query<BankDetailsRow[]>(
      `SELECT * FROM merchant_onboarding_bank_details WHERE application_id = ?`, [applicationId],
    );
    return rows[0] ?? null;
  }

  async getSettlementConfig(applicationId: number): Promise<SettlementConfigRow | null> {
    const [rows] = await this.pool.query<SettlementConfigRow[]>(
      `SELECT * FROM merchant_onboarding_settlement_config WHERE application_id = ?`, [applicationId],
    );
    return rows[0] ?? null;
  }

  async getPaymentConfig(applicationId: number): Promise<PaymentConfigRow | null> {
    const [rows] = await this.pool.query<PaymentConfigRow[]>(
      `SELECT * FROM merchant_onboarding_payment_config WHERE application_id = ?`, [applicationId],
    );
    return rows[0] ?? null;
  }

  async getTimeline(applicationId: number): Promise<TimelineRow[]> {
    const [rows] = await this.pool.query<TimelineRow[]>(
      `SELECT t.*, CONCAT(u.first_name, ' ', u.last_name) AS actor_name
       FROM merchant_onboarding_timeline_events t
       LEFT JOIN users u ON u.id = t.actor_user_id
       WHERE t.application_id = ?
       ORDER BY t.created_at DESC`,
      [applicationId],
    );
    return rows;
  }

  async createMerchantFromOnboarding(applicationId: number, organizationId: number, userId?: number): Promise<number> {
    const business = await this.getBusiness(applicationId);
    if (!business) throw new Error('Business info required');

    const addresses = await this.getAddresses(applicationId);
    const registered = addresses.find((a) => a.address_type === 'registered') ?? addresses[0];
    const regionId = await regionResolver.resolveFromAddress(registered?.state, registered?.country ?? 'India');

    const uuid = randomUUID();
    const merchantCode = MerchantCodeGenerator.fromApplicationId(applicationId);
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO merchants
         (uuid, merchant_code, legal_name, display_name, business_type, business_category, website, kyc_status, status, region_id, organization_id, onboarded_at, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'verified', 'active', ?, ?, NOW(), ?, ?)`,
      [uuid, merchantCode, business.legal_name, business.business_name, business.business_type ?? 'other',
        business.merchant_category, business.website, regionId, organizationId, userId ?? null, userId ?? null],
    );
    const merchantId = result.insertId;

    for (const addr of addresses) {
      await this.pool.query(
        `INSERT INTO merchant_addresses (uuid, merchant_id, address_type, line1, line2, city, state_province, postal_code, country_code, is_primary)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'IN', ?)`,
        [randomUUID(), merchantId, addr.address_type === 'registered' ? 'registered' : 'other',
          addr.line1, addr.line2, addr.city, addr.state, addr.pincode, addr.address_type === 'registered' ? 1 : 0],
      );
    }

    const bank = await this.getBankDetails(applicationId);
    if (bank) {
      await this.pool.query(
        `INSERT INTO merchant_bank_accounts (uuid, merchant_id, account_holder, bank_name, account_number_masked, currency, is_primary)
         VALUES (?, ?, ?, ?, ?, 'INR', 1)`,
        [randomUUID(), merchantId, bank.account_holder, bank.bank_name, bank.account_number_masked],
      );
    }

    const settlement = await this.getSettlementConfig(applicationId);
    if (settlement) {
      const cycleMap: Record<string, string> = { t0: 'daily', t1: 'daily', t2: 'daily', weekly: 'weekly', monthly: 'monthly' };
      await this.pool.query(
        `INSERT INTO merchant_settlement_accounts (uuid, merchant_id, settlement_cycle, currency, is_active)
         VALUES (?, ?, ?, ?, 1)`,
        [randomUUID(), merchantId, cycleMap[settlement.settlement_cycle] ?? 'daily', settlement.settlement_currency],
      );
    }

    const payment = await this.getPaymentConfig(applicationId);
    if (payment) {
      const typeMap: [keyof PaymentConfigRow, number][] = [
        ['enable_cards', 1], ['enable_upi', 3], ['enable_net_banking', 2], ['enable_wallet', 5],
      ];
      for (const [field, typeId] of typeMap) {
        if (payment[field]) {
          await this.pool.query(
            `INSERT IGNORE INTO merchant_payment_methods (merchant_id, payment_method_type_id, is_enabled) VALUES (?, ?, 1)`,
            [merchantId, typeId],
          );
        }
      }
    }

    if (business.email) {
      const [nameParts] = business.email.split('@');
      await this.pool.query(
        `INSERT INTO merchant_contacts (uuid, merchant_id, contact_type, first_name, last_name, email, is_primary)
         VALUES (?, ?, 'primary', ?, '', ?, 1)`,
        [randomUUID(), merchantId, nameParts, business.email],
      );
    }

    return merchantId;
  }
}
