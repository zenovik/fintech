export const SEED_PASSWORD = 'Password123!';

export const ORG = {
  merchantPro: 1,
  secondOrg: 2,
} as const;

export const MERCHANT = {
  org1Active: 1,
  org1Active2: 7,
  org2Active: 16,
} as const;

export const CUSTOMER = {
  org1: 8,
} as const;

export const USERS = {
  admin: { email: 'admin@merchantpro.com', orgId: ORG.merchantPro },
  finance: { email: 'finance@merchantpro.com', orgId: ORG.merchantPro },
  readOnly: { email: 'yuki.brown10@merchantpro.com', orgId: ORG.merchantPro },
} as const;

export const PAYMENT_METHOD = 'credit_card';

export function uniqueRef(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}@integration.test`;
}
