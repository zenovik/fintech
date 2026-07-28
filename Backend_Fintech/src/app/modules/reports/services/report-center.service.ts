import { getOrganizationId } from '../../../shared/context/org-context';
import { NotFoundError, ValidationError } from '../../../shared/exceptions/app.exception';
import { ExportFileService } from '../../../shared/services/export-file.service';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { auditRecorder } from '../../audit';
import { ReportCenterRepository } from '../repositories/report-center.repository';

export class ReportCenterService {
  constructor(
    private readonly repo = new ReportCenterRepository(),
    private readonly exportFiles = new ExportFileService(),
  ) {}

  async catalog() {
    return (await this.repo.getCatalog()).map((r) => ({
      code: r.code, name: r.name, category: r.category, description: r.description,
      sourceModule: r.source_module, exportFormats: String(r.export_formats).split(','),
    }));
  }

  async savedFilters(reportType?: string, userId?: number) {
    if (!userId) return [];
    return (await this.repo.getSavedFilters(userId, reportType)).map((f) => ({
      id: f.id, reportType: f.report_type, filterName: f.filter_name,
      filters: typeof f.filters === 'string' ? JSON.parse(f.filters) : f.filters,
      isDefault: Boolean(f.is_default),
    }));
  }

  async saveFilter(dto: Record<string, unknown>, userId: number) {
    const orgId = getOrganizationId();
    if (!orgId) throw new ValidationError('Organization context is required');
    await this.repo.saveFilter(dto, userId, orgId);
    return this.savedFilters(dto.reportType as string, userId);
  }

  async deleteFilter(id: number, userId: number) {
    await this.repo.deleteFilter(id, userId);
    return { success: true };
  }

  async generate(reportType: string, _filters?: Record<string, unknown>) {
    const catalog = await this.repo.getCatalog();
    if (!catalog.find((c) => c.code === reportType)) throw new NotFoundError('Report type not found');
    const data = await this.repo.runReportSummary(reportType);
    return { reportType, rowCount: data.rows.length, headers: data.headers, rows: data.rows };
  }

  async exportReport(userId: number, reportType: string, format: 'csv' | 'xlsx' | 'pdf', filters?: Record<string, unknown>) {
    const generated = await this.generate(reportType, filters);
    const stringRows = generated.rows.map((row) => {
      const out: Record<string, string | number | null | undefined> = {};
      for (const h of generated.headers) out[h] = row[h] != null ? String(row[h]) : null;
      return out;
    });

    let fileResult: { fileId: string; fileName: string; rowCount: number };
    const meta = { userId, permissionCode: PERMISSIONS.REPORTS_EXPORT };

    if (format === 'pdf') {
      fileResult = await this.exportFiles.writePdf(`report-${reportType}`, generated.headers, stringRows, meta);
    } else if (format === 'xlsx') {
      fileResult = await this.exportFiles.writeXlsx(`report-${reportType}`, generated.headers, stringRows, meta);
    } else {
      fileResult = await this.exportFiles.writeCsv(`report-${reportType}`, generated.headers, stringRows, meta);
    }

    await this.repo.recordExport(userId, reportType, format, fileResult.fileId, fileResult.rowCount);
    void auditRecorder.record({
      module: 'reports', categoryCode: 'reports', actionCode: 'report_exported',
      entityType: 'report', entityId: reportType, description: `Exported ${reportType} as ${format}`,
      userId, riskLevel: 'low',
    }).catch(() => {});

    return {
      reportType, format, rowCount: fileResult.rowCount,
      downloadUrl: this.exportFiles.buildDownloadUrl(fileResult.fileId),
    };
  }

  async exportHistory(userId: number) {
    return (await this.repo.getExportHistory(userId)).map((e) => ({
      id: e.id, reportType: e.report_type, format: e.format, rowCount: e.row_count,
      downloadFileId: e.file_name, status: e.status, createdAt: e.created_at,
      downloadUrl: e.file_name ? this.exportFiles.buildDownloadUrl(e.file_name) : null,
    }));
  }
}
