import { getOrganizationId } from '../../../shared/context/org-context';
import { NotFoundError, ValidationError } from '../../../shared/exceptions/app.exception';
import { PermissionRepository } from '../../../shared/rbac/permission.repository';
import { applyMerchantRoleCap, getMerchantRolePermissions } from '../../../shared/rbac/merchant-role.permissions';
import { filterPermissionsByOrgRole } from '../../../shared/rbac/organization-role.permissions';
import { PasswordService } from '../../auth/services/password.service';
import { auditRecorder } from '../../audit';
import { notificationDispatch } from '../../notifications';
import { MerchantUserRepository, MerchantUserRow } from '../repositories/merchant-user.repository';
import {
  AssignOutletsBodyDto, AssignRoleBodyDto, CreateMerchantUserBodyDto,
  InviteMerchantUserBodyDto, MerchantUserListQueryDto, UpdateMerchantUserBodyDto,
} from '../dto';

function mapUser(row: MerchantUserRow, outletIds: number[] = []) {
  return {
    id: row.id,
    uuid: row.uuid,
    userId: row.user_id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: `${row.first_name} ${row.last_name}`,
    organizationId: row.organization_id,
    organizationName: row.organization_name ?? null,
    merchantId: row.merchant_id,
    merchantName: row.merchant_name ?? null,
    merchantRoleId: row.merchant_role_id,
    roleCode: row.role_code ?? null,
    roleName: row.role_name ?? null,
    defaultOutletId: row.default_outlet_id,
    accessScope: row.access_scope,
    outletIds,
    status: row.status,
    invitedAt: row.invited_at,
    activatedAt: row.activated_at,
    createdAt: row.created_at,
  };
}

export class MerchantUserService {
  constructor(
    private readonly repo = new MerchantUserRepository(),
    private readonly passwordService = new PasswordService(),
    private readonly permissionRepo = new PermissionRepository(),
  ) {}

  async listRoles() {
    const rows = await this.repo.findRoles();
    return rows.map((r) => ({
      id: Number(r.id),
      code: r.code as string,
      name: r.name as string,
      description: r.description as string | null,
    }));
  }

