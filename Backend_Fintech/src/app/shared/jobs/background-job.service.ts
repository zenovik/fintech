import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

import { randomUUID } from 'node:crypto';

import { getPool } from '../../database';

import { processBackgroundJob } from '../workers/job-handlers';

import { acquireLock, releaseLock } from '../infrastructure/redis.client';

import { env } from '../../config';



export class BackgroundJobService {

  constructor(private readonly pool: Pool = getPool()) {}



  async listSchedules(): Promise<RowDataPacket[]> {

    const [rows] = await this.pool.query<RowDataPacket[]>(

      `SELECT * FROM background_job_schedules WHERE is_active = 1 ORDER BY job_type`,

    );

    return rows;

  }



  async enqueue(jobType: string, payload?: Record<string, unknown>, orgId?: number): Promise<number> {

    const [result] = await this.pool.query<ResultSetHeader>(

      `INSERT INTO background_jobs (uuid, organization_id, job_type, status, payload)

       VALUES (?, ?, ?, 'queued', ?)`,

      [randomUUID(), orgId ?? null, jobType, payload ? JSON.stringify(payload) : null],

    );

    return result.insertId;

  }

  async markCompleted(jobId: number): Promise<void> {
    await this.pool.query(
      `UPDATE background_jobs SET status = 'completed', completed_at = NOW() WHERE id = ?`,
      [jobId],
    );
  }



  async processNext(): Promise<{ processed: boolean; jobId?: number }> {

    const conn = await this.pool.getConnection();

    try {

      await conn.beginTransaction();

      const [rows] = await conn.query<RowDataPacket[]>(

        `SELECT id FROM background_jobs WHERE status = 'queued' ORDER BY created_at ASC LIMIT 1 FOR UPDATE`,

      );

      const job = rows[0];

      if (!job) {

        await conn.commit();

        return { processed: false };

      }

      await conn.query(`UPDATE background_jobs SET status = 'running', started_at = NOW() WHERE id = ?`, [job.id]);

      await conn.commit();



      const lockKey = `job:${job.id}`;

      if (await acquireLock(lockKey, env.worker.lockTtlSeconds)) {

        try {

          const result = await processBackgroundJob(Number(job.id), this.pool);

          return { processed: result.success, jobId: Number(job.id) };

        } finally {

          await releaseLock(lockKey);

        }

      }

      return { processed: false, jobId: Number(job.id) };

    } catch {

      await conn.rollback();

      return { processed: false };

    } finally {

      conn.release();

    }

  }

}



export const backgroundJobService = new BackgroundJobService();

