import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OnboardingApprovalApiService } from '../../services/onboarding-approval-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';

interface QueueItem {
  id: number;
  applicationId: number;
  applicationRef: string;
  businessName: string;
  stageName: string;
  priority: string;
  workflowStatus: string;
  slaDueAt: string | null;
  slaBreached: boolean;
}

@Component({
  selector: 'app-compliance-queue',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './compliance-queue.component.html',
  styleUrl: './compliance-queue.component.scss',
})
export class ComplianceQueueComponent implements OnInit {
  private readonly api = inject(OnboardingApprovalApiService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly items = signal<QueueItem[]>([]);
  readonly total = signal(0);
  queueFilter = 'pending';
  searchInput = '';
  readonly page = signal(1);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.pageState.set('loading');
    this.api.complianceQueue({
      queue: this.queueFilter,
      page: this.page(),
      pageSize: 20,
      search: this.searchInput || undefined,
    }).subscribe({
      next: (d) => {
        const data = d as { items?: QueueItem[]; pagination?: { total: number } };
        this.items.set(data.items ?? []);
        this.total.set(data.pagination?.total ?? 0);
        this.pageState.set('ready');
      },
      error: () => this.pageState.set('error'),
    });
  }

  approve(id: number): void {
    this.api.approve(id).subscribe({ next: () => this.load() });
  }
}
