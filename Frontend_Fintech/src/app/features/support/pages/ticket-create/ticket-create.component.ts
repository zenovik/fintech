import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupportApiService } from '../../services/support-api.service';
import { TICKET_PRIORITY_CREATE } from '../../constants/support.constants';

@Component({
  selector: 'app-ticket-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './ticket-create.component.html',
  styleUrl: './ticket-create.component.scss',
})
export class TicketCreateComponent {
  private readonly api = inject(SupportApiService);
  private readonly router = inject(Router);
  readonly saving = signal(false);
  readonly error = signal('');
  merchantId = ''; customerId = ''; subject = ''; description = ''; category = 'general'; priority = 'medium';
  relatedEntityType = ''; relatedEntityId = '';
  readonly priorities = TICKET_PRIORITY_CREATE;

  submit(): void {
    if (!this.subject.trim() || !this.description.trim()) { this.error.set('Subject and description are required.'); return; }
    this.saving.set(true);
    this.api.create({
      merchantId: this.merchantId ? Number(this.merchantId) : undefined,
      customerId: this.customerId ? Number(this.customerId) : undefined,
      subject: this.subject.trim(), description: this.description.trim(), category: this.category, priority: this.priority,
      relatedEntityType: this.relatedEntityType || undefined, relatedEntityId: this.relatedEntityId || undefined,
    }).subscribe({
      next: (t) => void this.router.navigate(['/support', t.id]),
      error: (e) => { this.error.set(e?.error?.message ?? 'Failed to create ticket.'); this.saving.set(false); },
    });
  }
}
