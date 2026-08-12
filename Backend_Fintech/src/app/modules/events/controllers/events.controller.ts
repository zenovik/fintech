import { Request, Response } from 'express';
import { eventBus } from '../../../shared/events/event-bus.service';
import { getOrganizationId } from '../../../shared/context/org-context';

export class EventsController {
  listDeadLetter = async (_req: Request, res: Response): Promise<void> => {
    res.json(await eventBus.listDeadLetter());
  };

  replayDeadLetter = async (req: Request, res: Response): Promise<void> => {
    await eventBus.replayDeadLetter(Number(req.params.id));
    res.json({ replayed: true, id: Number(req.params.id) });
  };

  publishTest = async (req: Request, res: Response): Promise<void> => {
    const id = await eventBus.publish({
      eventType: String(req.body.eventType ?? 'test.event'),
      aggregateType: String(req.body.aggregateType ?? 'test'),
      aggregateId: String(req.body.aggregateId ?? '1'),
      payload: req.body.payload ?? {},
      organizationId: getOrganizationId() ?? undefined,
    });
    res.status(201).json({ outboxId: id });
  };
}
