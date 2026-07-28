/**
 * ESM bootstrap for integration tests (top-level await).
 * Loaded via --import before test files in run-integration-tests.mjs.
 */
await import('../src/__tests__/integration/integration-env.setup.ts');

const { validateIntegrationEnvironment } = await import('../src/__tests__/integration/helpers/schema.ts');
const { startTestServer, getBaseUrl } = await import('../src/__tests__/integration/helpers/server.ts');
const { stubExternalEmail } = await import('../src/__tests__/integration/helpers/harness-mocks.ts');
const { markIntegrationBootstrapComplete } = await import('../src/__tests__/integration/helpers/bootstrap.ts');

if (!getBaseUrl()) {
  await validateIntegrationEnvironment();
  stubExternalEmail();
  await startTestServer();
}
markIntegrationBootstrapComplete();
