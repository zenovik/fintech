import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SubscriptionsApiService } from '../../services/subscriptions-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { SubscriptionDetail } from '../../models/subscriptions.models';

@Component({
  selector: 'app-subscription-details',
  standalone: true,
  imports: [CommonModule, RouterLink, MatProgressSpinnerModule, DatePipe, CurrencyPipe],
  templateUrl: './subscription-details.component.html',
  styleUrl: './subscription-details.component.scss',
})
export class SubscriptionDetailsComponent implements OnInit {
  private readonly api = inject(SubscriptionsApiService);
  private readonly route = inject(ActivatedRoute);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly sub = signal<SubscriptionDetail | null>(null);
  readonly saving = signal(false);
  readonly copyMsg = signal('');

  ngOnInit(): void { this.load(); }

  load(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.pageState.set('loading');
    this.api.getById(id).subscribe({
      next: (data) => { this.sub.set(data); this.pageState.set('ready'); },
      error: () => this.pageState.set('error'),
    });
  }

  copyPayLink(): void {
    const url = this.sub()?.paymentLink?.publicUrl;
    if (!url) return;
    void navigator.clipboard.writeText(url).then(() => {
      this.copyMsg.set('Copied!');
      setTimeout(() => this.copyMsg.set(''), 2000);
    });
  }

  pause(): void { this.action((id) => this.api.pause(id)); }
  cancel(): void { this.action((id) => this.api.cancel(id)); }
  renew(): void { this.action((id) => this.api.renew(id)); }
  markFailed(): void { this.action((id) => this.api.markFailed(id)); }

  private action(fn: (id: number) => ReturnType<SubscriptionsApiService['pause']>): void {
    const s = this.sub();
    if (!s) return;
    this.saving.set(true);
    fn(s.id).subscribe({
      next: (updated) => { this.sub.set(updated); this.saving.set(false); },
      error: () => this.saving.set(false),
    });
  }

  badgeClass(value: string): string { return `sub-badge sub-badge--${value}`; }
  get s() { return this.sub()!; }
}
