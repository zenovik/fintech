import { MERCHANT } from './constants';

export const SEEDED_MERCHANTS = {
  primary: {
    id: MERCHANT.org1Active,
    displayName: 'MerchantPro Demo Store',
  },
  secondary: {
    id: MERCHANT.org1Active2,
    displayName: 'Velocity Global Retail',
  },
} as const;
