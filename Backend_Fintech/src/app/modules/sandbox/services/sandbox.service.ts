import { getOrganizationId } from '../../../shared/context/org-context';
import { NotFoundError, ValidationError } from '../../../shared/exceptions/app.exception';
import { SandboxRepository } from '../repositories/sandbox.repository';

const DB_SIMULATION_TYPES = new Set(['payment_failure', 'payment_delay', 'webhook_failure', 'webhook_delay']);

function normalizeSimulationInput(dto: Record<string, unknown>): Record<string, unknown> {
  const simulationType = String(dto.simulationType ?? '');
  if (simulationType === 'payment_success') {
    return {
      ...dto,
      simulationType: 'payment_delay',
      configJson: { ...(dto.configJson as Record<string, unknown> ?? {}), scenario: 'payment_success' },
    };
  }
  if (!DB_SIMULATION_TYPES.has(simulationType)) {
    throw new ValidationError(`Unsupported simulation type: ${simulationType}`);
  }
  return dto;
}

function paginate<T>(items: T[], total: number, page: number, pageSize: number) {
  return { items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) || 1 } };
}

export class SandboxService {
  constructor(private readonly repo = new SandboxRepository()) {}

  async dashboard() {
    const stats = await this.repo.getDashboardStats();
    return {
      accounts: { total: Number(stats.accounts?.total ?? 0), active: Number(stats.accounts?.active ?? 0) },
      simulations: { total: Number(stats.simulations?.total ?? 0), enabled: Number(stats.simulations?.enabled ?? 0) },
      testCards: Number(stats.testCards?.total ?? 0),
    };
  }

  async listAccounts(query: { page: number; pageSize: number; status?: string }) {
    const { items, total } = await this.repo.listAccounts(query);
    return paginate(items.map((r) => ({
      id: r.id, uuid: r.uuid, organizationId: r.organization_id, merchantId: r.merchant_id,
      accountName: r.account_name, apiKeyPrefix: r.api_key_prefix, status: r.status, createdAt: r.created_at,
    })), total, query.page, query.pageSize);
  }

  async getAccount(id: number) {
    const row = await this.repo.findAccount(id);
    if (!row) throw new NotFoundError('Sandbox account not found');
    return {
      id: row.id, uuid: row.uuid, organizationId: row.organization_id, merchantId: row.merchant_id,
      accountName: row.account_name, apiKeyPrefix: row.api_key_prefix, status: row.status, createdAt: row.created_at,
    };
  }

  async createAccount(dto: Record<string, unknown>, actorId?: number) {
    const orgId = getOrganizationId();
    if (!orgId) throw new ValidationError('Organization context is required');
    const id = await this.repo.createAccount(dto, orgId, actorId);
    return this.getAccount(id);
  }

  async updateAccount(id: number, dto: Record<string, unknown>) {
    if (!(await this.repo.findAccount(id))) throw new NotFoundError('Sandbox account not found');
    await this.repo.updateAccount(id, dto);
    return this.getAccount(id);
  }

  async deleteAccount(id: number) {
    if (!(await this.repo.findAccount(id))) throw new NotFoundError('Sandbox account not found');
    await this.repo.deleteAccount(id);
    return { deleted: true };
  }

  async listTestCards() {
    const rows = await this.repo.listTestCards();
    return rows.map((r) => ({
      id: r.id, uuid: r.uuid, cardNumber: r.card_number, brand: r.brand,
      scenario: r.scenario, description: r.description,
    }));
  }

  async listSimulations(query: { page: number; pageSize: number }) {
    const { items, total } = await this.repo.listSimulations(query);
    return paginate(items.map((r) => ({
      id: r.id, uuid: r.uuid, simulationType: r.simulation_type,
      configJson: typeof r.config_json === 'string' ? JSON.parse(r.config_json as string) : r.config_json,
      isEnabled: Boolean(r.is_enabled), createdAt: r.created_at,
    })), total, query.page, query.pageSize);
  }

  async getSimulation(id: number) {
    const row = await this.repo.findSimulation(id);
    if (!row) throw new NotFoundError('Sandbox simulation not found');
    return {
      id: row.id, uuid: row.uuid, simulationType: row.simulation_type,
      configJson: typeof row.config_json === 'string' ? JSON.parse(row.config_json as string) : row.config_json,
      isEnabled: Boolean(row.is_enabled), createdAt: row.created_at,
    };
  }

  async createSimulation(dto: Record<string, unknown>) {
    const orgId = getOrganizationId();
    if (!orgId) throw new ValidationError('Organization context is required');
    const normalized = normalizeSimulationInput(dto);
    const id = await this.repo.createSimulation(normalized, orgId);
    return this.getSimulation(id);
  }

  async updateSimulation(id: number, dto: Record<string, unknown>) {
    if (!(await this.repo.findSimulation(id))) throw new NotFoundError('Sandbox simulation not found');
    await this.repo.updateSimulation(id, dto);
    return this.getSimulation(id);
  }

  async deleteSimulation(id: number) {
    if (!(await this.repo.findSimulation(id))) throw new NotFoundError('Sandbox simulation not found');
    await this.repo.deleteSimulation(id);
    return { deleted: true };
  }
}
