import { env } from '../../config';
import { getRequestContext } from '../context/request-context';
import { maskSensitiveObject } from '../helpers/pii-mask.helper';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function shouldLog(level: LogLevel): boolean {
  const configured = (env.logLevel ?? 'debug').toLowerCase() as LogLevel;
  const configuredLevel = LEVEL_ORDER[configured] ?? LEVEL_ORDER.debug;
  return LEVEL_ORDER[level] >= configuredLevel;
}

function buildEntry(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const ctx = getRequestContext();
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    requestId: meta?.requestId ?? ctx?.requestId,
    userId: meta?.userId ?? ctx?.userId,
    organizationId: meta?.organizationId ?? ctx?.organizationId,
    route: meta?.route ?? ctx?.route,
    ...meta,
  };
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;
  const safeMeta = meta ? maskSensitiveObject(meta) as Record<string, unknown> : undefined;
  const entry = buildEntry(level, message, safeMeta);
  console[level === 'debug' ? 'log' : level](JSON.stringify(entry));
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
};

export type StructuredLogger = typeof logger;
