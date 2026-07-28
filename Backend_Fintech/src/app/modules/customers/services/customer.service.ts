import { CustomerRepository } from '../repositories/customer.repository';
import { NotFoundError, ValidationError } from '../../../shared/exceptions/app.exception';
import { getOrganizationId } from '../../../shared/context/org-context';
import { auditRecorder } from '../../audit';
import { notificationDispatch } from '../../notifications';
import {
  CreateCustomerBodyDto,
  CreateCustomerWithOrgDto,
  CustomerListQueryDto,
  CustomerSearchQueryDto,
  CustomerTransactionsQueryDto,
  UpdateCustomerBodyDto,
  UpdateCustomerStatusBodyDto,
} from '../dto';
import {
  CustomerAddressRow,
  CustomerMerchantRow,
  CustomerRow,
  CustomerTransactionRow,
} from '../types/customer.types';

function mapCustomer(row: CustomerRow) {
  return {
    id: row.id,
    uuid: row.uuid,
    customerCode: row.customer_code,
    organizationId: row.organization_id,
    organizationName: row.organization_name ?? null,
    organizationCode: row.organization_code ?? null,
    primaryMerchantId: row.primary_merchant_id,
    merchantName: row.merchant_name ?? null,
    merchantCode: row.merchant_code ?? null,
    customerType: row.customer_type,
    firstName: row.first_name,
    lastName: row.last_name,
    displayName: row.display_name,
    email: row.email,
    phone: row.phone,
    companyName: row.company_name,
    status: row.status,
    kycStatus: row.kyc_status,
    riskLevel: row.risk_level,
    region: row.region_code
      ? { id: row.region_id, code: row.region_code, name: row.region_name }
      : row.region_id ? { id: row.region_id } : null,
    totalSpent: Number(row.total_spent),
    transactionCount: row.transaction_count,
    lastTransactionAt: row.last_transaction_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAddress(row: CustomerAddressRow) {
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

function mapMerchant(row: CustomerMerchantRow) {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    merchantCode: row.merchant_code,
    displayName: row.display_name,
    status: row.status,
    firstTransactionAt: row.first_transaction_at,
    lastTransactionAt: row.last_transaction_at,
    transactionCount: row.transaction_count,
    totalSpent: Number(row.total_spent),
  };
}

function mapTransaction(row: CustomerTransactionRow) {
  return {
    id: row.id,
    uuid: row.uuid,
    transactionRef: row.transaction_ref,
    amount: Number(row.amount),
    currency: row.currency,
    paymentMethodDetail: row.payment_method_detail,
    status: { code: row.status_code, label: row.status_label },
    merchantId: row.merchant_id,
    merchantName: row.merchant_name ?? null,
    processedAt: row.processed_at,
    settledAt: row.settled_at,
  };
}

export class CustomerService {
  constructor(private readonly repo = new CustomerRepository()) {}

  async list(query: CustomerListQueryDto) {
    const { items, total } = await this.repo.findAll(query);
    const stats = await this.repo.getStatistics();
    return {
      items: items.map(mapCustomer),
      stats: {
        total: Number(stats.total),
        active: Number(stats.active_count),
        inactive: Number(stats.inactive_count),
        blocked: Number(stats.blocked_count),
        pending: Number(stats.pending_count),
        verifiedKyc: Number(stats.verified_kyc_count),
        highRisk: Number(stats.high_risk_count),
      },
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }

  async search(query: CustomerSearchQueryDto) {
    const items = await this.repo.search(query);
    return { items: items.map(mapCustomer) };
  }

  async getStatistics() {
    const stats = await this.repo.getStatistics();
    return {
      total: Number(stats.total),
      active: Number(stats.active_count),
      inactive: Number(stats.inactive_count),
      blocked: Number(stats.blocked_count),
      pending: Number(stats.pending_count),
      verifiedKyc: Number(stats.verified_kyc_count),
      highRisk: Number(stats.high_risk_count),
    };
  }

  async getById(id: number) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('Customer not found');
    const [addresses, merchants] = await Promise.all([
      this.repo.findAddresses(id),
      this.repo.findMerchants(id),
    ]);
    return {
      ...mapCustomer(row),
      addresses: addresses.map(mapAddress),
      merchants: merchants.map(mapMerchant),
    };
  }

  async create(dto: CreateCustomerBodyDto, actorId?: number) {
    const organizationId = getOrganizationId();
    if (!organizationId) throw new ValidationError('Organization context is required');
    const payload: CreateCustomerWithOrgDto = { ...dto, organizationId };
    const id = await this.repo.create(payload, actorId);
    void auditRecorder.record({
      module: 'customers', categoryCode: 'customers', actionCode: 'customer_create',
      entityType: 'customer', entityId: String(id),
      description: `Created customer ${dto.displayName ?? dto.firstName}.`,
      afterValues: { email: dto.email, organizationId },
      riskLevel: 'low', userId: actorId,
    }).catch(() => {});
    if (actorId) {
      void notificationDispatch.customerCreated(actorId, id, dto.displayName ?? dto.firstName).catch(() => {});
    }
    return this.getById(id);
  }

  async update(id: number, dto: UpdateCustomerBodyDto, actorId?: number) {
    await this.getById(id);
    await this.repo.update(id, dto, actorId);
    void auditRecorder.record({
      module: 'customers', categoryCode: 'customers', actionCode: 'customer_update',
      entityType: 'customer', entityId: String(id),
      description: `Updated customer #${id}.`,
      afterValues: dto as Record<string, unknown>,
      riskLevel: 'low', userId: actorId,
    }).catch(() => {});
    return this.getById(id);
  }

  async updateStatus(id: number, dto: UpdateCustomerStatusBodyDto, actorId?: number) {
    const before = await this.getById(id);
    await this.repo.updateStatus(id, dto, actorId);
    void auditRecorder.record({
      module: 'customers', categoryCode: 'customers', actionCode: 'customer_status',
      entityType: 'customer', entityId: String(id),
      description: `Changed customer #${id} status to ${dto.status}.`,
      beforeValues: { status: before.status },
      afterValues: { status: dto.status, reason: dto.reason },
      riskLevel: dto.status === 'blocked' ? 'medium' : 'low', userId: actorId,
    }).catch(() => {});
    if (actorId) {
      void notificationDispatch.customerStatusChanged(actorId, id, before.displayName, dto.status).catch(() => {});
    }
    return this.getById(id);
  }

  async delete(id: number, actorId?: number) {
    await this.getById(id);
    await this.repo.softDelete(id, actorId);
    void auditRecorder.record({
      module: 'customers', categoryCode: 'customers', actionCode: 'customer_delete',
      entityType: 'customer', entityId: String(id),
      description: `Deleted customer #${id}.`,
      riskLevel: 'medium', userId: actorId,
    }).catch(() => {});
    return { id, deleted: true };
  }

  async getTransactions(id: number, query: CustomerTransactionsQueryDto) {
    await this.getById(id);
    const { items, total } = await this.repo.findTransactions(id, query);
    return {
      items: items.map(mapTransaction),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }

  async getMerchants(id: number) {
    await this.getById(id);
    const merchants = await this.repo.findMerchants(id);
    return merchants.map(mapMerchant);
  }

  async getPreferences(id: number) {
    const customer = await this.getById(id);
    const prefs = await this.repo.getPreferences(id);
    return {
      customerId: id,
      preferences: prefs ? {
        locale: prefs.locale, currency: prefs.currency,
        defaultPaymentMethod: prefs.default_payment_method,
        communicationChannel: prefs.communication_channel,
        marketingOptIn: Boolean(prefs.marketing_opt_in),
        darkMode: Boolean(prefs.dark_mode),
        notes: prefs.notes,
      } : { locale: 'en-US', currency: 'USD', communicationChannel: 'email', marketingOptIn: false, darkMode: false },
      customerName: customer.displayName,
    };
  }

  async updatePreferences(id: number, dto: Record<string, unknown>, actorId?: number) {
    const customer = await this.getById(id);
    await this.repo.upsertPreferences(id, customer.organizationId, dto);
    return this.getPreferences(id);
  }

  async getPaymentMethods(id: number) {
    await this.getById(id);
    const methods = await this.repo.listPaymentMethods(id);
    return methods.map((m) => ({
      id: m.id, methodType: m.method_type, methodCode: m.method_code,
      displayName: m.display_name, lastFour: m.last_four, isDefault: Boolean(m.is_default),
    }));
  }

  async getTimeline(id: number) {
    await this.getById(id);
    return await this.repo.getTimeline(id);
  }
}
