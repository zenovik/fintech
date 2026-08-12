import { Injectable, inject, computed, signal } from '@angular/core';
import { PortalDataService } from './portal-data.service';
import type { SearchResult } from '../models/portal.models';

@Injectable({ providedIn: 'root' })
export class SearchIndexService {
  private readonly data = inject(PortalDataService);
  readonly query = signal('');
  readonly recent = signal<SearchResult[]>(this.loadRecent());

  readonly results = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return this.buildIndex()
      .filter((r) => r.label.toLowerCase().includes(q) || r.detail?.toLowerCase().includes(q) || r.type.toLowerCase().includes(q))
      .sort((a, b) => b.score - a.score)
      .slice(0, 80);
  });

  setQuery(q: string): void {
    this.query.set(q);
  }

  addRecent(r: SearchResult): void {
    const list = [r, ...this.recent().filter((x) => x.id !== r.id)].slice(0, 12);
    this.recent.set(list);
    localStorage.setItem('ep-recent', JSON.stringify(list));
  }

  private loadRecent(): SearchResult[] {
    try {
      return JSON.parse(localStorage.getItem('ep-recent') ?? '[]');
    } catch {
      return [];
    }
  }

  private buildIndex(): SearchResult[] {
    const items: SearchResult[] = [];
    for (const ep of this.data.endpoints()) {
      items.push({
        id: `ep:${ep.method}:${ep.fullPath}`,
        type: 'Endpoint',
        label: `${ep.method} ${ep.fullPath}`,
        detail: ep.module,
        route: '/api',
        score: 10,
      });
    }
    for (const t of this.data.tables()) {
      items.push({ id: `tbl:${t}`, type: 'Table', label: t, route: '/database', score: 8 });
    }
    for (const f of this.data.files().slice(0, 2000)) {
      items.push({
        id: `file:${f.path}`,
        type: 'File',
        label: f.path,
        detail: f.language,
        route: '/repository',
        score: 5,
      });
    }
    for (const p of this.data.permissions()) {
      items.push({ id: `perm:${p}`, type: 'Permission', label: p, route: '/security', score: 7 });
    }
    for (const n of this.data.knowledgeGraph()?.nodes?.slice(0, 1500) ?? []) {
      items.push({
        id: n.id,
        type: n.type,
        label: n.label,
        route: '/knowledge-graph',
        score: 6,
      });
    }
    return items;
  }
}
