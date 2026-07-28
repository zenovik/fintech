/**
 * Unified k6 performance test entry point.
 *
 * Usage:
 *   PERF_PROFILE=smoke k6 run performance/tests/main.js
 *   PERF_PROFILE=load k6 run performance/tests/main.js
 *   PERF_PROFILE=stress|spike|soak
 *
 * Environment:
 *   PERF_ENV=local|docker|staging|production
 *   BASE_URL=http://localhost:3000/api
 */

import { login, logout } from '../helpers/auth.js';
import { config } from '../config/env.js';
import { getProfile } from '../config/profiles.js';
import { thresholds, stressThresholds, soakThresholds } from '../config/thresholds.js';
import { runMixedScenario, scenarioSoakMonitoring } from '../scenarios/index.js';
import { buildSummary } from '../helpers/summary.js';
import { healthCheck, readyCheck } from '../helpers/http.js';
import { check } from 'k6';

const profileName = config.profile;

function resolveThresholds() {
  if (profileName === 'stress') return stressThresholds;
  if (profileName === 'soak') return soakThresholds;
  return thresholds;
}

export const options = {
  ...getProfile(profileName, { soakDuration: config.soakDuration, soakVus: config.soakVus }),
  thresholds: resolveThresholds(),
  tags: config.tags,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

export function setup() {
  const ready = readyCheck();
  check(ready, { 'api ready': (r) => r.status === 200 });
  const health = healthCheck();
  check(health, { 'api health': (r) => r.status === 200 });

  const session = login();
  if (!session?.accessToken) {
    throw new Error(`Setup login failed against ${config.baseUrl}`);
  }

  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    organizationId: session.organizationId,
    env: config.env,
    profile: profileName,
    readOnly: config.readOnly,
  };
}

export default function (data) {
  if (profileName === 'soak') {
    if (Math.random() < 0.1) {
      scenarioSoakMonitoring(data);
    } else {
      runMixedScenario(data);
    }
    return;
  }

  runMixedScenario(data);
}

export function handleSummary(data) {
  return buildSummary(data, profileName, config.env);
}

export function teardown(data) {
  if (data?.accessToken && !config.readOnly) {
    logout(data.accessToken);
  }
}
