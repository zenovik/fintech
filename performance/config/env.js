/**
 * Environment configuration — driven by PERF_ENV and overrides.
 *
 * PERF_ENV: local | docker | staging | production
 * BASE_URL: API base (default http://localhost:3000/api)
 */

const ENV_NAME = __ENV.PERF_ENV || 'local';

const PRESETS = {
  local: {
    baseUrl: 'http://localhost:3000/api',
    readOnly: false,
    allowMutations: true,
    maxVus: 200,
  },
  docker: {
    baseUrl: 'http://backend:3000/api',
    readOnly: false,
    allowMutations: true,
    maxVus: 200,
  },
  staging: {
    baseUrl: __ENV.BASE_URL || 'https://staging-api.example.com/api',
    readOnly: false,
    allowMutations: true,
    maxVus: 150,
  },
  production: {
    baseUrl: __ENV.BASE_URL || 'https://api.example.com/api',
    readOnly: true,
    allowMutations: false,
    maxVus: 25,
  },
};

const preset = PRESETS[ENV_NAME] || PRESETS.local;

export const config = {
  env: ENV_NAME,
  baseUrl: __ENV.BASE_URL || preset.baseUrl,
  readOnly: __ENV.PERF_READ_ONLY === 'true' || preset.readOnly,
  allowMutations: __ENV.PERF_ALLOW_MUTATIONS !== 'false' && preset.allowMutations,
  maxVus: Number(__ENV.PERF_MAX_VUS || preset.maxVus),
  orgId: Number(__ENV.PERF_ORG_ID || 1),
  adminEmail: __ENV.PERF_ADMIN_EMAIL || 'admin@merchantpro.com',
  adminPassword: __ENV.PERF_ADMIN_PASSWORD || 'Password123!',
  soakDuration: __ENV.PERF_SOAK_DURATION || '4h',
  soakVus: Number(__ENV.PERF_SOAK_VUS || 20),
  profile: __ENV.PERF_PROFILE || 'smoke',
  tags: {
    environment: ENV_NAME,
    profile: __ENV.PERF_PROFILE || 'smoke',
  },
};

export function apiUrl(path) {
  const base = config.baseUrl.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export function isProductionSafe() {
  return config.env === 'production' ? config.readOnly : true;
}
