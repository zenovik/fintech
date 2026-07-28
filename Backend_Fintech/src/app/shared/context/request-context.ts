import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContextStore {
  requestId: string;
  userId?: number;
  organizationId?: number;
  route?: string;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContextStore>();

export function getRequestId(): string | undefined {
  return requestContextStorage.getStore()?.requestId;
}

export function getRequestContext(): RequestContextStore | undefined {
  return requestContextStorage.getStore();
}

export function patchRequestContext(patch: Partial<RequestContextStore>): void {
  const store = requestContextStorage.getStore();
  if (!store) return;
  Object.assign(store, patch);
}
