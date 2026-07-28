import { OrganizationRepository } from '../repositories/organization.repository';
import { NotFoundError, ValidationError, ForbiddenError } from '../../../shared/exceptions/app.exception';
import { auditRecorder } from '../../audit';
import {
  BillingBodyDto,
  BrandingBodyDto,
  CreateApiKeyBodyDto,
  CreateDomainBodyDto,
  CreateMemberBodyDto,
  CreateOrganizationBodyDto,
  OrganizationListQueryDto,
  PreferencesBodyDto,
  UpdateDomainBodyDto,
  UpdateMemberBodyDto,
  UpdateOrganizationBodyDto,
  UpdateOrganizationStatusBodyDto,
} from '../dto';

export class OrganizationService {
  constructor(private readonly repo = new OrganizationRepository()) {}

  private async assertUserCanAccessOrg(userId: number | undefined, orgId: number): Promise<void> {
    if (!userId) throw new ForbiddenError('Authentication required');
    const memberships = await this.repo.findMembershipsByUserId(userId);
    if (!memberships.some((m) => m.id === orgId)) {
      throw new ForbiddenError('You do not have access to this organization');
    }
  }

  async list(query: OrganizationListQueryDto) {
    const result = await this.repo.findAll(query);
    const stats = await this.repo.getStats();
    return { ...result, stats };
  }

  async getById(id: number, userId?: number) {
    await this.assertUserCanAccessOrg(userId, id);
    const org = await this.repo.findById(id);
    if (!org) throw new NotFoundError('Organization not found');
    return org;
  }

  async getMine(userId: number) {
    return this.repo.findMembershipsByUserId(userId);
  }

  async create(dto: CreateOrganizationBodyDto, actorId?: number) {
    try {
      const org = await this.repo.create(dto, actorId);
      void auditRecorder.record({
        module: 'organizations', categoryCode: 'organizations', actionCode: 'org_create',
        entityType: 'organization', entityId: String(org?.id),
        description: `Created organization ${dto.displayName}.`,
        afterValues: { code: dto.code, displayName: dto.displayName },
        riskLevel: 'low', userId: actorId,
      }).catch(() => {});
      return org;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('uk_organizations_code') || msg.includes('Duplicate')) {
        throw new ValidationError('Organization code already exists');
      }
      throw err;
    }
  }

  async update(id: number, dto: UpdateOrganizationBodyDto, actorId?: number) {
    await this.getById(id, actorId);
    const updated = await this.repo.update(id, dto, actorId);
    void auditRecorder.record({
      module: 'organizations', categoryCode: 'organizations', actionCode: 'org_update',
      entityType: 'organization', entityId: String(id),
      description: `Updated organization #${id}.`,
      afterValues: dto as Record<string, unknown>,
      riskLevel: 'low', userId: actorId,
    }).catch(() => {});
    return updated;
  }

  async updateStatus(id: number, dto: UpdateOrganizationStatusBodyDto, actorId?: number) {
    await this.getById(id, actorId);
    const updated = await this.repo.updateStatus(id, dto.status, actorId);
    const action = dto.status === 'archived' ? 'org_archive' : dto.status === 'active' ? 'org_restore' : 'org_update';
    void auditRecorder.record({
      module: 'organizations', categoryCode: 'organizations', actionCode: action,
      entityType: 'organization', entityId: String(id),
      description: `Changed organization #${id} status to ${dto.status}.`,
      afterValues: { status: dto.status, reason: dto.reason },
      riskLevel: dto.status === 'archived' ? 'medium' : 'low', userId: actorId,
    }).catch(() => {});
    return updated;
  }

  async archive(id: number, actorId?: number) {
    return this.updateStatus(id, { status: 'archived' }, actorId);
  }

  async restore(id: number, actorId?: number) {
    return this.updateStatus(id, { status: 'active' }, actorId);
  }

  getRoles() {
    return this.repo.getRoles();
  }

  async getMembers(id: number, userId?: number) {
    await this.getById(id, userId);
    return this.repo.getMembers(id);
  }

  async addMember(id: number, dto: CreateMemberBodyDto, actorId?: number) {
    await this.getById(id, actorId);
    try {
      return await this.repo.addMember(id, dto, actorId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Duplicate')) throw new ValidationError('User is already a member of this organization');
      throw err;
    }
  }

  async updateMember(id: number, memberId: number, dto: UpdateMemberBodyDto, userId?: number) {
    await this.getById(id, userId);
    const member = await this.repo.updateMember(id, memberId, dto);
    if (!member) throw new NotFoundError('Member not found');
    return member;
  }

  async removeMember(id: number, memberId: number, userId?: number) {
    await this.getById(id, userId);
    const ok = await this.repo.removeMember(id, memberId);
    if (!ok) throw new NotFoundError('Member not found');
    return { removed: true };
  }

  async getDomains(id: number, userId?: number) {
    await this.getById(id, userId);
    return this.repo.getDomains(id);
  }

  async addDomain(id: number, dto: CreateDomainBodyDto, userId?: number) {
    await this.getById(id, userId);
    try {
      return await this.repo.addDomain(id, dto);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Duplicate')) throw new ValidationError('Domain already registered');
      throw err;
    }
  }

  async updateDomain(id: number, domainId: number, dto: UpdateDomainBodyDto, userId?: number) {
    await this.getById(id, userId);
    const domain = await this.repo.updateDomain(id, domainId, dto);
    if (!domain) throw new NotFoundError('Domain not found');
    return domain;
  }

  async deleteDomain(id: number, domainId: number, userId?: number) {
    await this.getById(id, userId);
    const ok = await this.repo.deleteDomain(id, domainId);
    if (!ok) throw new NotFoundError('Domain not found');
    return { deleted: true };
  }

  async getBranding(id: number, userId?: number) {
    await this.getById(id, userId);
    return this.repo.getBranding(id);
  }

  async updateBranding(id: number, dto: BrandingBodyDto, actorId?: number) {
    await this.getById(id, actorId);
    return this.repo.updateBranding(id, dto, actorId);
  }

  async getPreferences(id: number, userId?: number) {
    await this.getById(id, userId);
    return this.repo.getPreferences(id);
  }

  async updatePreferences(id: number, dto: PreferencesBodyDto, actorId?: number) {
    await this.getById(id, actorId);
    return this.repo.updatePreferences(id, dto.preferences, actorId);
  }

  async getApiKeys(id: number, userId?: number) {
    await this.getById(id, userId);
    return this.repo.getApiKeys(id);
  }

  async createApiKey(id: number, dto: CreateApiKeyBodyDto, actorId?: number) {
    await this.getById(id, actorId);
    return this.repo.createApiKey(id, dto, actorId);
  }

  async revokeApiKey(id: number, keyId: number, userId?: number) {
    await this.getById(id, userId);
    const ok = await this.repo.revokeApiKey(id, keyId);
    if (!ok) throw new NotFoundError('API key not found');
    return { revoked: true };
  }

  async getBilling(id: number, userId?: number) {
    await this.getById(id, userId);
    return this.repo.getBilling(id);
  }

  async updateBilling(id: number, dto: BillingBodyDto, actorId?: number) {
    await this.getById(id, actorId);
    return this.repo.updateBilling(id, dto, actorId);
  }
}
