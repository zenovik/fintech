import { env } from './env';

const PLACEHOLDER_PATTERNS = ['change-this', 'changeme', 'replace-with'];
const MIN_SECRET_LENGTH = 32;

function isPlaceholder(value: string): boolean {
  const lower = value.toLowerCase();
  return PLACEHOLDER_PATTERNS.some((pattern) => lower.includes(pattern));
}

export function validateProductionEnv(): void {
  if (!Number.isFinite(env.port) || env.port <= 0) {
    throw new Error('Startup blocked: PORT must be a positive number.');
  }

  if (env.nodeEnv !== 'production') {
    return;
  }

  const errors: string[] = [];

  const requiredSecrets = [
    { name: 'DB_PASSWORD', value: env.db.password },
    { name: 'JWT_SECRET', value: env.jwt.secret },
    { name: 'JWT_REFRESH_SECRET', value: env.jwt.refreshSecret },
    { name: 'CONFIG_ENCRYPTION_KEY', value: env.secrets.configEncryptionKey },
  ];

  for (const secret of requiredSecrets) {
    if (!secret.value || isPlaceholder(secret.value)) {
      errors.push(`${secret.name} is missing or uses a placeholder value`);
      continue;
    }

    if (secret.value.length < MIN_SECRET_LENGTH) {
      errors.push(`${secret.name} must be at least ${MIN_SECRET_LENGTH} characters in production`);
    }
  }

  if (!env.corsOrigin.trim()) {
    errors.push('CORS_ORIGIN is required in production');
  }

  if (env.logLevel === 'debug') {
    console.warn('[startup] LOG_LEVEL=debug in production is not recommended');
  }

  if (errors.length > 0) {
    throw new Error(`Production startup blocked:\n- ${errors.join('\n- ')}`);
  }
}
