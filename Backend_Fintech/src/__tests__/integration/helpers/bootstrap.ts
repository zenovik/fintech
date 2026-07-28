import { getBaseUrl } from './server';
let bootstrapComplete = false;

export function markIntegrationBootstrapComplete(): void {
  bootstrapComplete = true;
}

export function registerIntegrationBootstrap(): void {
  // Hooks are registered globally via integration-test-hooks.ts (--import in run-integration-tests.mjs).
  // Preflight also starts the server so getIntegrationBaseUrl() works before the first test body runs.
}

export function getIntegrationBaseUrl(): string {
  const url = getBaseUrl();
  if (url) return url;
  if (!bootstrapComplete) {
    throw new Error('Integration bootstrap not complete — database validation or server startup failed.');
  }
  return getBaseUrl();
}

export function assertBootstrapReady(): void {
  if (!getBaseUrl() && !bootstrapComplete) {
    throw new Error('Integration environment failed to initialize.');
  }
}
