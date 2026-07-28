import { ActivityRepository } from '../repositories/activity.repository';

export class ActivityService {
  constructor(private readonly repo = new ActivityRepository()) {}

  async timeline(query: { page: number; pageSize: number; source?: string }) {
    const { items, total } = await this.repo.getTimeline(query);
    return {
      items: items.map((i) => ({
        source: i.source, id: i.id, title: i.title, description: i.description,
        actorName: i.actorName, entityType: i.entityType, entityId: i.entityId,
        occurredAt: i.occurredAt, metadata: i.metadata,
      })),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) || 1 },
    };
  }
}
