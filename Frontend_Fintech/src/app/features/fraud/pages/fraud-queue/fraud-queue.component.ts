import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FraudApiService } from '../../services/fraud-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';

interface FraudCaseItem {
  id: number;
  caseRef: string;
  merchantName?: string;
  fraudScore: number;
  status: string;
  source: string;
}

@Component({
  selector: 'app-fraud-queue',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule],
  templateUrl: './fraud-queue.component.html',
})
export class FraudQueueComponent implements OnInit {
  private readonly api = inject(FraudApiService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly items = signal<FraudCaseItem[]>([]);
  readonly stats = signal<Record<string, number>>({});
  statusFilter = 'pending';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.pageState.set('loading');
    this.api.list({ page: 1, pageSize: 25, status: this.statusFilter || undefined }).subscribe({
      next: (d) => {
        const data = d as { items?: FraudCaseItem[]; stats?: Record<string, number> };
        this.items.set(data.items ?? []);
        this.stats.set(data.stats ?? {});
        this.pageState.set('ready');
      },
      error: () => this.pageState.set('error'),
    });
  }

  approve(id: number): void { this.api.approve(id).subscribe({ next: () => this.load() }); }
  reject(id: number): void { this.api.reject(id).subscribe({ next: () => this.load() }); }
  release(id: number): void { this.api.release(id).subscribe({ next: () => this.load() }); }
}
