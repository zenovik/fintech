import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PaymentLinksApiService } from '../../services/payment-links-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { PaymentLinkDetail } from '../../models/payment-links.models';

@Component({
  selector: 'app-payment-link-details',
  standalone: true,
  imports: [CommonModule, RouterLink, MatProgressSpinnerModule, DatePipe, CurrencyPipe],
  templateUrl: './payment-link-details.component.html',
  styleUrl: './payment-link-details.component.scss',
})
export class PaymentLinkDetailsComponent implements OnInit {
  private readonly api = inject(PaymentLinksApiService);
  private readonly route = inject(ActivatedRoute);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly link = signal<PaymentLinkDetail | null>(null);
  readonly saving = signal(false);
  readonly qrDataUrl = signal('');
  readonly copyMsg = signal('');

  ngOnInit(): void { this.load(); }

  load(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.pageState.set('loading');
    this.api.getById(id).subscribe({
      next: (data) => {
        this.link.set(data);
        this.pageState.set('ready');
        this.api.getQrCode(id).subscribe({
          next: (qr) => this.qrDataUrl.set(qr.dataUrl),
          error: () => {},
        });
      },
      error: () => this.pageState.set('error'),
    });
  }

  copyLink(): void {
    const url = this.link()?.publicUrl;
    if (!url) return;
    void navigator.clipboard.writeText(url).then(() => {
      this.copyMsg.set('Copied!');
      setTimeout(() => this.copyMsg.set(''), 2000);
    });
  }

  enable(): void { this.action((id) => this.api.enable(id)); }
  disable(): void { this.action((id) => this.api.disable(id)); }
  expire(): void { this.action((id) => this.api.expire(id)); }
  regenerate(): void { this.action((id) => this.api.regenerateToken(id)); }

  private action(fn: (id: number) => ReturnType<PaymentLinksApiService['enable']>): void {
    const l = this.link();
    if (!l) return;
    this.saving.set(true);
    fn(l.id).subscribe({
      next: (updated) => { this.link.set(updated); this.saving.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  badgeClass(value: string): string { return `pl-badge pl-badge--${value}`; }
  get l() { return this.link()!; }
}
