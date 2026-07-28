import { SEED_PASSWORD } from './constants';

export interface TestUser {
  key: string;
  email: string;
  password: string;
  orgId: number;
  role: string;
}

export const USERS: Record<string, TestUser> = {
  admin: {
    key: 'admin',
    email: 'admin@merchantpro.com',
    password: SEED_PASSWORD,
    orgId: 1,
    role: 'Super Admin',
  },
  merchantAdmin: {
    key: 'merchantAdmin',
    email: 'merchant.mgr@merchantpro.com',
    password: SEED_PASSWORD,
    orgId: 1,
    role: 'Merchant Manager',
  },
  operator: {
    key: 'operator',
    email: 'operations@merchantpro.com',
    password: SEED_PASSWORD,
    orgId: 1,
    role: 'Operations Manager',
  },
  support: {
    key: 'support',
    email: 'support@merchantpro.com',
    password: SEED_PASSWORD,
    orgId: 1,
    role: 'Support Agent',
  },
  readonly: {
    key: 'readonly',
    email: 'readonly@merchantpro.com',
    password: SEED_PASSWORD,
    orgId: 1,
    role: 'Read Only',
  },
};
