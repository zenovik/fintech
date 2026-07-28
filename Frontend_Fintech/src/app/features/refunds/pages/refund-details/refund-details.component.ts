import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RefundsApiService } from '../../services/refunds-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { RefundDetail } from '../../models/refunds.models';

@Component({
  selector: 'app-refund-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, DatePipe, CurrencyPipe, TitleCasePipe],
  templateUrl: './refund-details.component.html',
  styleUrl: './refund-details.component.scss',
})
export class RefundDetailsComponent implements OnInit {
  private readonly api = inject(RefundsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly refund = signal<RefundDetail | null>(null);
  readonly saving = signal(false);
  rejectReason = '';

  ngOnInit(): void { this.load(); }

  load(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.pageState.set('loading');
    this.api.getById(id).subscribe({
      next: (data) => { this.refund.set(data); this.pageState.set('ready'); },
      error: () => this.pageState.set('error'),
    });
  }

  approve(): void {
    const r = this.refund();
    if (!r) return;
    this.saving.set(true);
    this.api.approve(r.id).subscribe({
      next: (updated) => { this.refund.set(updated); this.saving.set(false); },
      error: () => this.saving.set(false),
    });
  }

  reject(): void {
    const r = this.refund();
    if (!r || !this.rejectReason.trim()) return;
    this.saving.set(true);
    this.api.reject(r.id, this.rejectReason.trim()).subscribe({
      next: (updated) => { this.refund.set(updated); this.saving.set(false); this.rejectReason = ''; },
      error: () => this.saving.set(false),
    });
  }

  badgeClass(value: string): string { return `ref-badge ref-badge--${value}`; }

  get r() { return this.refund()!; }
}
