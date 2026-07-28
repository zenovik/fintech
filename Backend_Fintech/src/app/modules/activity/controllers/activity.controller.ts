import { Request, Response } from 'express';
import { ActivityService } from '../services/activity.service';

export class ActivityController {
  constructor(private readonly service = new ActivityService()) {}

  timeline = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.timeline({
      page: Number(req.query.page ?? 1),
      pageSize: Number(req.query.pageSize ?? 25),
      source: req.query.source as string | undefined,
    }));
  };
}
