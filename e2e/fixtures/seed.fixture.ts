import { test as base } from '@playwright/test';
import path from 'node:path';
import { USERS } from '../data/users';
import { loginViaUi } from '../helpers/auth.helper';
import { createApiClient } from '../helpers/api.helper';
import { MERCHANT, CUSTOMER } from '../data/constants';
import { uniqueRef } from '../utils/unique';
import { trackPayment } from '../helpers/cleanup.helper';

export interface SeededMerchant {
  id: number;
  legalName: string;
}

export interface SeededPayment {
  id: number;
  intentRef: string;
  merchantOrderId: string;
}

export interface SeededCustomer {
  id: number;
}

type SeedFixtures = {
  seededMerchant: SeededMerchant;
  seededPayment: SeededPayment;
  seededCustomer: SeededCustomer;
};

async function bootstrapAuth(browser: import('@playwright/test').Browser, userKey: keyof typeof USERS) {
  const user = USERS[userKey];
  const storagePath = path.join(process.cwd(), 'e2e', '.auth', `${user.key}.json`);
  const context = await browser.newContext();
  const page = await context.newPage();
  await loginViaUi(page, user);
  await context.storageState({ path: storagePath });
  await context.close();
  return storagePath;
}

export const seedTest = base.extend<SeedFixtures>({
  storageState: async ({ browser }, use) => {
    const storagePath = await bootstrapAuth(browser, 'admin');
    await use(storagePath);
  },

  seededMerchant: async ({ request, adminAuth }, use) => {
    const api = createApiClient(request);
    const result = await api.createMerchant(adminAuth.accessToken, adminAuth.organizationId);
    const merchant = {
      id: result.body.data?.id ?? result.body.data?.merchant?.id,
      legalName: result.legalName,
    };
    await use(merchant);
  },

  seededPayment: async ({ request, adminAuth }, use) => {
    const api = createApiClient(request);
    const orderId = uniqueRef('E2E-SEED-PAY');
    const created = await api.createPayment(adminAuth.accessToken, adminAuth.organizationId, {
      amount: 42.5,
      merchantOrderId: orderId,
    });
    const intent = created.body.data?.intent ?? created.body.data;
    const payment = {
      id: intent.id,
      intentRef: intent.intentRef,
      merchantOrderId: orderId,
    };
    trackPayment(payment.id);
    await use(payment);
  },

  seededCustomer: async ({}, use) => {
    await use({ id: CUSTOMER.org1 });
  },
});

export { MERCHANT, CUSTOMER };
