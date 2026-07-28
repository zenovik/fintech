import { getOrganizationId } from '../../../shared/context/org-context';
import { NotFoundError, ValidationError } from '../../../shared/exceptions/app.exception';
import { assertCustomerInOrg, assertMerchantInOrg, requireOrgId } from '../../../shared/helpers/tenant-scope.helper';
import { SmartCollectRepository } from '../repositories/smart-collect.repository';
import { auditRecorder } from '../../audit';

function mapVa(r: Record<string, unknown>) {
  return {
    id: r.id, accountRef: r.account_ref, accountNumber: r.account_number,
    ifscCode: r.ifsc_code, bankName: r.bank_name, accountType: r.account_type,
    merchantId: r.merchant_id, merchantName: r.merchant_name,
    customerId: r.customer_id, outletId: r.outlet_id,
    currency: r.currency, expectedAmount: r.expected_amount ? Number(r.expected_amount) : null,
    status: r.status, expiresAt: r.expires_at, createdAt: r.created_at,
  };
}

function mapColl(r: Record<string, unknown>) {
  return {
    id: r.id, collectionRef: r.collection_ref, amount: Number(r.amount), currency: r.currency,
    utrReference: r.utr_reference, payerName: r.payer_name, status: r.status,
    matchType: r.match_type, matchedAt: r.matched_at, receivedAt: r.received_at,
    virtualAccountId: r.virtual_account_id, accountNumber: r.account_number,
    merchantId: r.merchant_id, merchantName: r.merchant_name,
  };
}

export class SmartCollectService {
  constructor(private readonly repo = new SmartCollectRepository()) {}

  async listVirtualAccounts(query: { page: number; pageSize: number; status?: string; merchantId?: number; accountType?: string }) {
    const { items, total } = await this.repo.listVirtualAccounts(query);
    return {
      items: items.map((r) => mapVa(r as Record<string, unknown>)),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) || 1 },
    };
  }

  async getVirtualAccount(id: number) {
    const row = await this.repo.findVirtualAccount(id);
    if (!row) throw new NotFoundError('Virtual account not found');
    return mapVa(row as Record<string, unknown>);
  }

  async createVirtualAccount(dto: Record<string, unknown>, actorId?: number) {
    const orgId = requireOrgId();
    if (dto.merchantId) await assertMerchantInOrg(Number(dto.merchantId), orgId);
    if (dto.customerId) await assertCustomerInOrg(Number(dto.customerId), orgId);
    const id = await this.repo.createVirtualAccount(dto, orgId, actorId);
    void auditRecorder.record({
      module: 'smart_collect', categoryCode: 'smart_collect', actionCode: 'va_created',
      entityType: 'virtual_account', entityId: String(id), description: 'Virtual account created', userId: actorId, riskLevel: 'low',
    }).catch(() => {});
    return this.getVirtualAccount(id);
  }

  async listCollections(query: { page: number; pageSize: number; status?: string; merchantId?: number; virtualAccountId?: number }) {
    const { items, total } = await this.repo.listCollections(query);
    return {
      items: items.map((r) => mapColl(r as Record<string, unknown>)),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) || 1 },
    };
  }

  async getCollection(id: number) {
    const row = await this.repo.findCollection(id);
    if (!row) throw new NotFoundError('Collection not found');
    const events = await this.repo.getCollectionEvents(id);
    return { collection: mapColl(row as Record<string, unknown>), events };
  }

  async matchCollection(id: number, dto: { matchType?: 'auto' | 'manual'; transactionId?: number }, actorId?: number) {
    const row = await this.repo.findCollection(id);
    if (!row) throw new NotFoundError('Collection not found');
    await this.repo.matchCollection(id, dto.matchType ?? 'manual', actorId, dto.transactionId);
    void auditRecorder.record({
      module: 'smart_collect', categoryCode: 'smart_collect', actionCode: 'collection_matched',
      entityType: 'collection', entityId: String(id), description: 'Collection matched', userId: actorId, riskLevel: 'low',
    }).catch(() => {});
    return this.getCollection(id);
  }

  async dashboard(merchantId?: number) {
    const stats = await this.repo.getDashboardStats(merchantId);
    return {
      virtualAccounts: {
        total: Number(stats.virtualAccounts?.total ?? 0),
        active: Number(stats.virtualAccounts?.active ?? 0),
      },
      collections: {
        total: Number(stats.collections?.total ?? 0),
        matched: Number(stats.collections?.matched ?? 0),
        pending: Number(stats.collections?.pending ?? 0),
        unmatched: Number(stats.collections?.unmatched ?? 0),
        totalAmount: Number(stats.collections?.total_amount ?? 0),
      },
    };
  }
}
