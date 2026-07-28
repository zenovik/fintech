import { PermissionRepository } from '../repositories/permission.repository';

export class PermissionService {
  constructor(private readonly repo = new PermissionRepository()) {}

  async list() {
    const permissions = await this.repo.findAll();
    const byModule = await this.repo.findByModule();
    return {
      items: permissions.map((p) => ({
        id: p.id,
        uuid: p.uuid,
        code: p.code,
        name: p.name,
        module: p.module,
        description: p.description,
      })),
      byModule: Object.fromEntries(
        Object.entries(byModule).map(([module, perms]) => [
          module,
          perms.map((p) => ({ id: p.id, code: p.code, name: p.name, description: p.description })),
        ]),
      ),
    };
  }
}
