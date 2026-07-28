import { Request, Response } from 'express';
import { QrPaymentService } from '../services/qr-payment.service';
import { sendSuccess } from '../../../shared/responses/api.response';
import { CreateQrBodyDto, PublicQrPayBodyDto, QrListQueryDto, UpdateQrBodyDto } from '../dto';

export class QrPaymentController {
  constructor(private readonly service = new QrPaymentService()) {}

  list = async (req: Request, res: Response) => { sendSuccess(res, await this.service.list(req.query as unknown as QrListQueryDto)); };
  statistics = async (_req: Request, res: Response) => { sendSuccess(res, await this.service.getStatistics()); };
  getById = async (req: Request, res: Response) => { sendSuccess(res, await this.service.getById(Number(req.params.id))); };
  create = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.create(req.body as CreateQrBodyDto, req.user?.sub), 201, 'QR code created');
  };
  update = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.update(Number(req.params.id), req.body as UpdateQrBodyDto, req.user?.sub));
  };
  enable = async (req: Request, res: Response) => { sendSuccess(res, await this.service.enable(Number(req.params.id), req.user?.sub)); };
  disable = async (req: Request, res: Response) => { sendSuccess(res, await this.service.disable(Number(req.params.id), req.user?.sub)); };
  regenerate = async (req: Request, res: Response) => { sendSuccess(res, await this.service.regenerateToken(Number(req.params.id), req.user?.sub)); };
  clone = async (req: Request, res: Response) => { sendSuccess(res, await this.service.clone(Number(req.params.id), req.user?.sub), 201); };
  archive = async (req: Request, res: Response) => { sendSuccess(res, await this.service.archive(Number(req.params.id), req.user?.sub)); };
  bulkCreate = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.bulkCreate(req.body.items as CreateQrBodyDto[], req.user?.sub), 201);
  };
  scanHistory = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.scanHistory(Number(req.params.id), Number(req.query.page ?? 1), Number(req.query.pageSize ?? 25)));
  };
  downloadSvg = async (req: Request, res: Response) => { sendSuccess(res, await this.service.getQrSvg(Number(req.params.id))); };
  templates = async (_req: Request, res: Response) => { sendSuccess(res, await this.service.listTemplates()); };
  categories = async (_req: Request, res: Response) => { sendSuccess(res, await this.service.listCategories()); };
  download = async (req: Request, res: Response) => {
    const { dataUrl, payUrl } = await this.service.getQrImage(Number(req.params.id));
    sendSuccess(res, { dataUrl, payUrl });
  };
}

export class PublicQrPaymentController {
  constructor(private readonly service = new QrPaymentService()) {}

  getByToken = async (req: Request, res: Response) => { sendSuccess(res, await this.service.getPublicQr(req.params.token)); };
  pay = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.processPayment(req.params.token, req.body as PublicQrPayBodyDto), 201, 'Payment processed');
  };
}
