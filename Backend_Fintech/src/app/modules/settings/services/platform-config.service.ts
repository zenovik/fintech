import { getOrganizationId } from '../../../shared/context/org-context';
import { auditRecorder } from '../../audit';
import { PlatformConfigRepository } from '../repositories/platform-config.repository';

export class PlatformConfigService {
  constructor(private readonly repo = new PlatformConfigRepository()) {}

  async list(group?: string) {
    return (await this.repo.findAll(group)).map((r) => ({
      key: r.config_key, group: r.config_group,
      value: typeof r.config_value === 'string' ? JSON.parse(r.config_value) : r.config_value,
      organizationId: r.organization_id, description: r.description, updatedAt: r.updated_at,
    }));
  }

  async update(key: string, group: string, value: unknown, actorId?: number) {
    const orgId = getOrganizationId();
    await this.repo.upsert(key, group, value, actorId, orgId);
    void auditRecorder.record({
      module: 'settings', categoryCode: 'settings', actionCode: 'config_changed',
      entityType: 'platform_config', entityId: key, description: `Updated config ${key}`,
      userId: actorId, riskLevel: 'medium',
    }).catch(() => {});
    return this.list(group);
  }
}
