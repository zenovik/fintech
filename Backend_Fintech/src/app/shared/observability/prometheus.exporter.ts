/**
 * Prometheus-compatible metrics exposition format.
 */
import { getMetricsSnapshot } from './metrics.registry';

export function renderPrometheusMetrics(): string {
  const snapshot = getMetricsSnapshot();
  const lines: string[] = [];
  for (const [name, data] of Object.entries(snapshot)) {
    if (typeof data !== 'object' || data === null) continue;
    const d = data as { total?: number; success?: number; failed?: number; avgDurationMs?: number };
    const metric = name.replace(/[^a-zA-Z0-9_]/g, '_');
    if (d.total !== undefined) lines.push(`fintech_${metric}_total ${d.total}`);
    if (d.success !== undefined) lines.push(`fintech_${metric}_success ${d.success}`);
    if (d.failed !== undefined) lines.push(`fintech_${metric}_failed ${d.failed}`);
    if (d.avgDurationMs !== undefined) lines.push(`fintech_${metric}_avg_duration_ms ${d.avgDurationMs}`);
  }
  lines.push(`fintech_process_up 1`);
  return lines.join('\n') + '\n';
}
