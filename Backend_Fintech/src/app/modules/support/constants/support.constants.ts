export const TICKET_STATUSES = ['open', 'assigned', 'in_progress', 'waiting_customer', 'resolved', 'closed', 'cancelled'] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_CATEGORIES = ['general', 'payments', 'invoices', 'subscriptions', 'qr_payments', 'refunds', 'payouts', 'merchants', 'technical'] as const;

export const SLA_HOURS_BY_PRIORITY: Record<TicketPriority, number> = {
  low: 72,
  medium: 24,
  high: 8,
  urgent: 4,
};

export function computeSlaDueAt(priority: TicketPriority, from = new Date()): Date {
  const hours = SLA_HOURS_BY_PRIORITY[priority];
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}

export function formatDateTime(d: Date): string {
  return d.toISOString().slice(0, 19).replace('T', ' ');
}
