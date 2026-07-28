import { RoleRepository, RoleRow } from '../repositories/role.repository';
import { NotFoundError, ValidationError, ForbiddenError } from '../../../shared/exceptions/app.exception';
import { AssignRolePermissionsBodyDto, CreateRoleBodyDto, RoleListQueryDto, UpdateRoleBodyDto } from '../dto';

function mapRole(row: RoleRow, permissionIds: number[] = []) {
  return {
    id: row.id,
    uuid: row.uuid,
    code: row.code,
    name: row.name,
    description: row.description,
    isSystem: row.is_system === 1,
    userCount: Number(row.user_count),
    permissionCount: Number(row.permission_count),
    permissionIds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class RoleService {
  constructor(private readonly repo = new RoleRepository()) {}

  async list(query: RoleListQueryDto) {
    const items = await this.repo.findAll(query);
    return { items: items.map((r) => mapRole(r)) };
  }

  async getById(id: number) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('Role not found');
    const permissionIds = await this.repo.findPermissionIds(id);
    return mapRole(row, permissionIds);
  }

  async create(dto: CreateRoleBodyDto, actorId?: number) {
    await this.repo.releaseSoftDeletedCode(dto.code);
    if (await this.repo.codeExists(dto.code)) throw new ValidationError('Role code already exists');
    const id = await this.repo.create(dto, actorId);
    return this.getById(id);
  }

  async update(id: number, dto: UpdateRoleBodyDto, actorId?: number) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('Role not found');
    await this.repo.update(id, dto, actorId);
    return this.getById(id);
  }

  async remove(id: number) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('Role not found');
    if (row.is_system === 1) throw new ForbiddenError('System roles cannot be deleted');
    await this.repo.softDelete(id);
    return { message: 'Role deleted successfully' };
  }

  async assignPermissions(id: number, dto: AssignRolePermissionsBodyDto, actorId?: number) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('Role not found');
    await this.repo.setPermissions(id, dto.permissionIds, actorId);
    return this.getById(id);
  }
}
