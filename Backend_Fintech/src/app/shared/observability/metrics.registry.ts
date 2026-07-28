export interface MetricCounter {
  total: number;
  success: number;
  failed: number;
  totalDurationMs: number;
}

const counters = new Map<string, MetricCounter>();

function getCounter(name: string): MetricCounter {
  let c = counters.get(name);
  if (!c) {
    c = { total: 0, success: 0, failed: 0, totalDurationMs: 0 };
    counters.set(name, c);
  }
  return c;
}

export function recordMetric(name: string, success: boolean, durationMs: number, reason?: string): void {
  const c = getCounter(name);
  c.total += 1;
  c.totalDurationMs += durationMs;
  if (success) c.success += 1;
  else c.failed += 1;
  if (reason) {
    const reasonKey = `${name}:reason:${reason}`;
    getCounter(reasonKey).total += 1;
  }
}

export function getMetricsSnapshot(): Record<string, unknown> {
  const snapshot: Record<string, unknown> = {};
  for (const [name, c] of counters) {
    snapshot[name] = {
      total: c.total,
      success: c.success,
      failed: c.failed,
      avgDurationMs: c.total > 0 ? Math.round(c.totalDurationMs / c.total) : 0,
    };
  }
  return snapshot;
}

export function resetMetrics(): void {
  counters.clear();
}
