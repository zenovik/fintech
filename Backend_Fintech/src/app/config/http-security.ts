import cors from 'cors';
import helmet from 'helmet';
import compression, { filter as defaultCompressionFilter } from 'compression';
import { env } from './env';
import { buildContentSecurityPolicyDirectives, isContentSecurityPolicyEnabled } from './csp.config';

const SKIP_COMPRESSION_PREFIXES = [
  'image/',
  'video/',
  'audio/',
  'application/zip',
  'application/gzip',
  'application/x-gzip',
  'application/pdf',
  'application/octet-stream',
];

export function resolveCorsOrigin(): cors.CorsOptions['origin'] {
  const raw = env.corsOrigin.trim();
  if (raw.includes(',')) {
    return raw.split(',').map((entry) => entry.trim()).filter(Boolean);
  }
  return raw;
}

export function buildHelmetMiddleware() {
  const isProduction = env.nodeEnv === 'production';
  const cspEnabled = isContentSecurityPolicyEnabled();

  return helmet({
    contentSecurityPolicy: cspEnabled
      ? {
          useDefaults: false,
          directives: buildContentSecurityPolicyDirectives(),
        }
      : false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    frameguard: { action: 'deny' },
    noSniff: true,
    dnsPrefetchControl: { allow: false },
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    hsts: isProduction
      ? { maxAge: 31_536_000, includeSubDomains: true, preload: false }
      : false,
    permissionsPolicy: {
      features: {
        accelerometer: [],
        camera: [],
        geolocation: [],
        gyroscope: [],
        magnetometer: [],
        microphone: [],
        payment: ['self'],
        usb: [],
      },
    },
  });
}

export function buildCorsMiddleware() {
  return cors({
    origin: resolveCorsOrigin(),
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Organization-Id',
      'X-Merchant-Id',
      'X-Outlet-Id',
      'X-Request-Id',
      'X-CSRF-Token',
    ],
    exposedHeaders: ['X-Request-Id'],
  });
}

export function buildCompressionMiddleware() {
  return compression({
    threshold: 1024,
    level: env.nodeEnv === 'production' ? 6 : -1,
    filter(req, res) {
      if (req.headers['x-no-compression']) {
        return false;
      }

      const type = res.getHeader('Content-Type');
      if (typeof type === 'string') {
        const lower = type.toLowerCase();
        if (SKIP_COMPRESSION_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
          return false;
        }
      }

      return defaultCompressionFilter(req, res);
    },
  });
}
