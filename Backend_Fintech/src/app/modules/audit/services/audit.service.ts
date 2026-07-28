import { AuditRepository } from '../repositories/audit.repository';
import { ExportFileService } from '../../../shared/services/export-file.service';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { AuditExportQueryDto, AuditListQueryDto, ApiLogListQueryDto, WebhookLogListQueryDto } from '../dto';
import { NotFoundError } from '../../../shared/exceptions/app.exception';

export class AuditService {
  constructor(
    private readonly repo = new AuditRepository(),
    private readonly exportService = new ExportFileService(),
  ) {}

  async list(query: AuditListQueryDto) {
    const result = await this.repo.findAll(query);
    const stats = await this.repo.getStats();
    return { ...result, stats };
  }

  async getById(id: number) {
    const log = await this.repo.findById(id);
    if (!log) throw new NotFoundError('Audit log not found');
    return log;
  }

  async getCategories() {
    return this.repo.getCategories();
  }

  async getActions(categoryCode?: string) {
    return this.repo.getActions(categoryCode);
  }

  async export(userId: number, query: AuditExportQueryDto) {
    const items = await this.repo.findForExport(query);
    const result = await this.exportService.writeCsv(
      'audit-logs',
      ['Timestamp', 'Actor', 'Module', 'Action', 'Description', 'IP Address', 'Risk', 'Entity'],
      items.map((i) => ({
        Timestamp: i.createdAt,
        Actor: i.actorName ?? 'System',
        Module: i.module,
        Action: i.actionCode,
        Description: i.description,
        'IP Address': i.ipAddress ?? '',
        Risk: i.riskLevel,
        Entity: i.entityType ? `${i.entityType}:${i.entityId}` : '',
      })),
      { userId, permissionCode: PERMISSIONS.AUDIT_EXPORT },
    );
    return {
      ...result,
      downloadUrl: this.exportService.buildDownloadUrl(result.fileId),
    };
  }

  async listApiLogs(query: ApiLogListQueryDto) {
    return this.repo.findApiLogs(query);
  }

  async listWebhookLogs(query: WebhookLogListQueryDto) {
    return this.repo.findWebhookLogs(query);
  }
}
