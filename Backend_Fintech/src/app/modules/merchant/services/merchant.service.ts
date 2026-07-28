import { MerchantRepository } from '../repositories/merchant.repository';
import { NotFoundError } from '../../../shared/exceptions/app.exception';
import { notificationDispatch } from '../../notifications';
import { auditRecorder } from '../../audit';
import {
  CreateDocumentBodyDto,
  CreateMerchantBodyDto,
  MerchantListQueryDto,
  MerchantSearchQueryDto,
  MerchantTransactionsQueryDto,
  UpdateMerchantBodyDto,
  UpdateMerchantStatusBodyDto,
} from '../dto';
import {
  MerchantAddressRow,
  MerchantApiCredentialRow,
  MerchantContactRow,
  MerchantDocumentRow,
  MerchantRow,
  MerchantSettlementRow,
  MerchantTagRow,
  MerchantTransactionRow,
} from '../types/merchant.types';

function mapMerchant(row: MerchantRow) {
  return {
    id: row.id,
    uuid: row.uuid,
    merchantCode: row.merchant_code,
    legalName: row.legal_name,
    displayName: row.display_name,
    logoInitials: row.logo_initials,
    logoColor: row.logo_color,
    businessType: row.business_type,
    businessCategory: row.business_category,
    entityType: row.entity_type,
    registrationNumber: row.registration_number,
    website: row.website,
    monthlyTpvEstimate: row.monthly_tpv_estimate ? Number(row.monthly_tpv_estimate) : null,
    kycStatus: row.kyc_status,
    riskLevel: row.risk_level,
    status: row.status,
    region: row.region_code
      ? { id: row.region_id, code: row.region_code, name: row.region_name }
      : { id: row.region_id },
    dailyVolume: Number(row.daily_volume),
    walletBalance: Number(row.wallet_balance),
    onboardedAt: row.onboarded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapContact(row: MerchantContactRow) {
  return {
    id: row.id,
    uuid: row.uuid,
    contactType: row.contact_type,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    jobTitle: row.job_title,
    isPrimary: Boolean(row.is_primary),
  };
}

function mapAddress(row: MerchantAddressRow) {
  return {
    id: row.id,
    uuid: row.uuid,
    addressType: row.address_type,
    line1: row.line1,
    line2: row.line2,
    city: row.city,
    stateProvince: row.state_province,
    postalCode: row.postal_code,
    countryCode: row.country_code,
    isPrimary: Boolean(row.is_primary),
  };
}

function mapDocument(row: MerchantDocumentRow) {
  return {
    id: row.id,
    uuid: row.uuid,
    documentType: row.document_type,
    fileName: row.file_name,
    fileUrl: row.file_url,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapApiKey(row: MerchantApiCredentialRow) {
  return {
    id: row.id,
    uuid: row.uuid,
    keyName: row.key_name,
    apiKeyPrefix: row.api_key_prefix,
    environment: row.environment,
    isActive: Boolean(row.is_active),
    lastUsedAt: row.last_used_at,
    createdAt: row.created_at,
  };
}

export class MerchantService {
  constructor(private readonly repo = new MerchantRepository()) {}

  async list(query: MerchantListQueryDto) {
    const { items, total } = await this.repo.findAll(query);
    return {
      items: items.map(mapMerchant),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }

  async search(query: MerchantSearchQueryDto) {
    const items = await this.repo.search(query);
    return { items: items.map(mapMerchant) };
  }

  async getStatistics() {
    const stats = await this.repo.getStatistics();
    return {
      total: Number(stats.total),
      active: Number(stats.active_count),
      pending: Number(stats.pending_count),
      suspended: Number(stats.suspended_count),
      verifiedKyc: Number(stats.verified_kyc_count),
      pendingKyc: Number(stats.pending_kyc_count),
      highRisk: Number(stats.high_risk_count),
    };
  }

  async getById(id: number) {
    const merchant = await this.repo.findById(id);
    if (!merchant) throw new NotFoundError('Merchant not found');

    const [contacts, addresses, documents, apiKeys, tags] = await Promise.all([
      this.repo.findContacts(id),
      this.repo.findAddresses(id),
      this.repo.findDocuments(id),
      this.repo.findApiCredentials(id),
      this.repo.findTags(id),
    ]);

    return {
      ...mapMerchant(merchant),
      contacts: contacts.map(mapContact),
      addresses: addresses.map(mapAddress),
      documents: documents.map(mapDocument),
      apiKeys: apiKeys.map(mapApiKey),
      tags: tags.map((t: MerchantTagRow) => ({ id: t.id, name: t.name, color: t.color })),
    };
  }

  async create(dto: CreateMerchantBodyDto, userId?: number) {
    const payload: CreateMerchantBodyDto = { ...dto, regionId: dto.regionId ?? 1 };
    const id = await this.repo.create(payload, userId);
    await auditRecorder.merchantCreate(id, payload.displayName, { userId }).catch(() => {});
    return this.getById(id);
  }

  async update(id: number, dto: UpdateMerchantBodyDto, userId?: number) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Merchant not found');
    await this.repo.update(id, dto, userId);
    return this.getById(id);
  }

  async updateStatus(id: number, dto: UpdateMerchantStatusBodyDto, userId?: number) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Merchant not found');
    await this.repo.updateStatus(id, dto, userId);
    const detail = await this.getById(id);
    if (userId) {
      if (dto.status === 'active') {
        void notificationDispatch.merchantApproved(userId, id, existing.display_name).catch(() => {});
        void auditRecorder.merchantApprove(id, existing.display_name, { userId }).catch(() => {});
      } else if (dto.status === 'suspended' || dto.status === 'inactive') {
        void notificationDispatch.merchantRejected(userId, id, existing.display_name, dto.reason).catch(() => {});
        void auditRecorder.merchantReject(id, existing.display_name, dto.reason, { userId }).catch(() => {});
      }
    }
    return detail;
  }

  async delete(id: number, userId?: number) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Merchant not found');
    await this.repo.softDelete(id, userId);
    return { message: 'Merchant deleted successfully' };
  }

  async getTransactions(id: number, query: MerchantTransactionsQueryDto) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Merchant not found');
    const { items, total } = await this.repo.findTransactions(id, query);
    return {
      items: items.map((t: MerchantTransactionRow) => ({
        id: t.id,
        uuid: t.uuid,
        transactionRef: t.transaction_ref,
        amount: Number(t.amount),
        currency: t.currency,
        paymentMethodDetail: t.payment_method_detail,
        status: { code: t.status_code, label: t.status_label },
        processedAt: t.processed_at,
        settledAt: t.settled_at,
      })),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }

  async getSettlements(id: number) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Merchant not found');
    const items = await this.repo.findSettlements(id);
    return {
      items: items.map((s: MerchantSettlementRow) => ({
        id: s.id,
        uuid: s.uuid,
        settlementRef: s.settlement_ref,
        amount: Number(s.amount),
        currency: s.currency,
        status: s.status,
        processedAt: s.processed_at,
      })),
    };
  }

  async getDocuments(id: number) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Merchant not found');
    const docs = await this.repo.findDocuments(id);
    return { items: docs.map(mapDocument) };
  }

  async createDocument(id: number, dto: CreateDocumentBodyDto, userId?: number) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Merchant not found');
    const docId = await this.repo.createDocument(id, dto, userId);
    const docs = await this.repo.findDocuments(id);
    const doc = docs.find((d) => d.id === docId);
    return mapDocument(doc!);
  }

  async deleteDocument(merchantId: number, documentId: number) {
    const existing = await this.repo.findById(merchantId);
    if (!existing) throw new NotFoundError('Merchant not found');
    const deleted = await this.repo.softDeleteDocument(merchantId, documentId);
    if (!deleted) throw new NotFoundError('Document not found');
    return { message: 'Document deleted successfully' };
  }
}
