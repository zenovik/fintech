import { Request, Response } from 'express';
import { InvoiceService } from '../services/invoice.service';
import { sendSuccess } from '../../../shared/responses/api.response';
import {
  CreateInvoiceBodyDto,
  EmailInvoiceBodyDto,
  InvoiceListQueryDto,
  MarkPaidBodyDto,
  UpdateInvoiceBodyDto,
} from '../dto';

export class InvoiceController {
  constructor(private readonly service = new InvoiceService()) {}

  list = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.list(req.query as unknown as InvoiceListQueryDto));
  };

  statistics = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getStatistics());
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getById(Number(req.params.id)));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.create(req.body as CreateInvoiceBodyDto, req.user?.sub), 201, 'Invoice created');
  };

  update = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.update(Number(req.params.id), req.body as UpdateInvoiceBodyDto, req.user?.sub), 200, 'Invoice updated');
  };

  duplicate = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.duplicate(Number(req.params.id), req.user?.sub), 201, 'Invoice duplicated');
  };

  voidInvoice = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.voidInvoice(Number(req.params.id), req.user?.sub), 200, 'Invoice voided');
  };

  cancel = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.cancel(Number(req.params.id), req.user?.sub), 200, 'Invoice cancelled');
  };

  markSent = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.markSent(Number(req.params.id), req.user?.sub), 200, 'Invoice marked as sent');
  };

  markViewed = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.markViewed(Number(req.params.id), req.user?.sub), 200, 'Invoice marked as viewed');
  };

  markOverdue = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.markOverdue(Number(req.params.id), req.user?.sub), 200, 'Invoice marked as overdue');
  };

  markPaid = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.markPaid(Number(req.params.id), req.body as MarkPaidBodyDto, req.user?.sub), 200, 'Payment recorded');
  };

  downloadPdf = async (req: Request, res: Response): Promise<void> => {
    const { buffer, filename } = await this.service.downloadPdf(Number(req.params.id));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  };

  email = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.emailInvoice(Number(req.params.id), req.body as EmailInvoiceBodyDto, req.user?.sub), 200, 'Invoice email queued');
  };

  generatePaymentLink = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.generatePaymentLink(Number(req.params.id), req.user?.sub), 201, 'Payment link created');
  };

  regeneratePaymentLink = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.regeneratePaymentLink(Number(req.params.id), req.user?.sub), 200, 'Payment link regenerated');
  };

  disablePaymentLink = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.disablePaymentLink(Number(req.params.id), req.user?.sub), 200, 'Payment link disabled');
  };

  listTemplates = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.listTemplates({ page: Number(req.query.page ?? 1), pageSize: Number(req.query.pageSize ?? 25) }));
  };
  getTemplate = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getTemplate(Number(req.params.id)));
  };
  createTemplate = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.createTemplate(req.body, req.user?.sub), 201, 'Template created');
  };
  updateTemplate = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.updateTemplate(Number(req.params.id), req.body, req.user?.sub));
  };
  deleteTemplate = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.deleteTemplate(Number(req.params.id), req.user?.sub));
  };
  listCreditNotes = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.listCreditNotes({ page: Number(req.query.page ?? 1), pageSize: Number(req.query.pageSize ?? 25) }));
  };
  createCreditNote = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.createCreditNote(req.body, req.user?.sub), 201);
  };
  listDebitNotes = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.listDebitNotes({ page: Number(req.query.page ?? 1), pageSize: Number(req.query.pageSize ?? 25) }));
  };
  createDebitNote = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.createDebitNote(req.body, req.user?.sub), 201);
  };
  analytics = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getAnalytics());
  };
  pdfMetadata = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getPdfMetadata(Number(req.params.id)));
  };
}
