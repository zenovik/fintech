import '../src/__tests__/integration/integration-env.setup.ts';
import { validateIntegrationEnvironment } from '../src/__tests__/integration/helpers/schema.ts';

await validateIntegrationEnvironment();
console.log('[integration] Environment preflight passed.');
