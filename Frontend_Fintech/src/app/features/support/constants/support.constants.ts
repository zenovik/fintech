export const SUPPORT_API = { BASE: '/support', STATISTICS: '/support/statistics' } as const;
export const DEFAULT_PAGE_SIZE = 20;

export const TICKET_STATUS_OPTIONS = [
  { key: '', label: 'All Statuses' },
  { key: 'open', label: 'Open' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'waiting_customer', label: 'Waiting Customer' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
  { key: 'cancelled', label: 'Cancelled' },
] as const;

export const TICKET_PRIORITY_OPTIONS = [
  { key: '', label: 'All Priorities' },
  { key: 'low', label: 'Low' },
  { key: 'medium', label: 'Medium' },
  { key: 'high', label: 'High' },
  { key: 'urgent', label: 'Urgent' },
] as const;

export const TICKET_PRIORITY_CREATE = [
  { key: 'low', label: 'Low' },
  { key: 'medium', label: 'Medium' },
  { key: 'high', label: 'High' },
  { key: 'urgent', label: 'Urgent' },
] as const;
