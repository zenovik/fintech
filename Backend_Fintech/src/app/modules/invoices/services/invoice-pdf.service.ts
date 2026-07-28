import PDFDocument from 'pdfkit';
import { InvoiceLineItemRow, InvoiceRow } from '../types/invoice.types';

export async function generateInvoicePdf(invoice: InvoiceRow, lineItems: InvoiceLineItemRow[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text('INVOICE', { align: 'right' });
    doc.moveDown();
    doc.fontSize(12).text(invoice.organization_name ?? 'Organization', { align: 'left' });
    doc.fontSize(10).text(`Invoice #: ${invoice.invoice_number}`);
    if (invoice.reference_number) doc.text(`Reference: ${invoice.reference_number}`);
    doc.text(`Issue Date: ${invoice.issue_date}`);
    doc.text(`Due Date: ${invoice.due_date}`);
    doc.text(`Status: ${invoice.status.toUpperCase()}`);
    doc.moveDown();

    doc.fontSize(11).text('Bill To:', { underline: true });
    doc.fontSize(10).text(invoice.customer_name ?? '');
    if (invoice.customer_email) doc.text(invoice.customer_email);
    doc.moveDown();

    const tableTop = doc.y;
    doc.fontSize(9).text('Description', 50, tableTop, { width: 220 });
    doc.text('Qty', 280, tableTop);
    doc.text('Unit', 320, tableTop);
    doc.text('Tax', 380, tableTop);
    doc.text('Total', 440, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let y = tableTop + 22;
    for (const item of lineItems) {
      doc.text(item.description.substring(0, 40), 50, y, { width: 220 });
      doc.text(String(item.quantity), 280, y);
      doc.text(Number(item.unit_price).toFixed(2), 320, y);
      doc.text(Number(item.tax_amount).toFixed(2), 380, y);
      doc.text(Number(item.line_total).toFixed(2), 440, y);
      y += 18;
    }

    doc.moveDown(2);
    y = Math.max(y + 10, doc.y);
    doc.text(`Subtotal: ${invoice.currency} ${Number(invoice.subtotal).toFixed(2)}`, 350, y, { align: 'right', width: 200 });
    doc.text(`Discount: ${invoice.currency} ${Number(invoice.discount_amount).toFixed(2)}`, 350, y + 15, { align: 'right', width: 200 });
    doc.text(`Tax: ${invoice.currency} ${Number(invoice.tax_amount).toFixed(2)}`, 350, y + 30, { align: 'right', width: 200 });
    doc.fontSize(12).text(`Total: ${invoice.currency} ${Number(invoice.total).toFixed(2)}`, 350, y + 50, { align: 'right', width: 200 });
    doc.fontSize(10).text(`Paid: ${invoice.currency} ${Number(invoice.amount_paid).toFixed(2)}`, 350, y + 70, { align: 'right', width: 200 });
    doc.text(`Balance Due: ${invoice.currency} ${Number(invoice.balance_due).toFixed(2)}`, 350, y + 85, { align: 'right', width: 200 });

    if (invoice.notes) {
      doc.moveDown(3);
      doc.fontSize(10).text('Notes:', { underline: true });
      doc.text(invoice.notes);
    }

    doc.end();
  });
}
