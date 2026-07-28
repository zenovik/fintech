import { AsyncLocalStorage } from 'async_hooks';

export interface OrganizationContextStore {
  organizationId: number;
  organizationRoleCode: string;
}

export const orgContextStorage = new AsyncLocalStorage<OrganizationContextStore>();

export function getOrganizationId(): number | undefined {
  return orgContextStorage.getStore()?.organizationId;
}

export function getOrganizationRoleCode(): string | undefined {
  return orgContextStorage.getStore()?.organizationRoleCode;
}

export function appendOrgFilter(
  conditions: string[],
  params: unknown[],
  column: string,
): void {
  const orgId = getOrganizationId();
  if (orgId) {
    conditions.push(`${column} = ?`);
    params.push(orgId);
  }
}

export function appendMerchantOrgFilter(
  conditions: string[],
  params: unknown[],
  merchantAlias = 'm',
): void {
  appendOrgFilter(conditions, params, `${merchantAlias}.organization_id`);
}
