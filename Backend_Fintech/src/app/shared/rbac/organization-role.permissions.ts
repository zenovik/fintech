import { ALL_PERMISSION_CODES } from '../rbac/permissions';

const READ_SUFFIX = ':read';
const EXPORT_SUFFIX = ':export';

const WRITE_SUFFIXES = [':write', ':approve', ':resolve', ':delete', ':manage'] as const;

/** Permissions granted by org membership role (applied as cap on global RBAC). */
export function filterPermissionsByOrgRole(
  globalPermissions: string[],
  organizationRoleCode: string,
): string[] {
  if (globalPermissions.includes('*')) {
    return globalPermissions;
  }

  if (organizationRoleCode === 'owner' || organizationRoleCode === 'admin') {
    return globalPermissions;
  }

  if (organizationRoleCode === 'viewer') {
    return globalPermissions.filter(
      (p) => p.endsWith(READ_SUFFIX) || p.endsWith(EXPORT_SUFFIX),
    );
  }

  if (organizationRoleCode === 'member') {
    return globalPermissions.filter(
      (p) => !WRITE_SUFFIXES.some((suffix) => p.endsWith(suffix))
        || p.endsWith(READ_SUFFIX)
        || p.endsWith(EXPORT_SUFFIX),
    );
  }

  return globalPermissions.filter(
    (p) => p.endsWith(READ_SUFFIX) || p.endsWith(EXPORT_SUFFIX),
  );
}

export function orgRoleAllowsPermission(
  organizationRoleCode: string | undefined,
  permission: string,
): boolean {
  if (!organizationRoleCode) return true;
  const allowed = filterPermissionsByOrgRole(ALL_PERMISSION_CODES as unknown as string[], organizationRoleCode);
  return allowed.includes('*') || allowed.includes(permission);
}
