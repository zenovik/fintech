import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SandboxApiService } from '../../services/sandbox-api.service';

@Component({
  selector: 'app-sandbox-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule],
  templateUrl: './sandbox-dashboard.component.html',
  styleUrl: './sandbox-dashboard.component.scss',
})
export class SandboxDashboardComponent implements OnInit {
  private readonly api = inject(SandboxApiService);

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly dashboard = signal<Record<string, unknown> | null>(null);
  readonly accounts = signal<unknown[]>([]);
  readonly testCards = signal<unknown[]>([]);
  readonly simulations = signal<unknown[]>([]);

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

    this.api.listAccounts({ page: 1, pageSize: 10, merchantId }).subscribe({
      next: (r) => this.accounts.set((r as { items: unknown[] }).items ?? []),
    });

    this.api.listTestCards().subscribe({
      next: (r) => this.testCards.set(Array.isArray(r) ? r : (r as { items: unknown[] }).items ?? []),
    });

    this.api.listSimulations({ page: 1, pageSize: 10 }).subscribe({
      next: (r) => this.simulations.set((r as { items: unknown[] }).items ?? []),
    });
  }

  stats(key: string): Record<string, unknown> {
    return (this.dashboard()?.[key] as Record<string, unknown>) ?? {};
  }

  statNum(section: string, key: string): number {
    return Number(this.stats(section)[key] ?? 0);
  }
}
