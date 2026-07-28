import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, JsonPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuditApiService } from '../../services/audit-api.service';
import { AuditLogDetail } from '../../models/audit.models';

@Component({
  selector: 'app-audit-details',
  standalone: true,
  imports: [CommonModule, RouterLink, MatProgressSpinnerModule, DatePipe, JsonPipe],
  templateUrl: './audit-details.component.html',
  styleUrl: './audit-details.component.scss',
})
export class AuditDetailsComponent implements OnInit {
  private readonly api = inject(AuditApiService);
  private readonly route = inject(ActivatedRoute);

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly errorMessage = signal('');
  readonly log = signal<AuditLogDetail | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getById(id).subscribe({
      next: (data) => {
        this.log.set(data);
        this.pageState.set('ready');
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Failed to load audit log');
        this.pageState.set('error');
      },
    });
  }

  hasDiff(): boolean {
    const l = this.log();
    if (!l) return false;
    return Object.keys(l.beforeValues).length > 0 || Object.keys(l.afterValues).length > 0;
  }

  diffKeys(): string[] {
    const l = this.log();
    if (!l) return [];
    const keys = new Set([...Object.keys(l.beforeValues), ...Object.keys(l.afterValues)]);
    return Array.from(keys);
  }
}
