import { getOrganizationId } from '../../../shared/context/org-context';
import { NotFoundError, ValidationError } from '../../../shared/exceptions/app.exception';
import { auditRecorder } from '../../audit';
import { notificationDispatch } from '../../notifications';
import { WorkflowService } from '../../onboarding-approval/services/workflow.service';
import { GoLivePromotionService } from '../../onboarding-approval/services/go-live-promotion.service';
import { StatusSyncService } from '../../onboarding-approval/services/status-sync.service';
import { MerchantOnboardingRepository } from '../repositories/merchant-onboarding.repository';
import {
  AddressesBodyDto, BankDetailsDto, BusinessInfoDto, KycDocumentsBodyDto,
  OnboardingListQueryDto, PaymentConfigDto, RejectBodyDto, SettlementConfigDto, SuspendBodyDto,
} from '../dto';
import {
  AddressRow, ApplicationRow, BankDetailsRow, BusinessRow, KycDocumentRow,
  PaymentConfigRow, SettlementConfigRow, TimelineRow,
} from '../types/merchant-onboarding.types';

function mapApplication(row: ApplicationRow) {
  return {
    id: row.id, uuid: row.uuid, applicationRef: row.application_ref,
    organizationId: row.organization_id, organizationName: row.organization_name ?? null,
    merchantId: row.merchant_id, status: row.onboarding_status, currentStep: row.current_step,
    rejectionReason: row.rejection_reason, submittedAt: row.submitted_at, approvedAt: row.approved_at,
    rejectedAt: row.rejected_at, goLiveAt: row.go_live_at, createdAt: row.created_at, updatedAt: row.updated_at,
    businessName: row.business_name ?? null, legalName: row.legal_name ?? null, industry: row.industry ?? null,
  };
}

function mapBusiness(row: BusinessRow) {
  return {
    businessName: row.business_name, legalName: row.legal_name, merchantCategory: row.merchant_category,
    industry: row.industry, website: row.website, email: row.email, phone: row.phone,
    gstNumber: row.gst_number, panNumber: row.pan_number, cinNumber: row.cin_number, businessType: row.business_type,
  };
}

function mapAddress(row: AddressRow) {
  return {
    id: row.id, uuid: row.uuid, addressType: row.address_type, line1: row.line1, line2: row.line2,
    country: row.country, state: row.state, city: row.city, pincode: row.pincode,
    latitude: row.latitude ? Number(row.latitude) : null, longitude: row.longitude ? Number(row.longitude) : null,
  };
}

function mapKyc(row: KycDocumentRow) {
  return {
    id: row.id, uuid: row.uuid, documentType: row.document_type, fileName: row.file_name,
    fileSize: row.file_size, mimeType: row.mime_type, storagePath: row.storage_path, createdAt: row.created_at,
  };
}

function mapBank(row: BankDetailsRow) {
  return {
    accountHolder: row.account_holder, accountNumberMasked: row.account_number_masked, ifsc: row.ifsc,
    bankName: row.bank_name, branch: row.branch, accountType: row.account_type, verificationStatus: row.verification_status,
  };
}

function mapSettlement(row: SettlementConfigRow) {
  return {
    settlementCycle: row.settlement_cycle, settlementCurrency: row.settlement_currency,
    settlementMethod: row.settlement_method, minSettlementAmount: Number(row.min_settlement_amount),
    reservePct: Number(row.reserve_pct), rollingReservePct: Number(row.rolling_reserve_pct),
  };
}

function mapPayment(row: PaymentConfigRow) {
  return {
    enableCards: Boolean(row.enable_cards), enableUpi: Boolean(row.enable_upi),
    enableNetBanking: Boolean(row.enable_net_banking), enableWallet: Boolean(row.enable_wallet),
    enableEmi: Boolean(row.enable_emi), enableBnpl: Boolean(row.enable_bnpl),
    enableQr: Boolean(row.enable_qr), enablePaymentLinks: Boolean(row.enable_payment_links),
    enableSubscriptions: Boolean(row.enable_subscriptions),
  };
}

function mapTimeline(row: TimelineRow) {
  return {
    id: row.id, uuid: row.uuid, eventType: row.event_type, summary: row.summary,
    actorName: row.actor_name, metadata: row.metadata ? JSON.parse(row.metadata as string) : null, createdAt: row.created_at,
  };
}

export class MerchantOnboardingService {
  constructor(
    private readonly repo = new MerchantOnboardingRepository(),
    private readonly workflowService = new WorkflowService(),
    private readonly goLiveService = new GoLivePromotionService(),
    private readonly statusSync = new StatusSyncService(),
  ) {}

  async getStatistics() {
    const s = await this.repo.getStatistics();
    return {
      total: Number(s.total), draft: Number(s.draft_count), submitted: Number(s.submitted_count),
      kycPending: Number(s.kyc_pending_count), underReview: Number(s.under_review_count),
      approved: Number(s.approved_count), rejected: Number(s.rejected_count),
      goLive: Number(s.go_live_count), suspended: Number(s.suspended_count), inactive: Number(s.inactive_count),
      pendingOnboarding: Number(s.pending_onboarding),
    };
  }

