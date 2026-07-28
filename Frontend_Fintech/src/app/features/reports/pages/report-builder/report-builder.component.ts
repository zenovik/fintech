import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReportsApiService } from '../../services/reports-api.service';
import { NotificationService } from '../../../../core/auth/services/notification.service';
import { ReportCategory, ReportTemplate } from '../../models/reports.models';
import { REPORT_STATUSES, PERIOD_TYPES } from '../../constants/reports.constants';

@Component({
  selector: 'app-report-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './report-builder.component.html',
  styleUrl: './report-builder.component.scss',
})
export class ReportBuilderComponent implements OnInit {
  private readonly api = inject(ReportsApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notification = inject(NotificationService);

  templates: ReportTemplate[] = [];
  categories: ReportCategory[] = [];
  loading = true;
  saving = false;
  editId: number | null = null;

  name = '';
  description = '';
  templateId: number | null = null;
  categoryId: number | null = null;
  status = 'active';
  period = 'monthly';

  readonly statuses = REPORT_STATUSES;
  readonly periods = PERIOD_TYPES;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.editId = Number(id);

    this.api.getTemplates().subscribe({ next: (t) => this.templates = t });
    this.api.getCategories().subscribe({ next: (c) => this.categories = c });

    if (this.editId) {
      this.api.getById(this.editId).subscribe({
        next: (r) => {
          this.name = r.name;
          this.description = r.description ?? '';
          this.templateId = r.templateId;
          this.categoryId = r.categoryId;
          this.status = r.status;
          this.period = (r.filters?.['period'] as string) ?? 'monthly';
          this.loading = false;
        },
        error: () => { this.loading = false; },
      });
    } else {
      this.loading = false;
    }
  }

  onSave(): void {
    if (!this.name.trim()) { this.notification.error('Name is required'); return; }
    this.saving = true;
    const body = {
      name: this.name,
      description: this.description || undefined,
      templateId: this.templateId ?? undefined,
      categoryId: this.categoryId ?? undefined,
      status: this.status as 'draft' | 'active' | 'archived',
      filters: { period: this.period },
    };
    const req = this.editId ? this.api.update(this.editId, body) : this.api.create(body);
    req.subscribe({
      next: () => {
        this.notification.success(this.editId ? 'Report updated' : 'Report created');
        this.router.navigate(['/reports']);
      },
      error: () => { this.saving = false; this.notification.error('Save failed'); },
    });
  }
}
