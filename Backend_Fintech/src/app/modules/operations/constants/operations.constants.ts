export const ALERT_SEVERITIES = ['info', 'warning', 'error', 'critical'] as const;
export const ALERT_STATUSES = ['active', 'acknowledged', 'resolved'] as const;
export const INCIDENT_STATUSES = ['open', 'investigating', 'mitigated', 'resolved', 'closed'] as const;
export const INCIDENT_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
export const RETRY_STATUSES = ['pending', 'processing', 'completed', 'failed', 'cancelled'] as const;
export const JOB_STATUSES = ['queued', 'running', 'completed', 'failed', 'cancelled'] as const;
