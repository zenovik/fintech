#!/usr/bin/env node
/**
 * Runs integration tests and fails if any test was skipped or none executed.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');

const testFiles = [
  'src/__tests__/integration/auth.integration.test.ts',
  'src/__tests__/integration/authorization.integration.test.ts',
  'src/__tests__/integration/merchants.integration.test.ts',
  'src/__tests__/integration/users.integration.test.ts',
  'src/__tests__/integration/payments.integration.test.ts',
  'src/__tests__/integration/payment-transactions.integration.test.ts',
  'src/__tests__/integration/checkout.integration.test.ts',
  'src/__tests__/integration/qr-payment-links.integration.test.ts',
  'src/__tests__/integration/subscriptions-invoices.integration.test.ts',
  'src/__tests__/integration/chargebacks-refunds.integration.test.ts',
  'src/__tests__/integration/webhooks-workers.integration.test.ts',
  'src/__tests__/integration/notifications.integration.test.ts',
  'src/__tests__/integration/reports-audit.integration.test.ts',
  'src/__tests__/integration/developer-sandbox.integration.test.ts',
  'src/__tests__/integration/negative.integration.test.ts',
  'src/__tests__/integration/concurrency.integration.test.ts',
  'src/__tests__/integration/database.integration.test.ts',
];

const started = Date.now();

// Preflight: validate/import schema before any test file runs.
const preflight = spawnSync(
  process.execPath,
  ['--import', 'tsx', 'scripts/preflight-integration-env.mjs'],
  { cwd: backendRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
);

if (preflight.status !== 0) {
  process.stderr.write(`${preflight.stdout ?? ''}${preflight.stderr ?? ''}`);
  console.error('INTEGRATION GATE FAILED: environment preflight failed.');
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [
    '--import',
    'tsx',
    '--import',
    './scripts/integration-test-bootstrap.mjs',
    '--import',
    './scripts/integration-test-hooks.mjs',
    '--test',
    '--test-force-exit',
    ...testFiles,
  ],
  { cwd: backendRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
);

const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
process.stdout.write(output);

const tests = Number(output.match(/^# tests (\d+)/m)?.[1] ?? 0);
const pass = Number(output.match(/^# pass (\d+)/m)?.[1] ?? 0);
const fail = Number(output.match(/^# fail (\d+)/m)?.[1] ?? 0);
const skipped = Number(output.match(/^# skipped (\d+)/m)?.[1] ?? 0);
const durationMs = Date.now() - started;

console.log('\n--- Integration Test Summary ---');
console.log(`Executed (pass+fail): ${pass + fail}`);
console.log(`Passed: ${pass}`);
console.log(`Failed: ${fail}`);
console.log(`Skipped: ${skipped}`);
console.log(`Total declared: ${tests}`);
console.log(`Duration: ${(durationMs / 1000).toFixed(1)}s`);

let exitCode = result.status ?? 1;

if (skipped > 0) {
  console.error(`INTEGRATION GATE FAILED: ${skipped} test(s) skipped. Skipped tests are not allowed.`);
  exitCode = 1;
}

const executed = pass + fail;
if (executed === 0) {
  console.error('INTEGRATION GATE FAILED: 0 tests executed.');
  exitCode = 1;
}

if (tests > 0 && executed < tests) {
  console.error(`INTEGRATION GATE FAILED: executed (${executed}) < total (${tests}).`);
  exitCode = 1;
}

if (fail > 0) {
  exitCode = 1;
}

process.exit(exitCode);
