import { promises as fs, createWriteStream } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import PDFDocument from 'pdfkit';
import { buildCsv } from '../utils/csv.util';
import { ExportRegistryRepository } from '../repositories/export-registry.repository';
import { getOrganizationId } from '../context/org-context';

const EXPORTS_DIR = path.join(process.cwd(), 'uploads', 'exports');

export interface ExportFileMeta {
  userId: number;
  permissionCode: string;
  organizationId?: number;
}

export class ExportFileService {
  constructor(private readonly registry = new ExportRegistryRepository()) {}

  private async registerFile(fileId: string, meta?: ExportFileMeta) {
    if (meta) {
      await this.registry.register({
        fileId,
        userId: meta.userId,
        organizationId: meta.organizationId ?? getOrganizationId(),
        permissionCode: meta.permissionCode,
      });
    }
  }

  async writeCsv(
    prefix: string,
    headers: string[],
    rows: Array<Record<string, string | number | null | undefined>>,
    meta?: ExportFileMeta,
  ): Promise<{ fileId: string; fileName: string; rowCount: number }> {
    await fs.mkdir(EXPORTS_DIR, { recursive: true });
    const fileId = `${randomUUID()}.csv`;
    const fileName = `${prefix}-${Date.now()}.csv`;
    const content = buildCsv(headers, rows);
    await fs.writeFile(path.join(EXPORTS_DIR, fileId), content, 'utf8');
    await this.registerFile(fileId, meta);
    return { fileId, fileName, rowCount: rows.length };
  }

  async writeXlsx(
    prefix: string,
    headers: string[],
    rows: Array<Record<string, string | number | null | undefined>>,
    meta?: ExportFileMeta,
  ): Promise<{ fileId: string; fileName: string; rowCount: number }> {
    await fs.mkdir(EXPORTS_DIR, { recursive: true });
    const fileId = `${randomUUID()}.xlsx`;
    const fileName = `${prefix}-${Date.now()}.xlsx`;
    const escape = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const headerRow = headers.map((h) => `<Cell><Data ss:Type="String">${escape(h)}</Data></Cell>`).join('');
    const dataRows = rows.map((row) => {
      const cells = headers.map((h) => `<Cell><Data ss:Type="String">${escape(String(row[h] ?? ''))}</Data></Cell>`).join('');
      return `<Row>${cells}</Row>`;
    }).join('');
    const xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Report"><Table><Row>${headerRow}</Row>${dataRows}</Table></Worksheet></Workbook>`;
    await fs.writeFile(path.join(EXPORTS_DIR, fileId), xml, 'utf8');
    await this.registerFile(fileId, meta);
    return { fileId, fileName, rowCount: rows.length };
  }

  async writePdf(
    prefix: string,
    headers: string[],
    rows: Array<Record<string, string | number | null | undefined>>,
    meta?: ExportFileMeta,
  ): Promise<{ fileId: string; fileName: string; rowCount: number }> {
    await fs.mkdir(EXPORTS_DIR, { recursive: true });
    const fileId = `${randomUUID()}.pdf`;
    const fileName = `${prefix}-${Date.now()}.pdf`;
    const filePath = path.join(EXPORTS_DIR, fileId);
    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const stream = doc.pipe(createWriteStream(filePath));
      doc.fontSize(14).text(prefix.replace(/-/g, ' ').toUpperCase(), { underline: true });
      doc.moveDown();
      doc.fontSize(9).text(headers.join(' | '));
      doc.moveDown(0.5);
      for (const row of rows.slice(0, 100)) {
        doc.text(headers.map((h) => String(row[h] ?? '')).join(' | '));
      }
      if (rows.length > 100) doc.text(`... and ${rows.length - 100} more rows`);
      doc.end();
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });
    await this.registerFile(fileId, meta);
    return { fileId, fileName, rowCount: rows.length };
  }

  resolveFilePath(fileId: string): string | null {
    if (!/^[0-9a-f-]{36}\.(csv|xlsx|pdf)$/i.test(fileId)) {
      return null;
    }
    return path.join(EXPORTS_DIR, fileId);
  }

  buildDownloadUrl(fileId: string): string {
    return `/api/v1/exports/${fileId}`;
  }
}
