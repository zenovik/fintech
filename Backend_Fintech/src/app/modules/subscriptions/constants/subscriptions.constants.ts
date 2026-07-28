export const SUBSCRIPTION_STATUSES = ['active', 'paused', 'cancelled', 'failed', 'renewed'] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];
export const BILLING_INTERVALS = ['monthly', 'quarterly', 'yearly'] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];
export const PLAN_STATUSES = ['active', 'inactive'] as const;
export const DEFAULT_PAGE_SIZE = 10;

export function addBillingInterval(date: Date, interval: BillingInterval): Date {
  const d = new Date(date);
  if (interval === 'monthly') d.setMonth(d.getMonth() + 1);
  else if (interval === 'quarterly') d.setMonth(d.getMonth() + 3);
  else d.setFullYear(d.getFullYear() + 1);
  return d;
}

export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
