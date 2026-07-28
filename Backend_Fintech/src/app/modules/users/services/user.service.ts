import { UserAdminRepository, UserRow } from '../repositories/user.repository';
import { NotFoundError, ValidationError } from '../../../shared/exceptions/app.exception';
import { PasswordService } from '../../auth/services/password.service';
import { emailExists } from '../../auth/repositories/user.repository';
import { PermissionRepository } from '../../../shared/rbac/permission.repository';
import { auditRecorder } from '../../audit';
import {
  AssignUserRolesBodyDto,
  CreateUserBodyDto,
  UpdateUserBodyDto,
  UpdateUserStatusBodyDto,
  UserListQueryDto,
} from '../dto';

function mapUser(row: UserRow) {
  const roleIds = row.role_ids ? row.role_ids.split(',').map(Number) : [];
  const roles = row.role_names ? row.role_names.split(', ') : [];
  return {
    id: row.id,
    uuid: row.uuid,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: `${row.first_name} ${row.last_name}`,
    phoneNumber: row.phone_number,
    status: row.status,
    mfaEnabled: row.mfa_enabled === 1,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    roles: roles.map((name, i) => ({ id: roleIds[i], name })),
    roleIds,
  };
}

export class UserAdminService {
  constructor(
    private readonly repo = new UserAdminRepository(),
    private readonly passwordService = new PasswordService(),
    private readonly permissionRepo = new PermissionRepository(),
  ) {}

  async list(query: UserListQueryDto) {
    const { items, total } = await this.repo.findAll(query);
    return {
      items: items.map(mapUser),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) || 1 },
    };
  }

  async getById(id: number) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('User not found');
    const [activity, loginHistory, permissions] = await Promise.all([
      this.repo.findActivityLogs(id),
      this.repo.findLoginHistory(id),
      this.permissionRepo.getPermissionCodesForUser(id),
    ]);
    return {
      ...mapUser(row),
      permissions: permissions.includes('*') ? ['*'] : permissions,
      activity: activity.map((a) => ({
        uuid: a['uuid'],
        action: a['action'],
        resourceType: a['resource_type'],
        resourceId: a['resource_id'],
        ipAddress: a['ip_address'],
        createdAt: a['created_at'],
      })),
      loginHistory: loginHistory.map((l) => ({
        email: l['email_attempted'],
        ipAddress: l['ip_address'],
        success: Boolean(l['success']),
        failureReason: l['failure_reason'],
        createdAt: l['created_at'],
      })),
    };
  }

  async create(dto: CreateUserBodyDto, actorId?: number) {
    await this.repo.releaseSoftDeletedEmail(dto.email);
    if (await emailExists(dto.email)) throw new ValidationError('Email already in use');
    this.passwordService.validatePolicy(dto.password);
    const hash = await this.passwordService.hash(dto.password);
    const id = await this.repo.create(dto, hash, actorId);
    await this.repo.logActivity(id, 'user.created', actorId, { email: dto.email });
    void auditRecorder.userCreate(id, dto.email, { userId: actorId }).catch(() => {});
    return this.getById(id);
  }

  async update(id: number, dto: UpdateUserBodyDto, actorId?: number) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('User not found');
    if (dto.email && dto.email.toLowerCase() !== existing.email && await emailExists(dto.email)) {
      throw new ValidationError('Email already in use');
    }
    await this.repo.update(id, dto);
    await this.repo.logActivity(id, 'user.updated', actorId);
    void auditRecorder.userUpdate(id, { email: existing.email }, dto as Record<string, unknown>, { userId: actorId }).catch(() => {});
    return this.getById(id);
  }

  async updateStatus(id: number, dto: UpdateUserStatusBodyDto, actorId?: number) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('User not found');
    await this.repo.updateStatus(id, dto);
    await this.repo.logActivity(id, 'user.status_changed', actorId, { status: dto.status, reason: dto.reason });
    return this.getById(id);
  }

  async remove(id: number, actorId?: number) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('User not found');
    await this.repo.softDelete(id);
    await this.repo.logActivity(id, 'user.deleted', actorId);
    void auditRecorder.userDelete(id, { userId: actorId }).catch(() => {});
    return { message: 'User deleted successfully' };
  }

  async assignRoles(id: number, dto: AssignUserRolesBodyDto, actorId?: number) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('User not found');
    await this.repo.setRoles(id, dto.roleIds, actorId);
    await this.repo.logActivity(id, 'user.roles_assigned', actorId, { roleIds: dto.roleIds });
    void auditRecorder.roleChange(id, existing.role_ids, dto.roleIds, { userId: actorId }).catch(() => {});
    return this.getById(id);
  }
}
