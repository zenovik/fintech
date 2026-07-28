import { getOrganizationId } from '../../../shared/context/org-context';
import { NotFoundError, ValidationError } from '../../../shared/exceptions/app.exception';
import { DeveloperRepository } from '../repositories/developer.repository';

function mapProfile(r: Record<string, unknown>) {
  return {
    id: r.id, uuid: r.uuid, userId: r.user_id, userEmail: r.user_email,
    organizationId: r.organization_id, companyName: r.company_name, website: r.website,
    sandboxEnabled: Boolean(r.sandbox_enabled), createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapOAuthApp(r: Record<string, unknown>) {
  return {
    id: r.id, uuid: r.uuid, organizationId: r.organization_id, name: r.name,
    clientId: r.client_id, redirectUris: typeof r.redirect_uris === 'string' ? JSON.parse(r.redirect_uris as string) : r.redirect_uris,
    scopes: typeof r.scopes === 'string' ? JSON.parse(r.scopes as string) : r.scopes,
    environment: r.environment, status: r.status, createdBy: r.created_by, createdAt: r.created_at,
  };
}

function mapUsageLog(r: Record<string, unknown>) {
  return {
    id: r.id, uuid: r.uuid, organizationId: r.organization_id, apiKeyId: r.api_key_id,
    method: r.method, path: r.path, statusCode: r.status_code, latencyMs: r.latency_ms,
    environment: r.environment, ipAddress: r.ip_address, createdAt: r.created_at,
  };
}

function paginate<T>(items: T[], total: number, page: number, pageSize: number) {
  return { items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) || 1 } };
}

export class DeveloperService {
  constructor(private readonly repo = new DeveloperRepository()) {}

  async dashboard() {
    const stats = await this.repo.getDashboardStats();
    return {
      profiles: Number(stats.profiles?.total ?? 0),
      oauthApps: { total: Number(stats.oauthApps?.total ?? 0), active: Number(stats.oauthApps?.active ?? 0) },
      requests24h: Number(stats.usage24h?.requests_24h ?? 0),
      activeApiKeys: Number(stats.apiKeys?.total ?? 0),
    };
  }

  async listProfiles(query: { page: number; pageSize: number }) {
    const { items, total } = await this.repo.listProfiles(query);
    return paginate(items.map((r) => mapProfile(r as Record<string, unknown>)), total, query.page, query.pageSize);
  }

  async getProfile(id: number) {
    const row = await this.repo.findProfile(id);
    if (!row) throw new NotFoundError('Developer profile not found');
    return mapProfile(row as Record<string, unknown>);
  }

  async createProfile(dto: Record<string, unknown>) {
    const orgId = getOrganizationId();
    if (!orgId) throw new ValidationError('Organization context is required');
    const id = await this.repo.createProfile(dto, orgId);
    return this.getProfile(id);
  }

  async updateProfile(id: number, dto: Record<string, unknown>) {
    const existing = await this.repo.findProfile(id);
    if (!existing) throw new NotFoundError('Developer profile not found');
    await this.repo.updateProfile(id, dto);
    return this.getProfile(id);
  }

  async deleteProfile(id: number) {
    const existing = await this.repo.findProfile(id);
    if (!existing) throw new NotFoundError('Developer profile not found');
    await this.repo.deleteProfile(id);
    return { deleted: true };
  }

  async listOAuthApps(query: { page: number; pageSize: number; status?: string }) {
    const { items, total } = await this.repo.listOAuthApps(query);
    return paginate(items.map((r) => mapOAuthApp(r as Record<string, unknown>)), total, query.page, query.pageSize);
  }

  async getOAuthApp(id: number) {
    const row = await this.repo.findOAuthApp(id);
    if (!row) throw new NotFoundError('OAuth application not found');
    return mapOAuthApp(row as Record<string, unknown>);
  }

  async createOAuthApp(dto: Record<string, unknown>, actorId?: number) {
    const orgId = getOrganizationId();
    if (!orgId) throw new ValidationError('Organization context is required');
    const { id, clientId, clientSecret } = await this.repo.createOAuthApp(dto, orgId, actorId);
    return { ...await this.getOAuthApp(id), clientSecret };
  }

  async updateOAuthApp(id: number, dto: Record<string, unknown>) {
    const existing = await this.repo.findOAuthApp(id);
    if (!existing) throw new NotFoundError('OAuth application not found');
    await this.repo.updateOAuthApp(id, dto);
    return this.getOAuthApp(id);
  }

  async revokeOAuthApp(id: number) {
    const existing = await this.repo.findOAuthApp(id);
    if (!existing) throw new NotFoundError('OAuth application not found');
    await this.repo.revokeOAuthApp(id);
    return this.getOAuthApp(id);
  }

  async listApiUsageLogs(query: { page: number; pageSize: number; method?: string; statusCode?: number }) {
    const { items, total } = await this.repo.listApiUsageLogs(query);
    return paginate(items.map((r) => mapUsageLog(r as Record<string, unknown>)), total, query.page, query.pageSize);
  }

  async listApiKeys() {
    const rows = await this.repo.listApiKeys();
    return rows.map((r) => ({
      id: r.id, uuid: r.uuid, name: r.name, keyPrefix: r.key_prefix,
      environment: r.environment, status: r.status,
      rateLimitPerMinute: r.rate_limit_per_minute, lastUsedAt: r.last_used_at, createdAt: r.created_at,
    }));
  }
}
