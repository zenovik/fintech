import { promises as fs } from 'node:fs';

import path from 'node:path';

import { Pool, RowDataPacket } from 'mysql2/promise';

import { appMeta } from '../../../config/app-meta';

import { env } from '../../../config';

import { testConnection, getPool } from '../../../database';

import { checkRedisHealth, isRedisFallback, getRedisClient } from '../../../shared/infrastructure/redis.client';

import { getMetricsSnapshot } from '../../../shared/observability/metrics.registry';

import { getWorkerState } from '../../../shared/workers/worker-runner';

import {

  ComponentState,

  HealthState,

  SystemHealthResponse,

  SystemLivenessResponse,

  SystemReadinessResponse,

  SystemVersionResponse,

} from '../types/system.types';



const STARTED_AT = Date.now();

const EXPORTS_DIR = path.join(process.cwd(), 'uploads', 'exports');



export class HealthService {

  constructor(private readonly pool: Pool = getPool()) {}



  getLiveness(): SystemLivenessResponse {

    return {

      alive: true,

      uptimeSeconds: Math.floor((Date.now() - STARTED_AT) / 1000),

      timestamp: new Date().toISOString(),

    };

  }



  async getHealth(): Promise<SystemHealthResponse> {

    const [database, redis, aiProvider] = await Promise.all([

      this.checkDatabase(),

      this.checkRedis(),

      Promise.resolve(this.checkAiProvider()),

    ]);



    const application: ComponentState = 'up';

    const status = this.resolveOverallStatus(application, database, redis, aiProvider);



    return {

      status,

      application,

      database,

      redis,

      aiProvider,

      uptimeSeconds: Math.floor((Date.now() - STARTED_AT) / 1000),

      version: appMeta.version,

      environment: appMeta.environment,

      timestamp: new Date().toISOString(),

    };

  }



  async getReadiness(): Promise<SystemReadinessResponse> {

    const [database, storage, queues, redisState] = await Promise.all([

      this.isDatabaseReady(),

      this.isStorageReady(),

      this.areQueuesReady(),

      checkRedisHealth(),

    ]);

    const ai = this.isAiReady();
    const workerState = getWorkerState();
    const heartbeat = await getRedisClient().get('worker:heartbeat');
    const worker = workerState.running || Boolean(heartbeat);
    const redis = redisState === 'up' || (redisState === 'degraded' && isRedisFallback());



    const dependencies = {

      database: database ? 'up' as ComponentState : 'down' as ComponentState,

      redis: redisState,

      storage: storage ? 'up' as ComponentState : 'down' as ComponentState,

      queues: queues ? 'up' as ComponentState : 'down' as ComponentState,

      worker: worker ? 'up' as ComponentState : 'degraded' as ComponentState,

    };



    return {
      ready: database && storage && queues && (redis || isRedisFallback())
        && (env.nodeEnv !== 'production' || worker),

      database,

      redis,

      ai,

      storage,

      queues,

      worker,

      dependencies,

      timestamp: new Date().toISOString(),

    };

  }



  getVersion(): SystemVersionResponse {

    return {

      version: appMeta.version,

      build: appMeta.build,

      commit: appMeta.commit,

      environment: appMeta.environment,

    };

  }



  getMetrics(): Record<string, unknown> {

    return {

      worker: getWorkerState(),

      counters: getMetricsSnapshot(),

      timestamp: new Date().toISOString(),

    };

  }



  async getAdminStatus(): Promise<Record<string, unknown>> {

    const health = await this.getHealth();

    const readiness = await this.getReadiness();

    const mem = process.memoryUsage();

    let queuePending = 0;

    let jobsRunning = 0;

    let schedulesActive = 0;

    let webhookPending = 0;

    let emailQueued = 0;

    try {

      const [rq] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS c FROM retry_queue WHERE status IN ('pending','failed')`);

      const [bj] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS c FROM background_jobs WHERE status IN ('queued','running')`);

      const [bs] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS c FROM background_job_schedules WHERE is_active = 1`);

      const [wp] = await this.pool.query<RowDataPacket[]>(

        `SELECT COUNT(*) AS c FROM payment_webhook_deliveries WHERE status IN ('pending','failed')`,

      );

      const [eq] = await this.pool.query<RowDataPacket[]>(

        `SELECT COUNT(*) AS c FROM email_delivery_log WHERE status IN ('queued','failed')`,

      );

      queuePending = Number(rq[0]?.c ?? 0);

      jobsRunning = Number(bj[0]?.c ?? 0);

      schedulesActive = Number(bs[0]?.c ?? 0);

      webhookPending = Number(wp[0]?.c ?? 0);

      emailQueued = Number(eq[0]?.c ?? 0);

    } catch { /* tables may not exist during bootstrap */ }



    return {

      ...health,

      readiness,

      api: health.application,

      database: health.database,

      redis: health.redis,

      queues: readiness.queues ? 'healthy' : 'degraded',

      storage: readiness.storage ? 'healthy' : 'degraded',

      worker: getWorkerState(),

      backgroundJobs: { pending: queuePending, running: jobsRunning, schedulesActive: schedulesActive },

      webhookDeliveries: { pending: webhookPending },

      emailDeliveries: { queued: emailQueued },

      metrics: getMetricsSnapshot(),

      memory: {

        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),

        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),

        rssMb: Math.round(mem.rss / 1024 / 1024),

      },

      version: appMeta.version,

      environment: appMeta.environment,

    };

  }



  private async checkDatabase(): Promise<ComponentState> {

    try {

      await testConnection();

      return 'up';

    } catch {

      return 'down';

    }

  }



  private async checkRedis(): Promise<ComponentState> {

    return checkRedisHealth();

  }



  private checkAiProvider(): ComponentState {

    if (this.isAiReady()) return 'up';

    if (env.ai.provider === 'openai' || env.ai.provider === 'groq') return 'degraded';

    return 'down';

  }



  private isAiReady(): boolean {

    switch (env.ai.provider) {

      case 'gemini':

        return Boolean(env.ai.gemini.apiKey);

      case 'openai':

        return Boolean(env.ai.openai.apiKey);

      case 'groq':

        return Boolean(env.ai.groq.apiKey);

      default:

        return false;

    }

  }



  private async isDatabaseReady(): Promise<boolean> {

    try {

      await testConnection();

      return true;

    } catch {

      return false;

    }

  }



  private async isStorageReady(): Promise<boolean> {

    try {

      await fs.mkdir(EXPORTS_DIR, { recursive: true });

      await fs.access(EXPORTS_DIR, fs.constants.W_OK);

      return true;

    } catch {

      return false;

    }

  }



  private async areQueuesReady(): Promise<boolean> {

    try {

      await this.pool.query<RowDataPacket[]>('SELECT 1 FROM retry_queue LIMIT 1');

      await this.pool.query<RowDataPacket[]>('SELECT 1 FROM background_jobs LIMIT 1');

      await this.pool.query<RowDataPacket[]>('SELECT 1 FROM payment_webhook_deliveries LIMIT 1');

      return true;

    } catch {

      return false;

    }

  }



  private resolveOverallStatus(

    application: ComponentState,

    database: ComponentState,

    redis: ComponentState,

    aiProvider: ComponentState,

  ): HealthState {

    if (application === 'down' || database === 'down') return 'unhealthy';

    if (redis === 'down' || aiProvider === 'down' || aiProvider === 'degraded' || database === 'degraded') return 'degraded';

    return 'healthy';

  }

}



export const healthService = new HealthService();

