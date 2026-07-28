export const ORGANIZATIONS_API = {
  BASE: '/organizations',
  MINE: '/organizations/mine',
  ROLES: '/organizations/roles',
} as const;

export const ORGANIZATION_ROUTES = {
  LIST: '/organizations',
  CREATE: '/organizations/create',
  DETAILS: '/organizations',
} as const;

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50];

export const ORG_STATUS_OPTIONS = [
  { key: '', label: 'All Statuses' },
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'archived', label: 'Archived' },
] as const;

export const ORG_DETAIL_TABS = [
  { key: 'overview', label: 'Overview', icon: 'info' },
  { key: 'members', label: 'Members', icon: 'group' },
  { key: 'branding', label: 'Branding', icon: 'palette' },
  { key: 'domains', label: 'Domains', icon: 'language' },
  { key: 'api-keys', label: 'API Keys', icon: 'key' },
  { key: 'preferences', label: 'Preferences', icon: 'tune' },
  { key: 'billing', label: 'Billing', icon: 'payments' },
] as const;

export const ORG_STORAGE_KEY = 'mp_current_organization_id';
