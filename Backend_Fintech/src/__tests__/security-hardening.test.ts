import './test-env.setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { env } from '../app/config/env';
import {
  buildContentSecurityPolicyDirectives,
  isContentSecurityPolicyEnabled,
  buildAngularContentSecurityPolicy,
} from '../app/config/csp.config';
import {
  getAccessTokenCookieOptions,
  parseTokenExpiryMs,
} from '../app/modules/auth/helpers/auth-cookie.helper';
import {
  attemptRedisRecovery,
} from '../app/shared/infrastructure/redis.client';
import { getWorkerState } from '../app/shared/workers/worker-runner';
import { orgContextStorage } from '../app/shared/context/org-context';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../app/shared/middleware/csrf.middleware';
import { TokenService } from '../app/modules/auth/services/token.service';
import jwt from 'jsonwebtoken';

test('CSP directives include self and configured API origins', () => {
  const directives = buildContentSecurityPolicyDirectives();
  assert.ok(directives['default-src']?.includes("'self'"));
  assert.ok(directives['connect-src']?.includes("'self'"));
  assert.ok(directives['frame-ancestors']?.includes("'none'"));
});

test('CSP enabled flag is exposed via environment config', () => {
  assert.equal(typeof env.security.cspEnabled, 'boolean');
  assert.equal(typeof isContentSecurityPolicyEnabled(), 'boolean');
});

test('Angular CSP string is non-empty and includes script-src self', () => {
  const policy = buildAngularContentSecurityPolicy();
  assert.match(policy, /script-src 'self'/);
  assert.match(policy, /connect-src/);
});

test('access token cookie options are HttpOnly and scoped to /api', () => {
  const options = getAccessTokenCookieOptions('15m');
  assert.equal(options.httpOnly, true);
  assert.equal(options.path, '/api');
  assert.equal(options.sameSite, 'strict');
  assert.equal(parseTokenExpiryMs('15m'), 15 * 60 * 1000);
});

test('Redis recovery API is callable', async () => {
  const result = await attemptRedisRecovery();
  assert.equal(typeof result, 'boolean');
});

test('webhook queue claim uses FOR UPDATE transaction', async () => {
  const queries: string[] = [];
  const conn = {
    beginTransaction: async () => undefined,
    commit: async () => undefined,
    rollback: async () => undefined,
    release: () => undefined,
    query: async (sql: string) => {
      queries.push(sql);
      if (sql.includes('SELECT id FROM webhook_delivery_queue')) {
        return [[{ id: 3 }], []];
      }
      return [{ affectedRows: 1 }, []];
    },
  };
  const pool = {
    getConnection: async () => conn,
  };

  const { WebhookDeliveryProcessor } = await import('../app/shared/webhooks/webhook-delivery.engine');
  const processor = new WebhookDeliveryProcessor(pool as never);
  const ids = await processor.claimPendingQueueDeliveries(5);
  assert.deepEqual(ids, [3]);
  assert.ok(queries.some((sql) => sql.includes('FOR UPDATE')));
  assert.ok(queries.some((sql) => sql.includes("status = 'processing'")));
});

test('worker state exposes heartbeat fields before loop starts', () => {
  const state = getWorkerState();
  assert.equal(typeof state.running, 'boolean');
  assert.equal(typeof state.ticksProcessed, 'number');
  assert.ok('lastTickAt' in state);
});

test('audit record persists organization context when available', async () => {
  const queries: string[] = [];
  const pool = {
    query: async (sql: string) => {
      queries.push(sql);
      if (sql.includes('INSERT INTO audit_logs')) {
        return [{ insertId: 1 }, []];
      }
      return [[], []];
    },
  };

  const { AuditRepository } = await import('../app/modules/audit/repositories/audit.repository');
  const repo = new AuditRepository(pool as never);

  await orgContextStorage.run({ organizationId: 9, organizationRoleCode: 'admin' }, async () => {
    await repo.record({
      module: 'test',
      categoryCode: 'test',
      actionCode: 'test',
      description: 'Tenant scoped audit',
    });
  });

  const insert = queries.find((sql) => sql.includes('INSERT INTO audit_logs'));
  assert.ok(insert?.includes('organization_id'));
});

test('JWT access tokens are signed and verified with HS256 only', () => {
  const service = new TokenService();
  const token = service.generateAccessToken({
    sub: 1,
    email: 'test@example.com',
    roleCode: 'admin',
  });
  const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString());
  assert.equal(header.alg, 'HS256');
  service.verifyAccessToken(token);

  const noneToken = jwt.sign({ sub: 1 }, 'wrong-secret', { algorithm: 'none' as jwt.Algorithm });
  assert.throws(() => service.verifyAccessToken(noneToken), /Invalid or expired access token/);
});

test('CSRF constants use double-submit cookie pattern', () => {
  assert.equal(CSRF_COOKIE_NAME, 'csrfToken');
  assert.equal(CSRF_HEADER_NAME, 'x-csrf-token');
});