  async list(query: MerchantUserListQueryDto) {
    const { items, total } = await this.repo.findAll(query);
    const mapped = await Promise.all(items.map(async (row) => {
      const outletIds = await this.repo.getOutletIds(row.id);
      return mapUser(row, outletIds);
    }));
    return {
      items: mapped,
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) || 1 },
    };
  }

  async getById(id: number) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('Merchant user not found');
    const outletIds = await this.repo.getOutletIds(id);
    return mapUser(row, outletIds);
  }

  async create(dto: CreateMerchantUserBodyDto, actorId?: number) {
    if (await this.repo.emailExists(dto.email)) {
      throw new ValidationError('Email already in use');
    }
    this.passwordService.validatePolicy(dto.password);
    const hash = await this.passwordService.hash(dto.password);
    const userId = await this.repo.createUserRecord(dto.email, dto.firstName, dto.lastName, hash, actorId);
    const id = await this.repo.createMembership(dto, userId, actorId);
    const user = await this.getById(id);

    void auditRecorder.record({
      module: 'merchant_users', categoryCode: 'users', actionCode: 'merchant_user_create',
      entityType: 'merchant_user', entityId: String(id),
      description: `Created merchant user ${dto.email}.`,
      afterValues: { merchantId: dto.merchantId, roleId: dto.merchantRoleId },
      riskLevel: 'low',
    }, { userId: actorId }).catch(() => {});

    return user;
  }

  async invite(dto: InviteMerchantUserBodyDto, actorId?: number) {
    let userId = await this.repo.findUserIdByEmail(dto.email);
    if (!userId) {
      const pwd = dto.password ?? 'Password123!';
      this.passwordService.validatePolicy(pwd);
      const hash = await this.passwordService.hash(pwd);
      userId = await this.repo.createUserRecord(dto.email, dto.firstName, dto.lastName, hash, actorId);
    }
    const id = await this.repo.inviteMembership(dto, userId, actorId);
    const user = await this.getById(id);

    void notificationDispatch.dispatch({
      userId,
      eventCode: 'merchant_user_invited',
      body: `You have been invited to ${user.merchantName} as ${user.roleName}.`,
      category: 'merchant',
      actionUrl: '/merchant-users',
      actionLabel: 'View Invitation',
      relatedEntityType: 'merchant_user',
      relatedEntityId: id,
    }).catch(() => {});

    void auditRecorder.record({
      module: 'merchant_users', categoryCode: 'users', actionCode: 'merchant_user_create',
      entityType: 'merchant_user', entityId: String(id),
      description: `Invited merchant user ${dto.email}.`,
      riskLevel: 'low',
    }, { userId: actorId }).catch(() => {});

    return user;
  }

  async update(id: number, dto: UpdateMerchantUserBodyDto, actorId?: number) {
    const before = await this.getById(id);
    await this.repo.update(id, dto, actorId);
    const after = await this.getById(id);

    if (dto.merchantRoleId && dto.merchantRoleId !== before.merchantRoleId) {
      void auditRecorder.record({
        module: 'merchant_users', categoryCode: 'users', actionCode: 'merchant_role_change',
        entityType: 'merchant_user', entityId: String(id),
        description: `Changed role for merchant user #${id}.`,
        beforeValues: { roleId: before.merchantRoleId },
        afterValues: { roleId: after.merchantRoleId },
        riskLevel: 'medium',
      }, { userId: actorId }).catch(() => {});

      void notificationDispatch.dispatch({
        userId: after.userId,
        eventCode: 'merchant_role_changed',
        body: `Your role has been updated to ${after.roleName}.`,
        category: 'merchant',
        relatedEntityType: 'merchant_user',
        relatedEntityId: id,
      }).catch(() => {});
    }

    return after;
  }

  async activate(id: number, actorId?: number) {
    const user = await this.getById(id);
    await this.repo.updateStatus(id, 'active', actorId);
    const after = await this.getById(id);

    void auditRecorder.record({
      module: 'merchant_users', categoryCode: 'users', actionCode: 'merchant_user_activate',
      entityType: 'merchant_user', entityId: String(id),
      description: `Activated merchant user ${user.email}.`,
      riskLevel: 'medium',
    }, { userId: actorId }).catch(() => {});

    void notificationDispatch.dispatch({
      userId: after.userId,
      eventCode: 'merchant_user_activated',
      body: `Your ${after.merchantName} account is now active.`,
      category: 'merchant',
      actionUrl: '/dashboard',
      actionLabel: 'Go to Dashboard',
    }).catch(() => {});

    return after;
  }

  async deactivate(id: number, actorId?: number) {
    await this.getById(id);
    await this.repo.updateStatus(id, 'inactive', actorId);
    return this.getById(id);
  }

  async assignRole(id: number, dto: AssignRoleBodyDto, actorId?: number) {
    return this.update(id, { merchantRoleId: dto.merchantRoleId }, actorId);
  }

  async assignOutlets(id: number, dto: AssignOutletsBodyDto, actorId?: number) {
    await this.getById(id);
    await this.repo.replaceOutlets(id, dto.outletIds, actorId);
    if (dto.accessScope || dto.defaultOutletId) {
      await this.repo.update(id, {
        accessScope: dto.accessScope,
        defaultOutletId: dto.defaultOutletId,
      }, actorId);
    }

    void auditRecorder.record({
      module: 'merchant_users', categoryCode: 'users', actionCode: 'outlet_assigned',
      entityType: 'merchant_user', entityId: String(id),
      description: `Assigned ${dto.outletIds.length} outlet(s) to merchant user #${id}.`,
      afterValues: { outletIds: dto.outletIds },
      riskLevel: 'low',
    }, { userId: actorId }).catch(() => {});

    return this.getById(id);
  }

  async resetPassword(id: number, password: string, actorId?: number) {
    const user = await this.getById(id);
    this.passwordService.validatePolicy(password);
    const hash = await this.passwordService.hash(password);
    await this.repo.resetPassword(user.userId, hash);
    return { message: 'Password reset successfully' };
  }

  async getMyContext(userId: number, orgRoleCode?: string) {
    const orgId = getOrganizationId();
    const memberships = await this.repo.findMembershipsForUser(userId, orgId);
    const globalPermissions = await this.permissionRepo.getPermissionCodesForUser(userId);
    let effectivePermissions = orgRoleCode
      ? filterPermissionsByOrgRole(globalPermissions, orgRoleCode)
      : globalPermissions;

    const primary = memberships[0];
    if (primary && !globalPermissions.includes('*')) {
      const merchantPerms = await getMerchantRolePermissions(primary.role_code as string);
      effectivePermissions = applyMerchantRoleCap(effectivePermissions, primary.role_code as string, merchantPerms);
    }

    return {
      memberships: await Promise.all(memberships.map(async (m) => ({
        merchantUserId: Number(m.id),
        merchantId: Number(m.merchant_id),
        merchantName: m.merchant_name as string,
        organizationId: Number(m.organization_id),
        roleCode: m.role_code as string,
        roleName: m.role_name as string,
        accessScope: m.access_scope as string,
        defaultOutletId: m.default_outlet_id ? Number(m.default_outlet_id) : null,
        outletIds: await this.repo.getOutletIds(Number(m.id)),
      }))),
      permissions: effectivePermissions.includes('*') ? ['*'] : effectivePermissions,
    };
  }
}
