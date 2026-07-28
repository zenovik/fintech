import { Pool, RowDataPacket } from 'mysql2/promise';
import { getPool, closePool } from '../../database';
import { env } from '../../config';
import { acquireLock, releaseLock, closeRedis, getRedisClient } from '../infrastructure/redis.client';
import { webhookDeliveryProcessor } from '../webhooks/webhook-delivery.engine';
import {
  processBackgroundJob,
  processRetryQueueItem,
  processScheduledTasks,
  processNotificationEmailDelivery,
} from './job-handlers';
import { emailService } from '../email/email.service';
import { getMetricsSnapshot, recordMetric } from '../observability/metrics.registry';
import { logger } from '../logger';

export interface WorkerState {
  running: boolean;
  lastTickAt: string | null;
  ticksProcessed: number;
  shutdownRequested: boolean;
}

const state: WorkerState = {
  running: false,
  lastTickAt: null,
  ticksProcessed: 0,
  shutdownRequested: false,
};

export function getWorkerState(): WorkerState {
  return { ...state };
}

export function requestWorkerShutdown(): void {
  state.shutdownRequested = true;
}

async function claimBackgroundJobs(pool: Pool, limit: number): Promise<number[]> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT id FROM background_jobs WHERE status = 'queued' ORDER BY created_at ASC LIMIT ? FOR UPDATE`,
      [limit],
    );
    const ids = rows.map((r) => Number(r.id));
    if (ids.length) {
      await conn.query(
        `UPDATE background_jobs SET status = 'running', started_at = NOW() WHERE id IN (${ids.map(() => '?').join(',')})`,
        ids,
      );
    }
    await conn.commit();
    return ids;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function claimRetryQueue(pool: Pool, limit: number): Promise<number[]> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT id FROM retry_queue WHERE status IN ('pending','failed')
         AND attempt_count < max_attempts AND scheduled_at <= NOW()
       ORDER BY scheduled_at ASC LIMIT ? FOR UPDATE`,
      [limit],
    );
    const ids = rows.map((r) => Number(r.id));
    if (ids.length) {
      await conn.query(
        `UPDATE retry_queue SET status = 'processing', attempt_count = attempt_count + 1
         WHERE id IN (${ids.map(() => '?').join(',')})`,
        ids,
      );
    }
    await conn.commit();
    return ids;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function claimNotificationEmails(pool: Pool, limit: number): Promise<number[]> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT id FROM notification_deliveries
       WHERE channel = 'email' AND status = 'pending'
       ORDER BY created_at ASC LIMIT ? FOR UPDATE`,
      [limit],
    );
    const ids = rows.map((r) => Number(r.id));
    await conn.commit();
    return ids;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function runTick(pool: Pool): Promise<void> {
  const tickStarted = Date.now();
  const batchSize = env.worker.batchSize;
  const lockTtl = env.worker.lockTtlSeconds;
  const integrationTestMode = process.env.NODE_ENV === 'test';

  getRedisClient();

  const [paymentWebhooks, queueWebhooks, jobIds, retryIds, notificationIds] = await Promise.all([
    integrationTestMode ? Promise.resolve([]) : webhookDeliveryProcessor.claimPendingPaymentWebhooks(batchSize),
    integrationTestMode ? Promise.resolve([]) : webhookDeliveryProcessor.claimPendingQueueDeliveries(batchSize),
    integrationTestMode ? Promise.resolve([]) : claimBackgroundJobs(pool, batchSize),
    integrationTestMode ? Promise.resolve([]) : claimRetryQueue(pool, batchSize),
    integrationTestMode ? Promise.resolve([]) : claimNotificationEmails(pool, batchSize),
  ]);

  if (!integrationTestMode) {
    await processScheduledTasks(pool);
  }

  const tasks: Array<() => Promise<void>> = [];

  for (const id of paymentWebhooks) {
    tasks.push(async () => {
      const lockKey = `pwd:${id}`;
      if (!(await acquireLock(lockKey, lockTtl))) return;
      try {
        await webhookDeliveryProcessor.processPaymentWebhookDelivery(id);
      } finally {
        await releaseLock(lockKey);
      }
    });
  }

  for (const id of queueWebhooks) {
    tasks.push(async () => {
      const lockKey = `wdq:${id}`;
      if (!(await acquireLock(lockKey, lockTtl))) return;
      try {
        await webhookDeliveryProcessor.processQueueDelivery(id);
      } finally {
        await releaseLock(lockKey);
      }
    });
  }

  for (const id of jobIds) {
    tasks.push(async () => {
      const lockKey = `job:${id}`;
      if (!(await acquireLock(lockKey, lockTtl))) return;
      try {
        await processBackgroundJob(id, pool);
      } finally {
        await releaseLock(lockKey);
      }
    });
  }

  for (const id of retryIds) {
    tasks.push(async () => {
      const lockKey = `retry:${id}`;
      if (!(await acquireLock(lockKey, lockTtl))) return;
      try {
        await processRetryQueueItem(id, pool);
      } finally {
        await releaseLock(lockKey);
      }
    });
  }

  for (const deliveryId of notificationIds) {
    tasks.push(async () => {
      const lockKey = `notif:${deliveryId}`;
      if (!(await acquireLock(lockKey, lockTtl))) return;
      try {
        await processNotificationEmailDelivery(deliveryId, pool);
      } finally {
        await releaseLock(lockKey);
      }
    });
  }

  const concurrency = env.worker.concurrency;
  for (let i = 0; i < tasks.length; i += concurrency) {
    await Promise.all(tasks.slice(i, i + concurrency).map((t) => t()));
  }

  if (tasks.length === 0) {
    await emailService.retryFailedEmails(Math.min(3, batchSize));
  }

  state.lastTickAt = new Date().toISOString();
  state.ticksProcessed += 1;
  await getRedisClient().setex('worker:heartbeat', 30, state.lastTickAt);
  recordMetric('worker.tick', true, Date.now() - tickStarted);
}

/** Runs a single worker tick (used by integration tests). */
export async function runWorkerTickOnce(pool: Pool = getPool()): Promise<void> {
  await runTick(pool);
}

export async function startWorkerLoop(): Promise<void> {
  if (state.running) return;
  state.running = true;
  state.shutdownRequested = false;
  const pool = getPool();

  logger.info('Worker started', {
    pollIntervalMs: env.worker.pollIntervalMs,
    concurrency: env.worker.concurrency,
    batchSize: env.worker.batchSize,
  });

  while (!state.shutdownRequested) {
    try {
      await runTick(pool);
    } catch (err) {
      recordMetric('worker.tick', false, 0, err instanceof Error ? err.message : 'unknown');
      logger.error('Worker tick failed', { message: err instanceof Error ? err.message : String(err) });
    }
    await sleep(env.worker.pollIntervalMs);
  }

  state.running = false;
  logger.info('Worker loop stopped', { metrics: getMetricsSnapshot() });
}

export async function shutdownWorker(): Promise<void> {
  requestWorkerShutdown();
  await closeRedis();
  await closePool();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
