export {
  registerIntegrationBootstrap,
  getIntegrationBaseUrl,
  assertBootstrapReady,
} from './bootstrap';

export { stubFetchSuccess, stubFetchFailure, stubExternalEmail, restoreExternalEmail } from './harness-mocks';

/** @deprecated Use registerIntegrationBootstrap */
export { registerIntegrationBootstrap as registerIntegrationHarness } from './bootstrap';

/** @deprecated Bootstrap fails fast; never skips */
export function isIntegrationReady(): never {
  throw new Error('isIntegrationReady() is deprecated. Integration tests fail fast via registerIntegrationBootstrap().');
}
