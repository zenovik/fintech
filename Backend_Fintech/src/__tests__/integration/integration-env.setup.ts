import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(__dirname, '../../../.env') });

process.env.NODE_ENV ??= 'test';
process.env.DB_NAME ??= 'fintech_db_test';
process.env.REDIS_ENABLED ??= 'false';
process.env.CSP_ENABLED ??= 'false';
process.env.JWT_SECRET ??= 'integration-test-jwt-secret-min-32-chars!!';
process.env.JWT_REFRESH_SECRET ??= 'integration-test-refresh-secret-min-32-chars';
process.env.CONFIG_ENCRYPTION_KEY ??= 'integration-test-config-key-min-32-chars';
process.env.CORS_ORIGIN ??= 'http://localhost:4200';
process.env.LOG_LEVEL ??= 'error';
