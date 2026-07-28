export const SEED_PASSWORD = 'Password123!';

export const ORG = {
  merchantPro: 1,
  secondOrg: 2,
};

export const MERCHANT = {
  org1Active: 1,
  org1Active2: 7,
};

export const CUSTOMER = {
  org1: 8,
};

export const PAYMENT_METHOD = 'credit_card';

export const USERS = {
  admin: { email: 'admin@merchantpro.com', password: SEED_PASSWORD, orgId: ORG.merchantPro },
  finance: { email: 'finance@merchantpro.com', password: SEED_PASSWORD, orgId: ORG.merchantPro },
};
