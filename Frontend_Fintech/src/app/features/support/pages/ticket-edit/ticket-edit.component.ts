import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupportApiService } from '../../services/support-api.service';
import { TICKET_PRIORITY_CREATE, TICKET_STATUS_OPTIONS } from '../../constants/support.constants';

@Component({
  selector: 'app-ticket-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './ticket-edit.component.html',
  styleUrl: './ticket-edit.component.scss',
})
export class TicketEditComponent implements OnInit {
  private readonly api = inject(SupportApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly saving = signal(false);
  readonly error = signal('');
  id = 0; subject = ''; description = ''; category = ''; priority = 'medium'; status = 'open';
  readonly priorities = TICKET_PRIORITY_CREATE;
  readonly statuses = TICKET_STATUS_OPTIONS.filter((s) => s.key);

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getById(this.id).subscribe({
      next: (t) => { this.subject = t.subject; this.description = t.description; this.category = t.category; this.priority = t.priority; this.status = t.status; },
      error: () => this.error.set('Failed to load ticket.'),
    });
  }

  submit(): void {
    this.saving.set(true);
    this.api.update(this.id, { subject: this.subject, description: this.description, category: this.category, priority: this.priority, status: this.status }).subscribe({
      next: () => void this.router.navigate(['/support', this.id]),
      error: () => { this.error.set('Failed to update ticket.'); this.saving.set(false); },
    });
  }
}
