import { AsyncLocalStorage } from 'async_hooks';

export interface MerchantContextStore {
  merchantId: number;
  merchantRoleCode: string;
  merchantUserId: number;
  accessScope: 'single' | 'multiple' | 'all';
  outletIds: number[];
  defaultOutletId?: number;
}

export const merchantContextStorage = new AsyncLocalStorage<MerchantContextStore>();

export function getMerchantId(): number | undefined {
  return merchantContextStorage.getStore()?.merchantId;
}

export function getMerchantRoleCode(): string | undefined {
  return merchantContextStorage.getStore()?.merchantRoleCode;
}

export function getAccessibleOutletIds(): number[] | undefined {
  return merchantContextStorage.getStore()?.outletIds;
}

export function appendMerchantFilter(
  conditions: string[],
  params: unknown[],
  column: string,
): void {
  const merchantId = getMerchantId();
  if (merchantId) {
    conditions.push(`${column} = ?`);
    params.push(merchantId);
  }
}

export function appendOutletFilter(
  conditions: string[],
  params: unknown[],
  column: string,
): void {
  const outletIds = getAccessibleOutletIds();
  if (outletIds && outletIds.length > 0) {
    conditions.push(`${column} IN (${outletIds.map(() => '?').join(', ')})`);
    params.push(...outletIds);
  }
}
