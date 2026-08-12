import { Pool, RowDataPacket } from 'mysql2/promise';
import { randomUUID } from 'crypto';
import { getPool } from '../../database';

export type EventCategory = 'domain' | 'integration';

export interface DomainEventInput {
  eventType: string;
  eventCategory?: EventCategory;
  aggregateType: string;
  aggregateId: string | number;
  payload: Record<string, unknown>;
  organizationId?: number;
  correlationId?: string;
}

export class OutboxRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async enqueue(input: DomainEventInput): Promise<number> {
    const [result] = await this.pool.query(
      `INSERT INTO event_outbox (uuid, event_type, event_category, aggregate_type, aggregate_id, payload, correlation_id, organization_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        input.eventType,
        input.eventCategory ?? 'domain',
        input.aggregateType,
        String(input.aggregateId),
        JSON.stringify(input.payload),
        input.correlationId ?? null,
        input.organizationId ?? null,
      ],
    );
    return Number((result as { insertId: number }).insertId);
  }

  async claimPending(limit: number): Promise<RowDataPacket[]> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT * FROM event_outbox
         WHERE status = 'pending' AND (next_retry_at IS NULL OR next_retry_at <= NOW())
         ORDER BY created_at ASC LIMIT ? FOR UPDATE`,
        [limit],
      );
      const ids = rows.map((r) => Number(r.id));
      if (ids.length) {
        await conn.query(
          `UPDATE event_outbox SET status = 'pending', publish_attempts = publish_attempts + 1 WHERE id IN (${ids.map(() => '?').join(',')})`,
          ids,
        );
      }
      await conn.commit();
      return rows;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async markPublished(id: number): Promise<void> {
    await this.pool.query(
      `UPDATE event_outbox SET status = 'published', published_at = NOW(), error_message = NULL WHERE id = ?`,
      [id],
    );
  }

  async markFailed(id: number, error: string, maxAttempts: number): Promise<void> {
    const [rows] = await this.pool.query<RowDataPacket[]>(`SELECT publish_attempts FROM event_outbox WHERE id = ?`, [id]);
    const attempts = Number(rows[0]?.publish_attempts ?? 0);
    if (attempts >= maxAttempts) {
      await this.pool.query(`UPDATE event_outbox SET status = 'dead_letter', error_message = ? WHERE id = ?`, [error.slice(0, 1000), id]);
      await this.pool.query(
        `INSERT INTO dead_letter_events (outbox_id, event_type, payload, error_message)
         SELECT id, event_type, payload, ? FROM event_outbox WHERE id = ?`,
        [error.slice(0, 2000), id],
      );
    } else {
      await this.pool.query(
        `UPDATE event_outbox SET status = 'pending', error_message = ?, next_retry_at = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id = ?`,
        [error.slice(0, 1000), Math.min(attempts * 5, 60), id],
      );
    }
  }

  async listDeadLetter(limit = 50): Promise<RowDataPacket[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT dle.*, eo.event_type AS outbox_event_type FROM dead_letter_events dle
       LEFT JOIN event_outbox eo ON eo.id = dle.outbox_id
       WHERE dle.status = 'open' ORDER BY dle.created_at DESC LIMIT ?`,
      [limit],
    );
    return rows;
  }

  async replayDeadLetter(id: number): Promise<void> {
    await this.pool.query(
      `UPDATE dead_letter_events SET status = 'replayed', replay_count = replay_count + 1, replayed_at = NOW() WHERE id = ?`,
      [id],
    );
    const [rows] = await this.pool.query<RowDataPacket[]>(`SELECT outbox_id FROM dead_letter_events WHERE id = ?`, [id]);
    const outboxId = rows[0]?.outbox_id;
    if (outboxId) {
      await this.pool.query(
        `UPDATE event_outbox SET status = 'pending', publish_attempts = 0, next_retry_at = NULL, error_message = NULL WHERE id = ?`,
        [outboxId],
      );
    }
  }
}

export class EventBusService {
  private readonly handlers = new Map<string, Array<(payload: Record<string, unknown>) => Promise<void>>>();

  constructor(private readonly outbox = new OutboxRepository()) {}

  on(eventType: string, handler: (payload: Record<string, unknown>) => Promise<void>): void {
    const list = this.handlers.get(eventType) ?? [];
    list.push(handler);
    this.handlers.set(eventType, list);
  }

  async publish(input: DomainEventInput): Promise<number> {
    return this.outbox.enqueue(input);
  }

  async publishAndProcessLocally(input: DomainEventInput): Promise<number> {
    const id = await this.outbox.enqueue(input);
    await this.dispatchHandlers(input.eventType, input.payload);
    await this.outbox.markPublished(id);
    return id;
  }

  async processOutboxBatch(batchSize = 50): Promise<{ processed: number; failed: number }> {
    const events = await this.outbox.claimPending(batchSize);
    let processed = 0;
    let failed = 0;
    for (const event of events) {
      try {
        const payload = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload as Record<string, unknown>;
        await this.dispatchHandlers(String(event.event_type), payload);
        await this.outbox.markPublished(Number(event.id));
        processed += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await this.outbox.markFailed(Number(event.id), message, Number(event.max_attempts ?? 5));
        failed += 1;
      }
    }
    return { processed, failed };
  }

  async replayDeadLetter(id: number): Promise<void> {
    await this.outbox.replayDeadLetter(id);
  }

  async listDeadLetter(): Promise<Record<string, unknown>[]> {
    return (await this.outbox.listDeadLetter()).map((r) => ({
      id: r.id, eventType: r.event_type ?? r.outbox_event_type, status: r.status,
      replayCount: r.replay_count, createdAt: r.created_at,
    }));
  }

  private async dispatchHandlers(eventType: string, payload: Record<string, unknown>): Promise<void> {
    const handlers = this.handlers.get(eventType) ?? [];
    for (const handler of handlers) {
      await handler(payload);
    }
  }
}

export const eventBus = new EventBusService();

// Register default integration event logger
eventBus.on('payment.captured', async (payload) => {
  void payload;
});
