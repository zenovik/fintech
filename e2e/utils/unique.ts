export function uniqueRef(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}@e2e.test`;
}

export function uniqueBusinessName(prefix: string): string {
  return `${prefix} ${Date.now()}`;
}
