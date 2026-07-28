import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { QrPaymentsApiService } from '../../services/qr-payments-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { QrCodeDetail } from '../../models/qr-payments.models';

@Component({
  selector: 'app-qr-details',
  standalone: true,
  imports: [CommonModule, RouterLink, MatProgressSpinnerModule, DatePipe, CurrencyPipe],
  templateUrl: './qr-details.component.html',
  styleUrl: './qr-details.component.scss',
})
export class QrDetailsComponent implements OnInit {
  private readonly api = inject(QrPaymentsApiService);
  private readonly route = inject(ActivatedRoute);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly qr = signal<QrCodeDetail | null>(null);
  readonly saving = signal(false);
  readonly qrDataUrl = signal('');
  readonly copyMsg = signal('');

  ngOnInit(): void { this.load(); }

  load(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.pageState.set('loading');
    this.api.getById(id).subscribe({
      next: (data) => {
        this.qr.set(data);
        this.pageState.set('ready');
        this.api.download(id).subscribe({
          next: (res) => this.qrDataUrl.set(res.dataUrl),
          error: () => {},
        });
      },
      error: () => this.pageState.set('error'),
    });
  }

  copyLink(): void {
    const url = this.qr()?.payUrl;
    if (!url) return;
    void navigator.clipboard.writeText(url).then(() => {
      this.copyMsg.set('Copied!');
      setTimeout(() => this.copyMsg.set(''), 2000);
    });
  }

  downloadQr(): void {
    const dataUrl = this.qrDataUrl();
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${this.qr()?.qrRef ?? 'qr-code'}.png`;
    a.click();
  }

  enable(): void { this.action((id) => this.api.enable(id)); }
  disable(): void { this.action((id) => this.api.disable(id)); }
  regenerate(): void { this.action((id) => this.api.regenerate(id)); }

  private action(fn: (id: number) => ReturnType<QrPaymentsApiService['enable']>): void {
    const q = this.qr();
    if (!q) return;
    this.saving.set(true);
    fn(q.id).subscribe({
      next: (updated) => { this.qr.set(updated); this.saving.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  badgeClass(value: string): string { return `qr-badge qr-badge--${value}`; }
  get q() { return this.qr()!; }
}
