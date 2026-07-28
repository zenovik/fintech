export const SYSTEM_API = {
  HEALTH: '/system/health',
  READINESS: '/system/readiness',
  VERSION: '/system/version',
} as const;

export type SystemIndicatorState = 'green' | 'yellow' | 'red';

export function mapComponentState(state: string): SystemIndicatorState {
  switch (state) {
    case 'up':
    case 'healthy':
      return 'green';
    case 'degraded':
    case 'unknown':
      return 'yellow';
    default:
      return 'red';
  }
}

export function mapBooleanReady(ready: boolean): SystemIndicatorState {
  return ready ? 'green' : 'red';
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds % 60}s`;
}
