import type { APIRequestContext } from '@playwright/test';
import { createApiClient } from './api.helper';
import { USERS } from '../data/users';

const cleanupIds: { payments: number[]; merchants: number[]; users: string[] } = {
  payments: [],
  merchants: [],
  users: [],
};

export function trackPayment(id: number): void {
  cleanupIds.payments.push(id);
}

export function trackMerchant(id: number): void {
  cleanupIds.merchants.push(id);
}

export function trackUserEmail(email: string): void {
  cleanupIds.users.push(email);
}

export async function runE2eCleanup(request: APIRequestContext): Promise<void> {
  const api = createApiClient(request);
  const auth = await api.login(USERS.admin.email, USERS.admin.password);

  for (const paymentId of cleanupIds.payments.splice(0)) {
    await api.cleanupPayment(auth.accessToken, auth.organizationId, paymentId);
  }

  cleanupIds.merchants.length = 0;
  cleanupIds.users.length = 0;
}
