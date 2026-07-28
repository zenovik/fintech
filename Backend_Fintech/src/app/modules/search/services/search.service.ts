import { auditRecorder } from '../../audit';
import { SearchRepository } from '../repositories/search.repository';

export class SearchService {
  constructor(private readonly repo = new SearchRepository()) {}

  async search(query: string, limit?: number, actorId?: number) {
    const results = await this.repo.search(query, limit ?? 20);
    if (actorId && query.length >= 2) {
      void auditRecorder.record({
        module: 'search', categoryCode: 'system', actionCode: 'global_search',
        entityType: 'search', entityId: '0', description: `Global search: "${query}" (${results.length} results)`,
        userId: actorId, riskLevel: 'low',
      }).catch(() => {});
    }
    return { query, count: results.length, results };
  }
}
