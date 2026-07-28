import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { sendSuccess } from '../../../shared/responses/api.response';
import {
  BroadcastListQueryDto,
  CreateBroadcastBodyDto,
  CreateTemplateBodyDto,
  NotificationListQueryDto,
  TemplateListQueryDto,
  UpdateTemplateBodyDto,
} from '../dto';

export class NotificationController {
  constructor(private readonly service = new NotificationService()) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const data = await this.service.list(req.user!.sub, req.query as unknown as NotificationListQueryDto);
    sendSuccess(res, data);
  };

  unreadCount = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getUnreadCount(req.user!.sub));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getById(Number(req.params.id), req.user!.sub));
  };

  markRead = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.markRead(Number(req.params.id), req.user!.sub), 200, 'Marked as read');
  };

  markAllRead = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.markAllRead(req.user!.sub), 200, 'All notifications marked as read');
  };

  archive = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.archive(Number(req.params.id), req.user!.sub), 200, 'Notification archived');
  };

  archiveAll = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.archiveAll(req.user!.sub), 200, 'All notifications archived');
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.delete(Number(req.params.id), req.user!.sub));
  };

  listTemplates = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.listTemplates(req.query as unknown as TemplateListQueryDto));
  };

  getTemplate = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getTemplate(Number(req.params.id)));
  };

  createTemplate = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.createTemplate(req.body as CreateTemplateBodyDto, req.user?.sub), 201, 'Template created');
  };

  updateTemplate = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.updateTemplate(Number(req.params.id), req.body as UpdateTemplateBodyDto, req.user?.sub), 200, 'Template updated');
  };

  deleteTemplate = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.deleteTemplate(Number(req.params.id), req.user?.sub));
  };

  listBroadcasts = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.listBroadcasts(req.query as unknown as BroadcastListQueryDto));
  };

  createBroadcast = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.createBroadcast(req.body as CreateBroadcastBodyDto, req.user?.sub), 201, 'Broadcast sent');
  };

  getChannels = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getChannels());
  };

  getEvents = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getEvents());
  };

  getGroups = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getGroups());
  };

  listCampaigns = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.listCampaigns({
      page: Number(req.query.page ?? 1), pageSize: Number(req.query.pageSize ?? 25),
      status: req.query.status as string | undefined,
    }));
  };
  getCampaign = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getCampaign(Number(req.params.id)));
  };
  createCampaign = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.createCampaign(req.body, req.user?.sub), 201, 'Campaign created');
  };
  updateCampaign = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.updateCampaign(Number(req.params.id), req.body, req.user?.sub));
  };
  deleteCampaign = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.deleteCampaign(Number(req.params.id), req.user?.sub));
  };
  getTemplateVariables = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getTemplateVariables(Number(req.params.id)));
  };
}
