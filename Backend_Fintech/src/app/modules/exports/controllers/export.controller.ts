import { Request, Response } from 'express';
import { promises as fs } from 'fs';
import { ExportFileService } from '../../../shared/services/export-file.service';
import { ExportRegistryRepository } from '../../../shared/repositories/export-registry.repository';
import { PermissionRepository } from '../../../shared/rbac/permission.repository';
import { filterPermissionsByOrgRole } from '../../../shared/rbac/organization-role.permissions';
import { ForbiddenError, NotFoundError } from '../../../shared/exceptions/app.exception';

export class ExportController {
  constructor(
    private readonly exportFiles = new ExportFileService(),
    private readonly registry = new ExportRegistryRepository(),
    private readonly permissionRepo = new PermissionRepository(),
  ) {}

  download = async (req: Request, res: Response): Promise<void> => {
    const fileId = req.params['fileId'];
    const filePath = this.exportFiles.resolveFilePath(fileId);
    if (!filePath) {
      throw new NotFoundError('Export file not found');
    }

    const entry = await this.registry.findByFileId(fileId);
    if (!entry) {
      throw new NotFoundError('Export file not found');
    }
    if (entry.user_id !== req.user!.sub) {
      throw new ForbiddenError('You do not have access to this export file');
    }
    if (entry.organization_id && req.organizationId && entry.organization_id !== req.organizationId) {
      throw new ForbiddenError('You do not have access to this export file');
    }

    const globalPermissions = await this.permissionRepo.getPermissionCodesForUser(req.user!.sub);
    const userPermissions = req.user!.organizationRoleCode
      ? filterPermissionsByOrgRole(globalPermissions, req.user!.organizationRoleCode)
      : globalPermissions;
    const allowed = userPermissions.includes('*') || userPermissions.includes(entry.permission_code);
    if (!allowed) {
      throw new ForbiddenError('You do not have permission to download this export');
    }

    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundError('Export file not found');
    }

    const ext = fileId.split('.').pop()?.toLowerCase();
    const contentType = ext === 'pdf' ? 'application/pdf' : ext === 'xlsx' ? 'application/vnd.ms-excel' : 'text/csv; charset=utf-8';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileId}"`);
    res.sendFile(filePath);
  };
}
