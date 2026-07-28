import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InvoicesApiService } from '../../services/invoices-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { InvoiceDetail } from '../../models/invoices.models';

@Component({
  selector: 'app-invoice-details',
  standalone: true,
  imports: [CommonModule, RouterLink, MatProgressSpinnerModule, DatePipe, CurrencyPipe],
  templateUrl: './invoice-details.component.html',
  styleUrl: './invoice-details.component.scss',
})
export class InvoiceDetailsComponent implements OnInit {
  private readonly api = inject(InvoicesApiService);
  private readonly route = inject(ActivatedRoute);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly invoice = signal<InvoiceDetail | null>(null);
  readonly saving = signal(false);
  readonly msg = signal('');

  ngOnInit(): void { this.load(); }

  load(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.pageState.set('loading');
    this.api.getById(id).subscribe({
      next: (data) => { this.invoice.set(data); this.pageState.set('ready'); },
      error: () => this.pageState.set('error'),
    });
  }

  act(fn: () => ReturnType<InvoicesApiService['markSent']>): void {
    this.saving.set(true);
    fn().subscribe({
      next: (updated) => { this.invoice.set(updated); this.saving.set(false); },
      error: () => this.saving.set(false),
    });
  }

  send(): void { const inv = this.invoice(); if (inv) this.act(() => this.api.markSent(inv.id)); }
  markOverdue(): void { const inv = this.invoice(); if (inv) this.act(() => this.api.markOverdue(inv.id)); }
  markPaid(): void { const inv = this.invoice(); if (inv) this.act(() => this.api.markPaid(inv.id)); }
  duplicate(): void { const inv = this.invoice(); if (inv) this.act(() => this.api.duplicate(inv.id)); }
  voidInv(): void { const inv = this.invoice(); if (inv) this.act(() => this.api.void(inv.id)); }
  cancel(): void { const inv = this.invoice(); if (inv) this.act(() => this.api.cancel(inv.id)); }
  email(): void {
    const inv = this.invoice(); if (!inv) return;
    this.api.email(inv.id).subscribe({ next: (r) => this.msg.set(`Email queued to ${r.recipient}`) });
  }
  downloadPdf(): void {
    const inv = this.invoice(); if (!inv) return;
    this.api.downloadPdf(inv.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${inv.invoiceNumber}.pdf`; a.click();
        URL.revokeObjectURL(url);
      },
    });
  }
  genLink(): void { const inv = this.invoice(); if (inv) this.act(() => this.api.generatePaymentLink(inv.id)); }
  regenLink(): void { const inv = this.invoice(); if (inv) this.act(() => this.api.regeneratePaymentLink(inv.id)); }
  disableLink(): void { const inv = this.invoice(); if (inv) this.act(() => this.api.disablePaymentLink(inv.id)); }

  copyLink(): void {
    const url = this.invoice()?.paymentLink?.publicUrl;
    if (!url) return;
    void navigator.clipboard.writeText(url).then(() => this.msg.set('Link copied!'));
  }

  badgeClass(v: string): string { return `inv-badge inv-badge--${v}`; }
  get inv() { return this.invoice()!; }
}
