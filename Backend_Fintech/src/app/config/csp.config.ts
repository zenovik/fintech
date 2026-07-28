import { env } from './env';

function resolveCorsOrigins(): string[] {
  const raw = env.corsOrigin.trim();
  if (raw.includes(',')) {
    return raw.split(',').map((entry) => entry.trim()).filter(Boolean);
  }
  return [raw];
}

function parseExtraOrigins(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw.split(',').map((entry) => entry.trim()).filter(Boolean);
}

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/$/, '');
}

export function buildContentSecurityPolicyDirectives(): Record<string, string[]> {
  const originList = resolveCorsOrigins();
  const connectSources = new Set<string>(["'self'"]);
  for (const origin of originList) {
    if (origin) {
      connectSources.add(normalizeOrigin(origin));
    }
  }
  for (const extra of parseExtraOrigins(env.security.cspConnectSrcExtra)) {
    connectSources.add(normalizeOrigin(extra));
  }

  if (env.nodeEnv !== 'production') {
    connectSources.add('http://localhost:4200');
    connectSources.add('http://127.0.0.1:4200');
    connectSources.add('ws://localhost:4200');
    connectSources.add('ws://127.0.0.1:4200');
  }

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'object-src': ["'none'"],
    'script-src': ["'self'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'font-src': ["'self'", 'data:'],
    'img-src': ["'self'", 'data:', 'blob:'],
    'connect-src': [...connectSources],
  };

  if (env.security.cspReportUri) {
    directives['report-uri'] = [env.security.cspReportUri];
  }

  return directives;
}

export function isContentSecurityPolicyEnabled(): boolean {
  if (!env.security.cspEnabled) return false;
  if (env.nodeEnv !== 'production' && env.security.cspDevMode === 'off') return false;
  return true;
}

export function buildAngularContentSecurityPolicy(): string {
  const directives = buildContentSecurityPolicyDirectives();
  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}
