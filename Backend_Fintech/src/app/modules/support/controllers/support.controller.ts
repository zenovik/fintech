import { Request, Response } from 'express';
import { SupportService } from '../services/support.service';
import { sendSuccess } from '../../../shared/responses/api.response';
import {
  AddAttachmentBodyDto, AddNoteBodyDto, AssignTicketBodyDto, CreateTicketBodyDto,
  EscalateTicketBodyDto, TicketListQueryDto, UpdateTicketBodyDto,
} from '../dto';

export class SupportController {
  constructor(private readonly service = new SupportService()) {}

  list = async (req: Request, res: Response) => { sendSuccess(res, await this.service.list(req.query as unknown as TicketListQueryDto)); };
  statistics = async (_req: Request, res: Response) => { sendSuccess(res, await this.service.getStatistics()); };
  getById = async (req: Request, res: Response) => { sendSuccess(res, await this.service.getById(Number(req.params.id))); };
  create = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.create(req.body as CreateTicketBodyDto, req.user?.sub), 201, 'Ticket created');
  };
  update = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.update(Number(req.params.id), req.body as UpdateTicketBodyDto, req.user?.sub));
  };
  assign = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.assign(Number(req.params.id), req.body as AssignTicketBodyDto, req.user?.sub));
  };
  reassign = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.reassign(Number(req.params.id), req.body as AssignTicketBodyDto, req.user?.sub));
  };
  escalate = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.escalate(Number(req.params.id), req.body as EscalateTicketBodyDto, req.user?.sub));
  };
  close = async (req: Request, res: Response) => { sendSuccess(res, await this.service.close(Number(req.params.id), req.user?.sub)); };
  reopen = async (req: Request, res: Response) => { sendSuccess(res, await this.service.reopen(Number(req.params.id), req.user?.sub)); };
  addNote = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.addNote(Number(req.params.id), req.body as AddNoteBodyDto, req.user?.sub), 201, 'Note added');
  };
  addAttachment = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.addAttachment(Number(req.params.id), req.body as AddAttachmentBodyDto, req.user?.sub), 201, 'Attachment added');
  };
}
