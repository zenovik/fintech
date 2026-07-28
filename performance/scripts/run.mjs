#!/usr/bin/env node
/**
 * Performance test runner — wraps k6 with environment defaults.
 *
 * Usage:
 *   node performance/scripts/run.mjs smoke
 *   node performance/scripts/run.mjs load
 *   PERF_ENV=docker node performance/scripts/run.mjs stress
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../..');
const profile = process.argv[2] || process.env.PERF_PROFILE || 'smoke';

mkdirSync(resolve(root, 'performance/reports'), { recursive: true });

const env = {
  ...process.env,
  PERF_PROFILE: profile,
  PERF_ENV: process.env.PERF_ENV || 'local',
};

const k6Args = ['run', resolve(root, 'performance/tests/main.js')];

if (process.env.K6_OUT) {
  k6Args.unshift(`--out=${process.env.K6_OUT}`);
}

console.log(`\n▶ k6 performance profile: ${profile}`);
console.log(`  PERF_ENV=${env.PERF_ENV}`);
console.log(`  BASE_URL=${env.BASE_URL || '(default)'}\n`);

const result = spawnSync('k6', k6Args, { cwd: root, env, stdio: 'inherit', shell: true });

process.exit(result.status ?? 1);
