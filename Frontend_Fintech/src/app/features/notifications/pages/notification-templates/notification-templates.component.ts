import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationsApiService } from '../../services/notifications-api.service';
import { NotificationTemplate } from '../../models/notifications.models';
import { DEFAULT_PAGE_SIZE } from '../../constants/notifications.constants';

@Component({
  selector: 'app-notification-templates',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule],
  templateUrl: './notification-templates.component.html',
  styleUrl: './notification-templates.component.scss',
})
export class NotificationTemplatesComponent implements OnInit {
  private readonly api = inject(NotificationsApiService);

  readonly pageState = signal<'loading' | 'error' | 'empty' | 'ready' | 'saving'>('loading');
  readonly errorMessage = signal('');
  readonly templates = signal<NotificationTemplate[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);

  searchInput = '';
  form = { code: '', name: '', eventCode: 'broadcast', channel: 'in_app', subject: '', bodyTemplate: '', category: 'system', isActive: true };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.pageState.set('loading');
    this.api.listTemplates({ page: this.page(), pageSize: DEFAULT_PAGE_SIZE, search: this.searchInput || undefined }).subscribe({
      next: (res) => {
        this.templates.set(res.items);
        this.total.set(res.total);
        this.pageState.set(res.items.length === 0 ? 'empty' : 'ready');
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Failed to load templates');
        this.pageState.set('error');
      },
    });
  }

  onSearch(): void {
    this.page.set(1);
    this.load();
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form = { code: '', name: '', eventCode: 'broadcast', channel: 'in_app', subject: '', bodyTemplate: '', category: 'system', isActive: true };
    this.showForm.set(true);
  }

  openEdit(t: NotificationTemplate): void {
    this.editingId.set(t.id);
    this.form = {
      code: t.code,
      name: t.name,
      eventCode: t.eventCode,
      channel: t.channel,
      subject: t.subject ?? '',
      bodyTemplate: t.bodyTemplate,
      category: t.category,
      isActive: t.isActive,
    };
    this.showForm.set(true);
  }

  save(): void {
    this.pageState.set('saving');
    const id = this.editingId();
    const payload = {
      name: this.form.name,
      eventCode: this.form.eventCode,
      channel: this.form.channel,
      subject: this.form.subject || undefined,
      bodyTemplate: this.form.bodyTemplate,
      category: this.form.category,
      isActive: this.form.isActive,
      ...(id ? {} : { code: this.form.code }),
    };

    const req = id ? this.api.updateTemplate(id, payload) : this.api.createTemplate(payload);
    req.subscribe({
      next: () => {
        this.showForm.set(false);
        this.load();
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Failed to save template');
        this.pageState.set('error');
      },
    });
  }

  deleteTemplate(id: number): void {
    if (!confirm('Delete this template?')) return;
    this.api.deleteTemplate(id).subscribe({ next: () => this.load() });
  }
}
