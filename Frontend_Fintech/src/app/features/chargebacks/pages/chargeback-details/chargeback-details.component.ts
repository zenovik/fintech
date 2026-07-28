import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChargebacksApiService } from '../../services/chargebacks-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { ChargebackDetail } from '../../models/chargebacks.models';
import { RESOLUTION_OPTIONS } from '../../constants/chargebacks.constants';

@Component({
  selector: 'app-chargeback-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, DatePipe, CurrencyPipe, TitleCasePipe],
  templateUrl: './chargeback-details.component.html',
  styleUrl: './chargeback-details.component.scss',
})
export class ChargebackDetailsComponent implements OnInit {
  private readonly api = inject(ChargebacksApiService);
  private readonly route = inject(ActivatedRoute);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly chargeback = signal<ChargebackDetail | null>(null);
  readonly saving = signal(false);
  readonly activeTab = signal<'overview' | 'evidence' | 'timeline'>('overview');

  representmentNotes = '';
  resolveOutcome = 'won';
  resolveNotes = '';
  evidenceFileName = '';
  evidenceFileUrl = '';
  evidenceDescription = '';

  readonly resolutionOptions = RESOLUTION_OPTIONS;

  ngOnInit(): void { this.load(); }

  load(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.pageState.set('loading');
    this.api.getById(id).subscribe({
      next: (data) => { this.chargeback.set(data); this.pageState.set('ready'); },
      error: () => this.pageState.set('error'),
    });
  }

  setTab(tab: 'overview' | 'evidence' | 'timeline'): void { this.activeTab.set(tab); }

  addEvidence(): void {
    const c = this.chargeback();
    if (!c || !this.evidenceFileName.trim() || !this.evidenceFileUrl.trim()) return;
    this.saving.set(true);
    this.api.addEvidence(c.id, {
      fileName: this.evidenceFileName.trim(),
      fileUrl: this.evidenceFileUrl.trim(),
      description: this.evidenceDescription.trim() || undefined,
    }).subscribe({
      next: (updated) => {
        this.chargeback.set(updated);
        this.evidenceFileName = '';
        this.evidenceFileUrl = '';
        this.evidenceDescription = '';
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  submitRepresentment(): void {
    const c = this.chargeback();
    if (!c || !this.representmentNotes.trim()) return;
    this.saving.set(true);
    this.api.submitRepresentment(c.id, { notes: this.representmentNotes.trim() }).subscribe({
      next: (updated) => { this.chargeback.set(updated); this.representmentNotes = ''; this.saving.set(false); },
      error: () => this.saving.set(false),
    });
  }

  resolve(): void {
    const c = this.chargeback();
    if (!c) return;
    this.saving.set(true);
    this.api.resolve(c.id, {
      outcome: this.resolveOutcome as 'won' | 'lost',
      notes: this.resolveNotes.trim() || undefined,
    }).subscribe({
      next: (updated) => { this.chargeback.set(updated); this.saving.set(false); },
      error: () => this.saving.set(false),
    });
  }

  badgeClass(value: string): string { return `cb-badge cb-badge--${value}`; }
  isResolved(): boolean {
    const s = this.chargeback()?.status;
    return s === 'won' || s === 'lost' || s === 'closed';
  }
  canRepresent(): boolean {
    const s = this.chargeback()?.status;
    return s === 'open' || s === 'evidence_required' || s === 'under_review';
  }

  get c() { return this.chargeback()!; }
}
