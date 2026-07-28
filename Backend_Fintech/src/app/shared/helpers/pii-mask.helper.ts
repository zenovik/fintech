const SENSITIVE_KEYS = new Set([
  'password', 'token', 'secret', 'authorization', 'cookie', 'refreshToken',
  'client_secret', 'api_key', 'apiKey', 'smtp', 'credit_card', 'cvv', 'ssn',
]);

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const CARD_PATTERN = /\b(?:\d[ -]*?){13,19}\b/g;

export function maskEmail(value: string): string {
  return value.replace(EMAIL_PATTERN, (email) => {
    const [local, domain] = email.split('@');
    if (!domain) return '***@***';
    return `${local.slice(0, 2)}***@${domain}`;
  });
}

export function maskPiiInString(value: string): string {
  return maskEmail(value.replace(CARD_PATTERN, '****-****-****-****'));
}

export function maskSensitiveObject(input: unknown, depth = 0): unknown {
  if (depth > 5 || input == null) return input;
  if (typeof input === 'string') return maskPiiInString(input);
  if (Array.isArray(input)) return input.map((v) => maskSensitiveObject(v, depth + 1));
  if (typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(input as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        out[key] = '***REDACTED***';
      } else {
        out[key] = maskSensitiveObject(val, depth + 1);
      }
    }
    return out;
  }
  return input;
}

export function isSensitiveRoute(path: string): boolean {
  const lower = path.toLowerCase();
  return lower.includes('/auth/login')
    || lower.includes('/auth/register')
    || lower.includes('/auth/reset')
    || lower.includes('/settings/smtp')
    || lower.includes('/checkout');
}
