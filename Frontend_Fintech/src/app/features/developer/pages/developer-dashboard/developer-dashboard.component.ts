import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DeveloperApiService } from '../../services/developer-api.service';

@Component({
  selector: 'app-developer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, DecimalPipe],
  templateUrl: './developer-dashboard.component.html',
  styleUrl: './developer-dashboard.component.scss',
})
export class DeveloperDashboardComponent implements OnInit {
  private readonly api = inject(DeveloperApiService);

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly dashboard = signal<Record<string, unknown> | null>(null);
  readonly apiKeys = signal<unknown[]>([]);
  readonly oauthApps = signal<unknown[]>([]);
  readonly usage = signal<Record<string, unknown> | null>(null);

  merchantFilter = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.pageState.set('loading');
    const merchantId = this.merchantFilter ? Number(this.merchantFilter) : undefined;

    this.api.dashboard(merchantId).subscribe({
      next: (d) => {
        this.dashboard.set(d as Record<string, unknown>);
        this.pageState.set('ready');
      },
      error: () => this.pageState.set('error'),
    });

    this.api.listApiKeys({ page: 1, pageSize: 10, merchantId }).subscribe({
      next: (r) => this.apiKeys.set((r as { items: unknown[] }).items ?? []),
    });

    this.api.listOAuthApps({ page: 1, pageSize: 10 }).subscribe({
      next: (r) => this.oauthApps.set((r as { items: unknown[] }).items ?? []),
    });

    this.api.getUsage().subscribe({
      next: (u) => this.usage.set(u as Record<string, unknown>),
    });
  }

  stats(key: string): Record<string, unknown> {
    return (this.dashboard()?.[key] as Record<string, unknown>) ?? {};
  }

  statNum(section: string, key: string): number {
    return Number(this.stats(section)[key] ?? 0);
  }

  playgroundLinks(): { label: string; url: string }[] {
    const links = this.dashboard()?.['playgroundLinks'];
    return Array.isArray(links) ? (links as { label: string; url: string }[]) : [];
  }
}
