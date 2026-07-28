import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InvoicesApiService } from '../../services/invoices-api.service';
import { CURRENCY_OPTIONS } from '../../constants/invoices.constants';

@Component({
  selector: 'app-invoice-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './invoice-create.component.html',
  styleUrl: './invoice-create.component.scss',
})
export class InvoiceCreateComponent {
  private readonly api = inject(InvoicesApiService);
  private readonly router = inject(Router);
  readonly saving = signal(false);
  readonly error = signal('');

  merchantId = ''; customerId = ''; referenceNumber = '';
  issueDate = new Date().toISOString().slice(0, 10);
  dueDate = ''; currency = 'USD'; notes = ''; internalNotes = '';
  taxAmount = '0'; discountAmount = '0'; generatePaymentLink = false;
  lineItems = [{ description: '', quantity: '1', unitPrice: '', tax: '0', discount: '0' }];
  readonly currencies = CURRENCY_OPTIONS;

  addLine(): void { this.lineItems.push({ description: '', quantity: '1', unitPrice: '', tax: '0', discount: '0' }); }
  removeLine(i: number): void { if (this.lineItems.length > 1) this.lineItems.splice(i, 1); }

  submit(): void {
    const mId = Number(this.merchantId); const cId = Number(this.customerId);
    if (!mId || !cId || !this.dueDate) { this.error.set('Merchant, customer, and due date are required.'); return; }
    const items = this.lineItems.map((li) => ({
      description: li.description.trim(), quantity: Number(li.quantity), unitPrice: Number(li.unitPrice),
      tax: Number(li.tax) || 0, discount: Number(li.discount) || 0,
    })).filter((li) => li.description && li.quantity > 0);
    if (!items.length) { this.error.set('At least one valid line item is required.'); return; }
    this.saving.set(true); this.error.set('');
    this.api.create({
      merchantId: mId, customerId: cId, referenceNumber: this.referenceNumber || undefined,
      issueDate: this.issueDate, dueDate: this.dueDate, currency: this.currency,
      notes: this.notes || undefined, internalNotes: this.internalNotes || undefined,
      taxAmount: Number(this.taxAmount) || 0, discountAmount: Number(this.discountAmount) || 0,
      lineItems: items, generatePaymentLink: this.generatePaymentLink,
    }).subscribe({
      next: (inv) => void this.router.navigate(['/invoices', inv.id]),
      error: () => { this.error.set('Failed to create invoice.'); this.saving.set(false); },
    });
  }
}
