import { getOrganizationId } from '../../../shared/context/org-context';
import { NotFoundError, ValidationError } from '../../../shared/exceptions/app.exception';
import { ReconciliationRepository } from '../repositories/reconciliation.repository';

function paginate<T>(items: T[], total: number, page: number, pageSize: number) {
  return { items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) || 1 } };
}

function mapImport(r: Record<string, unknown>) {
  return {
    id: r.id, uuid: r.uuid, organizationId: r.organization_id, merchantId: r.merchant_id,
    importRef: r.import_ref, sourceType: r.source_type, fileName: r.file_name, status: r.status,
    totalRows: r.total_rows, matchedRows: r.matched_rows, unmatchedRows: r.unmatched_rows,
    importedBy: r.imported_by, completedAt: r.completed_at, createdAt: r.created_at,
  };
}

function mapRecord(r: Record<string, unknown>) {
  return {
    id: r.id, uuid: r.uuid, importId: r.import_id, organizationId: r.organization_id,
    merchantId: r.merchant_id, externalRef: r.external_ref, amount: Number(r.amount),
    currency: r.currency, recordDate: r.record_date, recordType: r.record_type,
    matchStatus: r.match_status, transactionId: r.transaction_id, settlementId: r.settlement_id,
    matchedAt: r.matched_at, matchedBy: r.matched_by, createdAt: r.created_at,
  };
}

export class ReconciliationService {
  constructor(private readonly repo = new ReconciliationRepository()) {}

  async dashboard() {
    const stats = await this.repo.getDashboardStats();
    return {
      imports: {
        total: Number(stats.imports?.total ?? 0), completed: Number(stats.imports?.completed ?? 0),
        failed: Number(stats.imports?.failed ?? 0),
      },
      records: {
        total: Number(stats.records?.total ?? 0), unmatched: Number(stats.records?.unmatched ?? 0),
        matched: Number(stats.records?.matched ?? 0), exceptions: Number(stats.records?.exceptions ?? 0),
      },
    };
  }

  async listImports(query: { page: number; pageSize: number; status?: string }) {
    const { items, total } = await this.repo.listImports(query);
    return paginate(items.map((r) => mapImport(r as Record<string, unknown>)), total, query.page, query.pageSize);
  }

  async getImport(id: number) {
    const row = await this.repo.findImport(id);
    if (!row) throw new NotFoundError('Reconciliation import not found');
    return mapImport(row as Record<string, unknown>);
  }

  async createImport(dto: Record<string, unknown>, actorId?: number) {
    const orgId = getOrganizationId();
    if (!orgId) throw new ValidationError('Organization context is required');
    const id = await this.repo.createImport(dto, orgId, actorId);
    return this.getImport(id);
  }

  async updateImport(id: number, dto: Record<string, unknown>) {
    if (!(await this.repo.findImport(id))) throw new NotFoundError('Reconciliation import not found');
    await this.repo.updateImport(id, dto);
    return this.getImport(id);
  }

  async deleteImport(id: number) {
    if (!(await this.repo.findImport(id))) throw new NotFoundError('Reconciliation import not found');
    await this.repo.deleteImport(id);
    return { deleted: true };
  }

  async listRecords(query: { page: number; pageSize: number; importId?: number; matchStatus?: string }) {
    const { items, total } = await this.repo.listRecords(query);
    return paginate(items.map((r) => mapRecord(r as Record<string, unknown>)), total, query.page, query.pageSize);
  }

  async getRecord(id: number) {
    const row = await this.repo.findRecord(id);
    if (!row) throw new NotFoundError('Reconciliation record not found');
    return mapRecord(row as Record<string, unknown>);
  }

  async createRecord(importId: number, dto: Record<string, unknown>) {
    const orgId = getOrganizationId();
    if (!orgId) throw new ValidationError('Organization context is required');
    if (!(await this.repo.findImport(importId))) throw new NotFoundError('Reconciliation import not found');
    const id = await this.repo.createRecord(importId, dto, orgId);
    return this.getRecord(id);
  }

  async matchRecord(id: number, dto: { matchType?: 'auto' | 'manual'; transactionId?: number; settlementId?: number }, actorId?: number) {
    if (!(await this.repo.findRecord(id))) throw new NotFoundError('Reconciliation record not found');
    await this.repo.matchRecord(id, dto.matchType ?? 'manual', actorId, dto.transactionId, dto.settlementId);
    return this.getRecord(id);
  }

  async autoMatchImport(importId: number, actorId?: number) {
    if (!(await this.repo.findImport(importId))) throw new NotFoundError('Reconciliation import not found');
    return this.repo.autoMatchImport(importId, actorId);
  }
}
