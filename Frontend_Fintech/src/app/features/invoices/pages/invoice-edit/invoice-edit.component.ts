import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InvoicesApiService } from '../../services/invoices-api.service';
import { CURRENCY_OPTIONS } from '../../constants/invoices.constants';

@Component({
  selector: 'app-invoice-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './invoice-edit.component.html',
  styleUrl: './invoice-edit.component.scss',
})
export class InvoiceEditComponent implements OnInit {
  private readonly api = inject(InvoicesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly saving = signal(false);
  readonly error = signal('');
  invoiceId = 0;
  merchantId = ''; customerId = ''; referenceNumber = '';
  issueDate = ''; dueDate = ''; currency = 'USD'; notes = ''; internalNotes = '';
  taxAmount = '0'; discountAmount = '0';
  lineItems: Array<{ description: string; quantity: string; unitPrice: string; tax: string; discount: string }> = [];
  readonly currencies = CURRENCY_OPTIONS;

  ngOnInit(): void {
    this.invoiceId = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getById(this.invoiceId).subscribe({
      next: (inv) => {
        if (inv.status !== 'draft') { this.pageState.set('error'); this.error.set('Only draft invoices can be edited.'); return; }
        this.merchantId = String(inv.merchantId); this.customerId = String(inv.customerId);
        this.referenceNumber = inv.referenceNumber ?? ''; this.issueDate = inv.issueDate.slice(0, 10);
        this.dueDate = inv.dueDate.slice(0, 10); this.currency = inv.currency;
        this.notes = inv.notes ?? ''; this.internalNotes = inv.internalNotes ?? '';
        this.taxAmount = String(inv.taxAmount); this.discountAmount = String(inv.discountAmount);
        this.lineItems = inv.lineItems.map((li) => ({
          description: li.description, quantity: String(li.quantity), unitPrice: String(li.unitPrice),
          tax: String(li.tax), discount: String(li.discount),
        }));
        this.pageState.set('ready');
      },
      error: () => this.pageState.set('error'),
    });
  }

  addLine(): void { this.lineItems.push({ description: '', quantity: '1', unitPrice: '', tax: '0', discount: '0' }); }
  removeLine(i: number): void { if (this.lineItems.length > 1) this.lineItems.splice(i, 1); }

  submit(): void {
    const items = this.lineItems.map((li) => ({
      description: li.description.trim(), quantity: Number(li.quantity), unitPrice: Number(li.unitPrice),
      tax: Number(li.tax) || 0, discount: Number(li.discount) || 0,
    })).filter((li) => li.description);
    this.saving.set(true);
    this.api.update(this.invoiceId, {
      merchantId: Number(this.merchantId), customerId: Number(this.customerId),
      referenceNumber: this.referenceNumber || undefined, issueDate: this.issueDate, dueDate: this.dueDate,
      currency: this.currency, notes: this.notes || undefined, internalNotes: this.internalNotes || undefined,
      taxAmount: Number(this.taxAmount) || 0, discountAmount: Number(this.discountAmount) || 0, lineItems: items,
    }).subscribe({
      next: () => void this.router.navigate(['/invoices', this.invoiceId]),
      error: () => { this.error.set('Failed to update invoice.'); this.saving.set(false); },
    });
  }
}
