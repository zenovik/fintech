import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivityApiService, ActivityTimelineItem } from '../../services/activity-api.service';

const SOURCE_OPTIONS = ['', 'audit', 'notification', 'workflow', 'device', 'settlement', 'risk', 'dashboard'];

@Component({
  selector: 'app-activity-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, DatePipe, TitleCasePipe],
  templateUrl: './activity-timeline.component.html',
  styleUrl: './activity-timeline.component.scss',
})
export class ActivityTimelineComponent implements OnInit {
  private readonly api = inject(ActivityApiService);

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly items = signal<ActivityTimelineItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = 25;
  readonly sourceOptions = SOURCE_OPTIONS;

  sourceFilter = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.pageState.set('loading');
    this.api.getTimeline({ page: this.page(), pageSize: this.pageSize, source: this.sourceFilter || undefined }).subscribe({
      next: (d) => {
        this.items.set(d.items);
        this.total.set(d.pagination.total);
        this.pageState.set('ready');
      },
      error: () => this.pageState.set('error'),
    });
  }

  onFilterChange(): void {
    this.page.set(1);
    this.load();
  }

  sourceIcon(source: string): string {
    const map: Record<string, string> = {
      audit: 'shield',
      notification: 'notifications',
      workflow: 'account_tree',
      device: 'devices',
      settlement: 'account_balance',
      risk: 'gavel',
      dashboard: 'dashboard',
    };
    return map[source] ?? 'history';
  }
}
