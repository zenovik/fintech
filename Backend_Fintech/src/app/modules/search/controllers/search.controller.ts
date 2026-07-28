import { Request, Response } from 'express';
import { SearchService } from '../services/search.service';

export class SearchController {
  constructor(private readonly service = new SearchService()) {}

  search = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.search(String(req.query.q ?? ''), req.query.limit ? Number(req.query.limit) : undefined, req.user?.sub));
  };
}