  async list(query: OnboardingListQueryDto) {
    const { items, total } = await this.repo.findAll(query);
    return {
      items: items.map(mapApplication),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) },
    };
  }

  async getById(id: number) {
    const app = await this.requireApplication(id);
    const [business, addresses, kycDocuments, bank, settlement, payment, timeline] = await Promise.all([
      this.repo.getBusiness(id), this.repo.getAddresses(id), this.repo.getKycDocuments(id),
      this.repo.getBankDetails(id), this.repo.getSettlementConfig(id), this.repo.getPaymentConfig(id),
      this.repo.getTimeline(id),
    ]);
    return {
      ...mapApplication(app),
      business: business ? mapBusiness(business) : null,
      addresses: addresses.map(mapAddress),
      kycDocuments: kycDocuments.map(mapKyc),
      bank: bank ? mapBank(bank) : null,
      settlement: settlement ? mapSettlement(settlement) : null,
      payment: payment ? mapPayment(payment) : null,
      timeline: timeline.map(mapTimeline),
    };
  }

  async create(actorId?: number) {
    const orgId = getOrganizationId();
    if (!orgId) throw new ValidationError('Organization context is required');
    const id = await this.repo.create(orgId, actorId);
    void auditRecorder.record({
      module: 'merchants', categoryCode: 'merchants', actionCode: 'onboarding_create',
      entityType: 'merchant_onboarding', entityId: String(id),
      description: 'Created merchant onboarding application.', riskLevel: 'low', userId: actorId,
    }).catch(() => {});
    return this.getById(id);
  }

  async saveBusiness(id: number, dto: BusinessInfoDto, actorId?: number) {
    await this.requireDraftOrEditable(id);
    await this.repo.upsertBusiness(id, dto);
    await this.repo.addTimeline(id, 'updated', 'Business information updated', actorId);
    return this.getById(id);
  }

  async saveAddresses(id: number, dto: AddressesBodyDto, actorId?: number) {
    await this.requireDraftOrEditable(id);
    await this.repo.upsertAddresses(id, dto);
    await this.repo.addTimeline(id, 'updated', 'Address information updated', actorId);
    return this.getById(id);
  }

  async saveKyc(id: number, dto: KycDocumentsBodyDto, actorId?: number) {
    await this.requireDraftOrEditable(id);
    await this.repo.upsertKycDocuments(id, dto, actorId);
    await this.repo.addTimeline(id, 'updated', 'KYC documents updated', actorId);
    return this.getById(id);
  }

  async saveBank(id: number, dto: BankDetailsDto, actorId?: number) {
    await this.requireDraftOrEditable(id);
    await this.repo.upsertBankDetails(id, dto);
    await this.repo.addTimeline(id, 'updated', 'Bank details updated', actorId);
    return this.getById(id);
  }

  async saveSettlement(id: number, dto: SettlementConfigDto, actorId?: number) {
    await this.requireDraftOrEditable(id);
    await this.repo.upsertSettlementConfig(id, dto);
    await this.repo.addTimeline(id, 'updated', 'Settlement configuration updated', actorId);
    return this.getById(id);
  }

  async savePayment(id: number, dto: PaymentConfigDto, actorId?: number) {
    await this.requireDraftOrEditable(id);
    await this.repo.upsertPaymentConfig(id, dto);
    await this.repo.updateStep(id, 7);
    await this.repo.addTimeline(id, 'updated', 'Payment configuration updated', actorId);
    return this.getById(id);
  }

  async submit(id: number, actorId?: number) {
    const app = await this.requireApplication(id);
    if (app.onboarding_status !== 'draft') throw new ValidationError('Only draft applications can be submitted');
    const business = await this.repo.getBusiness(id);
    const bank = await this.repo.getBankDetails(id);
    if (!business) throw new ValidationError('Business information is required before submission');
    if (!bank) throw new ValidationError('Bank details are required before submission');
    await this.repo.submit(id, actorId);
    await this.workflowService.startWorkflow(id, actorId);
    if (actorId) {
      void notificationDispatch.dispatch({
        userId: actorId, eventCode: 'merchant_onboarding_submitted', category: 'merchant',
        body: `Onboarding application ${app.application_ref} has been submitted.`,
        relatedEntityType: 'merchant_onboarding', relatedEntityId: id,
        actionUrl: `/merchant-onboarding/${id}`, actionLabel: 'View Application',
        metadata: { applicationRef: app.application_ref },
      }).catch(() => {});
    }
    void auditRecorder.record({
      module: 'merchants', categoryCode: 'merchants', actionCode: 'onboarding_submit',
      entityType: 'merchant_onboarding', entityId: String(id),
      description: `Submitted onboarding application ${app.application_ref}.`, riskLevel: 'low', userId: actorId,
    }).catch(() => {});
    return this.getById(id);
  }

  async approve(id: number, actorId?: number) {
    const app = await this.requireApplication(id);
    if (!['submitted', 'kyc_pending', 'under_review'].includes(app.onboarding_status)) {
      throw new ValidationError('Application cannot be approved in current status');
    }
    await this.repo.updateStatus(id, 'approved', actorId);
    if (actorId) {
      void notificationDispatch.dispatch({
        userId: actorId, eventCode: 'merchant_onboarding_approved', category: 'merchant',
        body: `Onboarding application ${app.application_ref} has been approved.`,
        relatedEntityType: 'merchant_onboarding', relatedEntityId: id,
        actionUrl: `/merchant-onboarding/${id}`, actionLabel: 'View Application',
        metadata: { applicationRef: app.application_ref },
      }).catch(() => {});
    }
    void auditRecorder.record({
      module: 'merchants', categoryCode: 'merchants', actionCode: 'onboarding_approve',
      entityType: 'merchant_onboarding', entityId: String(id),
      description: `Approved onboarding application ${app.application_ref}.`, riskLevel: 'medium', userId: actorId,
    }).catch(() => {});
    return this.getById(id);
  }

  async reject(id: number, dto: RejectBodyDto, actorId?: number) {
    const app = await this.requireApplication(id);
    if (!['submitted', 'kyc_pending', 'under_review'].includes(app.onboarding_status)) {
      throw new ValidationError('Application cannot be rejected in current status');
    }
    await this.repo.updateStatus(id, 'rejected', actorId, dto.reason);
    if (actorId) {
      void notificationDispatch.dispatch({
        userId: actorId, eventCode: 'merchant_onboarding_rejected', category: 'merchant',
        body: `Onboarding application ${app.application_ref} was rejected: ${dto.reason}`,
        relatedEntityType: 'merchant_onboarding', relatedEntityId: id,
        actionUrl: `/merchant-onboarding/${id}`, actionLabel: 'View Application',
        metadata: { applicationRef: app.application_ref, reason: dto.reason },
      }).catch(() => {});
    }
    void auditRecorder.record({
      module: 'merchants', categoryCode: 'merchants', actionCode: 'onboarding_reject',
      entityType: 'merchant_onboarding', entityId: String(id),
      description: `Rejected onboarding application ${app.application_ref}. Reason: ${dto.reason}`,
      riskLevel: 'medium', userId: actorId,
    }).catch(() => {});
    return this.getById(id);
  }

  async goLive(id: number, actorId?: number) {
    const app = await this.requireApplication(id);
    if (app.merchant_id) return this.getById(id);
    if (app.onboarding_status !== 'approved' && app.onboarding_status !== 'go_live') {
      throw new ValidationError('Only approved applications can go live');
    }
    const orgId = getOrganizationId();
    if (!orgId) throw new ValidationError('Organization context is required');
    const merchantId = await this.goLiveService.execute(id, orgId, actorId);
    await this.repo.updateStatus(id, 'go_live', actorId);
    void auditRecorder.record({
      module: 'merchants', categoryCode: 'merchants', actionCode: 'onboarding_go_live',
      entityType: 'merchant', entityId: String(merchantId),
      description: `Merchant went live from onboarding ${app.application_ref}.`, riskLevel: 'high', userId: actorId,
    }).catch(() => {});
    return this.getById(id);
  }

  async suspend(id: number, dto: SuspendBodyDto, actorId?: number) {
    const app = await this.requireApplication(id);
    if (app.onboarding_status !== 'go_live' && app.onboarding_status !== 'completed') {
      throw new ValidationError('Only live merchants can be suspended');
    }
    if (app.merchant_id) {
      await this.statusSync.syncSuspend(id, Number(app.merchant_id), actorId);
    } else {
      await this.repo.updateStatus(id, 'suspended', actorId, dto.reason);
    }
    void auditRecorder.record({
      module: 'merchants', categoryCode: 'merchants', actionCode: 'onboarding_suspend',
      entityType: 'merchant_onboarding', entityId: String(id),
      description: `Suspended onboarding merchant ${app.application_ref}.`, riskLevel: 'high', userId: actorId,
    }).catch(() => {});
    return this.getById(id);
  }

  async getTimeline(id: number) {
    await this.requireApplication(id);
    const timeline = await this.repo.getTimeline(id);
    return { items: timeline.map(mapTimeline) };
  }

  private async requireApplication(id: number) {
    const app = await this.repo.findById(id);
    if (!app) throw new NotFoundError('Onboarding application not found');
    return app;
  }

  private async requireDraftOrEditable(id: number) {
    const app = await this.requireApplication(id);
    if (!['draft', 'rejected'].includes(app.onboarding_status)) {
      throw new ValidationError('Application cannot be edited in current status');
    }
  }
}
