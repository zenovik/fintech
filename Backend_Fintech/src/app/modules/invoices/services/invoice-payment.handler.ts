import { getPool } from '../../../database';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { auditRecorder } from '../../audit';
import { notificationDispatch } from '../../notifications';

/**
 * Called by PaymentLinkService after a successful payment to update linked invoices.
 */
export class InvoicePaymentHandler {
  constructor(private readonly repo = new InvoiceRepository()) {}

  async onPaymentLinkPaid(paymentLinkId: number, transactionId: number, amount: number): Promise<void> {
    const invoice = await this.repo.findByPaymentLinkId(paymentLinkId);
    if (!invoice) return;

    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await this.repo.recordPayment(conn, invoice.id, amount, {
        transactionId,
        paymentLinkId,
        paymentMethod: 'payment_link',
      });
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    const updated = await this.repo.findById(invoice.id);
    if (!updated) return;

    void auditRecorder.record({
      module: 'invoices', categoryCode: 'transactions', actionCode: 'invoice_paid',
      entityType: 'invoice', entityId: String(invoice.id),
      description: `Payment of ${amount} ${invoice.currency} received for invoice ${invoice.invoice_number}.`,
      afterValues: { transactionId, amount, status: updated.status },
      riskLevel: 'medium',
    }).catch(() => {});

    if (invoice.created_by) {
      void notificationDispatch.invoicePaid(
        invoice.created_by, invoice.id, invoice.invoice_number, String(amount), invoice.currency,
      ).catch(() => {});
    }

    if (updated.status === 'paid') {
      const { subscriptionPaymentHandler } = await import('../../subscriptions/services/subscription-payment.handler');
      void subscriptionPaymentHandler.onInvoicePaid(invoice.id).catch(() => {});
    }
  }
}

export const invoicePaymentHandler = new InvoicePaymentHandler();
