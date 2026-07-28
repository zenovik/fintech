import { Request, Response } from 'express';
import { DeviceService } from '../services/device.service';

export class DeviceController {
  constructor(private readonly service = new DeviceService()) {}

  list = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.list({
      page: Number(req.query.page ?? 1), pageSize: Number(req.query.pageSize ?? 25),
      search: req.query.search as string | undefined, status: req.query.status as string | undefined,
      deviceType: req.query.deviceType as string | undefined, merchantId: req.query.merchantId ? Number(req.query.merchantId) : undefined,
      outletId: req.query.outletId ? Number(req.query.outletId) : undefined, healthStatus: req.query.healthStatus as string | undefined,
    }));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.getById(Number(req.params.id)));
  };

  provision = async (req: Request, res: Response): Promise<void> => {
    res.status(201).json(await this.service.provision(req.body, req.user?.sub));
  };

  activate = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.activate(Number(req.params.id), req.body, req.user?.sub));
  };

  deactivate = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.deactivate(Number(req.params.id), req.user?.sub));
  };

  transfer = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.transfer(Number(req.params.id), req.body, req.user?.sub));
  };

  replace = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.replace(Number(req.params.id), req.body.newDeviceId, req.user?.sub));
  };

  sync = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.sync(Number(req.params.id), req.body));
  };

  inventory = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.inventory({
      page: Number(req.query.page ?? 1), pageSize: Number(req.query.pageSize ?? 25),
      search: req.query.search as string | undefined, status: req.query.status as string | undefined,
    }));
  };
}
