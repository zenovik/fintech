/**
 * Integration test teardown hooks — loaded after bootstrap in run-integration-tests.mjs.
 */
import { after, afterEach } from 'node:test';

const { runTestCleanup } = await import('../src/__tests__/integration/helpers/isolation.ts');
const { stopTestServer, getBaseUrl } = await import('../src/__tests__/integration/helpers/server.ts');
const { closePool } = await import('../src/app/database/connection.ts');
const { restoreExternalEmail } = await import('../src/__tests__/integration/helpers/harness-mocks.ts');

afterEach(async () => {
  await runTestCleanup();
});

after(async () => {
  restoreExternalEmail();
  if (getBaseUrl()) {
    await stopTestServer();
  }
  await closePool().catch(() => {});
});
