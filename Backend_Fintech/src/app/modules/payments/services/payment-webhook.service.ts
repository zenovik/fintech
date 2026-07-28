import { randomUUID } from 'node:crypto';

import { RowDataPacket } from 'mysql2/promise';

import { getPool } from '../../../database';

import { PaymentRepository } from '../repositories/payment.repository';

import { WebhookEventType } from '../constants/payment-status';

import { getRequestContext } from '../../../shared/context/request-context';



export class PaymentWebhookService {

  constructor(private readonly repo = new PaymentRepository(), private readonly pool = getPool()) {}



  async dispatch(merchantId: number, intentId: number, eventType: WebhookEventType, payload: Record<string, unknown>): Promise<void> {

    const url = await this.repo.getMerchantWebhookUrl(merchantId);

    if (!url) return;



    const deliveryUuid = randomUUID();

    const correlationId = getRequestContext()?.requestId ?? randomUUID();

    const deliveryId = await this.repo.enqueueWebhook(merchantId, intentId, eventType, url, payload);



    try {

      await this.pool.query(

        `INSERT INTO webhook_logs (uuid, correlation_id, event_type, url, status, status_code, payload, attempt_count, delivered_at)

         VALUES (?, ?, ?, ?, 'pending', NULL, ?, 0, NULL)`,

        [deliveryUuid, correlationId, eventType, url, JSON.stringify(payload)],

      );

    } catch {

      // webhook_logs is best-effort

    }



    // Delivery is processed asynchronously by the worker process

    void deliveryId;

  }



  async retryPending(): Promise<number> {

    const [rows] = await this.pool.query<RowDataPacket[]>(

      `SELECT id FROM payment_webhook_deliveries

       WHERE status = 'failed' AND attempt_count < max_attempts

         AND (next_retry_at IS NULL OR next_retry_at <= NOW())

       LIMIT 50`,

    );

    return rows.length;

  }

}

