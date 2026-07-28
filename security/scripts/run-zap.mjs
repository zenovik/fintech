#!/usr/bin/env node
/**
 * OWASP ZAP baseline + API scan runner.
 * Requires Docker with owasp/zap2docker-stable image.
 *
 * Usage:
 *   node security/scripts/run-zap.mjs [baseline|full|all]
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
const reportsDir = join(root, 'security', 'reports');
const targets = JSON.parse(readFileSync(join(root, 'security', 'config', 'targets.json'), 'utf8'));

const mode = process.argv[2] ?? 'baseline';
const backendUrl = process.env.ZAP_TARGET_URL ?? targets.backend.url;
const frontendUrl = process.env.ZAP_FRONTEND_URL ?? targets.frontend.url;
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

mkdirSync(reportsDir, { recursive: true });

function dockerAvailable() {
  const result = spawnSync('docker', ['info'], { stdio: 'ignore', shell: process.platform === 'win32' });
  return result.status === 0;
}

function runZap(args, label) {
  const reportBase = join(reportsDir, `zap-${label}-${timestamp}`);
  const htmlReport = `${reportBase}.html`;
  const jsonReport = `${reportBase}.json`;

  const dockerArgs = [
    'run',
    '--rm',
    '--network=host',
    '-v',
    `${reportsDir}:/zap/wrk:rw`,
    'ghcr.io/zaproxy/zaproxy:stable',
    ...args,
    '-J',
    `/zap/wrk/${label}-${timestamp}.json`,
    '-r',
    `/zap/wrk/${label}-${timestamp}.html`,
  ];

  console.log(`[ZAP] Running ${label} scan against ${backendUrl}`);
  const result = spawnSync('docker', dockerArgs, { stdio: 'inherit', shell: process.platform === 'win32' });

  if (result.status !== 0) {
    console.error(`[ZAP] ${label} scan exited with code ${result.status ?? 1}`);
    return false;
  }

  console.log(`[ZAP] Reports: ${htmlReport}, ${jsonReport}`);
  return true;
}

if (!dockerAvailable()) {
  console.warn('[ZAP] Docker not available — skipping live DAST. Run with Docker to generate HTML/JSON reports.');
  process.exit(0);
}

let ok = true;

if (mode === 'baseline' || mode === 'all') {
  ok = runZap(['zap-baseline.py', '-t', backendUrl, '-I'], 'baseline-api') && ok;
  ok = runZap(['zap-baseline.py', '-t', frontendUrl, '-I'], 'baseline-frontend') && ok;
}

if (mode === 'full' || mode === 'all') {
  ok = runZap(['zap-full-scan.py', '-t', backendUrl, '-I'], 'full-api') && ok;
}

process.exit(ok ? 0 : 1);
