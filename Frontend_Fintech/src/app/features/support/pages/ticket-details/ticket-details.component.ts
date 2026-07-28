import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupportApiService } from '../../services/support-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { TicketDetail } from '../../models/support.models';

@Component({
  selector: 'app-ticket-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, DatePipe],
  templateUrl: './ticket-details.component.html',
  styleUrl: './ticket-details.component.scss',
})
export class TicketDetailsComponent implements OnInit {
  private readonly api = inject(SupportApiService);
  private readonly route = inject(ActivatedRoute);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;
  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly ticket = signal<TicketDetail | null>(null);
  readonly saving = signal(false);
  assigneeId = ''; noteBody = ''; escalateReason = '';

  ngOnInit(): void { this.load(); }
  load(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.pageState.set('loading');
    this.api.getById(id).subscribe({ next: (d) => { this.ticket.set(d); this.pageState.set('ready'); }, error: () => this.pageState.set('error') });
  }
  get t() { return this.ticket()!; }
  badgeClass(v: string): string { return `sup-badge sup-badge--${v}`; }

  assign(): void { const id = Number(this.assigneeId); if (!id) return; this.run(() => this.api.assign(this.t.id, id)); }
  escalate(): void { this.run(() => this.api.escalate(this.t.id, this.assigneeId ? Number(this.assigneeId) : undefined, this.escalateReason || undefined)); }
  close(): void { this.run(() => this.api.close(this.t.id)); }
  reopen(): void { this.run(() => this.api.reopen(this.t.id)); }
  addNote(): void { if (!this.noteBody.trim()) return; this.run(() => this.api.addNote(this.t.id, this.noteBody.trim())); this.noteBody = ''; }

  private run(fn: () => ReturnType<SupportApiService['close']>): void {
    this.saving.set(true);
    fn().subscribe({ next: (d) => { this.ticket.set(d); this.saving.set(false); }, error: () => this.saving.set(false) });
  }
}
