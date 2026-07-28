import { Request, Response } from 'express';
import { OutletService } from '../services/outlet.service';
import { CreateOutletBodyDto, OutletListQueryDto, UpdateOutletBodyDto } from '../dto';

export class OutletController {
  constructor(private readonly service = new OutletService()) {}

  list = async (req: Request, res: Response) => {
    res.json(await this.service.list(req.query as unknown as OutletListQueryDto));
  };

  getById = async (req: Request, res: Response) => {
    res.json(await this.service.getById(Number(req.params.id)));
  };

  create = async (req: Request, res: Response) => {
    res.status(201).json(await this.service.create(req.body as CreateOutletBodyDto, req.user?.sub));
  };

  update = async (req: Request, res: Response) => {
    res.json(await this.service.update(Number(req.params.id), req.body as UpdateOutletBodyDto, req.user?.sub));
  };

  activate = async (req: Request, res: Response) => {
    res.json(await this.service.activate(Number(req.params.id), req.user?.sub));
  };

  deactivate = async (req: Request, res: Response) => {
    res.json(await this.service.deactivate(Number(req.params.id), req.user?.sub));
  };
}
