import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReportsApiService } from '../../services/reports-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { EXPORT_FORMATS } from '../../constants/reports.constants';
import { downloadAuthenticatedExport } from '../../../../shared/utils/download.util';
import { TokenStorageService } from '../../../../core/auth/services/token-storage.service';

interface CatalogItem {
  code: string;
  name: string;
  category: string;
  description: string;
  sourceModule: string;
  exportFormats: string[];
}

@Component({
  selector: 'app-report-center',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, DatePipe, TitleCasePipe],
  templateUrl: './report-center.component.html',
  styleUrl: './report-center.component.scss',
})
export class ReportCenterComponent implements OnInit {
  private readonly api = inject(ReportsApiService);
  private readonly tokenStorage = inject(TokenStorageService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;
  readonly formats = EXPORT_FORMATS;

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly catalog = signal<CatalogItem[]>([]);
  readonly savedFilters = signal<{ id: number; filterName: string; reportType: string }[]>([]);
  readonly exportHistory = signal<{ id: number; reportType: string; format: string; rowCount: number; downloadUrl: string | null; createdAt: string }[]>([]);
  readonly preview = signal<{ headers: string[]; rows: Record<string, unknown>[]; rowCount: number } | null>(null);
  readonly generating = signal(false);
  readonly exporting = signal(false);

  selectedReport = signal('');
  categoryFilter = '';
  newFilterName = '';
  readonly categories = computed(() => [...new Set(this.catalog().map((c) => c.category))].sort());
  readonly filteredCatalog = computed(() => {
    const cat = this.categoryFilter;
    return cat ? this.catalog().filter((c) => c.category === cat) : this.catalog();
  });
  readonly selectedReportItem = computed(() => this.catalog().find((c) => c.code === this.selectedReport()) ?? null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.pageState.set('loading');
    this.api.getCenterCatalog().subscribe({
      next: (items) => {
        this.catalog.set(items);
        if (!this.selectedReport() && items.length) this.selectedReport.set(items[0].code);
        this.loadSavedFilters();
        this.loadExportHistory();
        this.pageState.set('ready');
      },
      error: () => this.pageState.set('error'),
    });
  }

  loadSavedFilters(): void {
    this.api.getCenterSavedFilters(this.selectedReport() || undefined).subscribe({
      next: (f) => this.savedFilters.set(f.map((x) => ({ id: x.id, filterName: x.filterName, reportType: x.reportType }))),
    });
  }

  loadExportHistory(): void {
    this.api.getCenterExportHistory().subscribe({ next: (h) => this.exportHistory.set(h) });
  }

  onSelectReport(code: string): void {
    this.selectedReport.set(code);
    this.preview.set(null);
    this.loadSavedFilters();
  }

  generate(): void {
    if (!this.selectedReport()) return;
    this.generating.set(true);
    this.api.generateCenterReport(this.selectedReport()).subscribe({
      next: (d) => {
        this.preview.set({ headers: d.headers, rows: d.rows.slice(0, 50), rowCount: d.rowCount });
        this.generating.set(false);
      },
      error: () => this.generating.set(false),
    });
  }

  export(format: string): void {
    if (!this.selectedReport() || !this.rbac.hasPermission(this.perms.REPORTS_EXPORT)) return;
    this.exporting.set(true);
    this.api.exportCenterReport(this.selectedReport(), format).subscribe({
      next: async (d) => {
        this.exporting.set(false);
        const token = this.tokenStorage.getAccessToken();
        if (d.downloadUrl && token) await downloadAuthenticatedExport(d.downloadUrl, token);
        this.loadExportHistory();
      },
      error: () => this.exporting.set(false),
    });
  }

  saveFilter(): void {
    if (!this.newFilterName.trim() || !this.selectedReport() || !this.rbac.hasPermission(this.perms.REPORTS_WRITE)) return;
    this.api.saveCenterFilter({ reportType: this.selectedReport(), filterName: this.newFilterName.trim(), filters: { period: '30d' } }).subscribe({
      next: () => { this.newFilterName = ''; this.loadSavedFilters(); },
    });
  }
}
