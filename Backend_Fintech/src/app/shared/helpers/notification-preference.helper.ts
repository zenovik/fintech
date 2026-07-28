const EVENT_TO_PREFERENCE_TYPE: Record<string, string> = {
  password_changed: 'security_alerts',
  mfa_enabled: 'security_alerts',
  broadcast: 'system_announcements',
  system_announcement: 'system_announcements',
  system_alert: 'system_announcements',
  incident_opened: 'system_announcements',
  settlement_completed: 'settlement_reports',
  settlement_failed: 'settlement_reports',
};

export function mapEventCodeToNotificationPreferenceType(eventCode: string): string {
  if (EVENT_TO_PREFERENCE_TYPE[eventCode]) return EVENT_TO_PREFERENCE_TYPE[eventCode];
  if (eventCode.includes('settlement')) return 'settlement_reports';
  if (eventCode.includes('security') || eventCode.includes('mfa') || eventCode.includes('password')) {
    return 'security_alerts';
  }
  if (eventCode.startsWith('system_') || eventCode.startsWith('incident_')) return 'system_announcements';
  return 'transaction_updates';
}
