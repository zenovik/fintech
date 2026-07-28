import { randomUUID } from 'crypto';
import { ResultSetHeader } from 'mysql2/promise';
import { getPool } from '../../../database';
import { MerchantCodeGenerator } from '../../../shared/helpers/merchant-code.generator';
import { regionResolver } from '../../../shared/helpers/region-resolver';
import { MerchantOnboardingRepository } from '../../merchant-onboarding/repositories/merchant-onboarding.repository';
import { KycReviewRepository, TaxProfileRepository } from '../repositories/approval.repository';
import { StatusSyncService } from './status-sync.service';

export class GoLivePromotionService {
  constructor(
    private readonly onboardingRepo = new MerchantOnboardingRepository(),
    private readonly kycRepo = new KycReviewRepository(),
    private readonly taxRepo = new TaxProfileRepository(),
    private readonly statusSync = new StatusSyncService(),
    private readonly pool = getPool(),
  ) {}

  async execute(applicationId: number, organizationId: number, actorId?: number): Promise<number> {
    const app = await this.onboardingRepo.findById(applicationId);
    if (!app) throw new Error('Application not found');
    if (app.merchant_id) return Number(app.merchant_id);

    const business = await this.onboardingRepo.getBusiness(applicationId);
    if (!business) throw new Error('Business info required');

    await this.taxRepo.upsertFromBusiness(applicationId, business as never, actorId);

    const addresses = await this.onboardingRepo.getAddresses(applicationId);
    const registered = addresses.find((a) => a.address_type === 'registered') ?? addresses[0];
    const regionId = await regionResolver.resolveFromAddress(registered?.state, registered?.country ?? 'India');

    const merchantCode = MerchantCodeGenerator.fromApplicationId(applicationId);
    const [merchantResult] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO merchants
         (uuid, merchant_code, legal_name, display_name, business_type, business_category, website, kyc_status, status, region_id, organization_id, onboarded_at, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'verified', 'active', ?, ?, NOW(), ?, ?)`,
      [randomUUID(), merchantCode, business.legal_name, business.business_name, business.business_type ?? 'other',
        business.merchant_category, business.website, regionId, organizationId, actorId ?? null, actorId ?? null],
    );
    const merchantId = merchantResult.insertId;

    for (const addr of addresses) {
      await this.pool.query(
        `INSERT INTO merchant_addresses (uuid, merchant_id, address_type, line1, line2, city, state_province, postal_code, country_code, is_primary)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'IN', ?)`,
        [randomUUID(), merchantId, addr.address_type === 'registered' ? 'registered' : 'other',
          addr.line1, addr.line2, addr.city, addr.state, addr.pincode, addr.address_type === 'registered' ? 1 : 0],
      );
    }

    const bank = await this.onboardingRepo.getBankDetails(applicationId);
    if (bank) {
      await this.pool.query(
        `INSERT INTO merchant_bank_accounts (uuid, merchant_id, account_holder, bank_name, account_number_masked, currency, is_primary)
         VALUES (?, ?, ?, ?, ?, 'INR', 1)`,
        [randomUUID(), merchantId, bank.account_holder, bank.bank_name, bank.account_number_masked],
      );
    }

    const settlement = await this.onboardingRepo.getSettlementConfig(applicationId);
    if (settlement) {
      const cycleMap: Record<string, string> = { t0: 'daily', t1: 'daily', t2: 'daily', weekly: 'weekly', monthly: 'monthly' };
      await this.pool.query(
        `INSERT INTO merchant_settlement_accounts (uuid, merchant_id, settlement_cycle, currency, is_active)
         VALUES (?, ?, ?, ?, 1)`,
        [randomUUID(), merchantId, cycleMap[settlement.settlement_cycle] ?? 'daily', settlement.settlement_currency],
      );
    }

    const payment = await this.onboardingRepo.getPaymentConfig(applicationId);
    if (payment) {
      const typeMap: [string, number][] = [
        ['enable_cards', 1], ['enable_upi', 3], ['enable_net_banking', 2], ['enable_wallet', 5],
      ];
      for (const [field, typeId] of typeMap) {
        if ((payment as Record<string, unknown>)[field]) {
          await this.pool.query(
            'INSERT IGNORE INTO merchant_payment_methods (merchant_id, payment_method_type_id, is_enabled) VALUES (?, ?, 1)',
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

    await this.promoteKycDocuments(applicationId, merchantId, actorId);
    await this.taxRepo.promoteToMerchant(applicationId, merchantId, actorId);
    await this.ensureDefaultOutlet(merchantId, organizationId, business.business_name, registered ?? undefined, actorId);

    await this.onboardingRepo.linkMerchant(applicationId, merchantId, actorId);
    await this.statusSync.syncGoLive(applicationId, merchantId, actorId);

    return merchantId;
  }

  private async promoteKycDocuments(applicationId: number, merchantId: number, actorId?: number): Promise<void> {
    const docs = await this.kycRepo.listByApplication(applicationId);
    for (const doc of docs) {
      if (doc.verification_status !== 'approved') continue;
      await this.pool.query(
        `INSERT INTO merchant_documents (uuid, merchant_id, document_type, file_name, file_url, status, uploaded_by, reviewed_at)
         VALUES (?, ?, ?, ?, ?, 'approved', ?, NOW())`,
        [randomUUID(), merchantId, doc.document_type, doc.file_name, doc.storage_path, doc.uploaded_by ?? actorId ?? null],
      );
    }
  }

  private async ensureDefaultOutlet(
    merchantId: number, organizationId: number, businessName: string,
    address?: { city?: string | null; state?: string | null; line1?: string | null; pincode?: string | null; latitude?: number | null; longitude?: number | null },
    actorId?: number,
  ): Promise<void> {
    const [existing] = await this.pool.query<import('mysql2/promise').RowDataPacket[]>(
      'SELECT COUNT(*) AS c FROM merchant_outlets WHERE merchant_id = ? AND deleted_at IS NULL',
      [merchantId],
    );
    if (Number(existing[0]?.c) > 0) return;

    const outletName = address?.city ? `${address.city} Flagship` : `${businessName} HQ`;
    await this.pool.query(
      `INSERT INTO merchant_outlets (uuid, outlet_code, outlet_name, merchant_id, organization_id, branch_type, status, is_primary, city, state, address_line1, pincode, latitude, longitude, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, 'flagship', 'active', 1, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), `OUT-${merchantId}-HQ`, outletName, merchantId, organizationId,
        address?.city ?? null, address?.state ?? null, address?.line1 ?? null, address?.pincode ?? null,
        address?.latitude ?? null, address?.longitude ?? null, actorId ?? null, actorId ?? null],
    );
  }
}
