import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SearchIndexService } from '../../core/services/search-index.service';
import { BookmarkService } from '../../core/services/bookmark.service';

@Component({
  selector: 'ep-search-page',
  standalone: true,
  imports: [PageHeaderComponent, MatListModule, RouterLink],
  template: `
    <div class="ep-page">
      <ep-page-header title="Global Search" subtitle="Ranked search across files, endpoints, tables, permissions, knowledge graph" />
      <mat-nav-list>
        @for (r of search.results(); track r.id) {
          <a mat-list-item [routerLink]="r.route ?? '/'" (click)="pick(r)">
            <span matListItemTitle>{{ r.label }}</span>
            <span matListItemLine>{{ r.type }} · score {{ r.score }}</span>
          </a>
        } @empty {
          <p class="ep-muted">Type at least 2 characters in the toolbar search.</p>
        }
      </mat-nav-list>
      @if (search.recent().length) {
        <h3>Recent</h3>
        <mat-nav-list>
          @for (r of search.recent(); track r.id) {
            <a mat-list-item [routerLink]="r.route ?? '/'" >
              <span matListItemTitle>{{ r.label }}</span>
            </a>
          }
        </mat-nav-list>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPage implements OnInit {
  readonly search = inject(SearchIndexService);
  private readonly route = inject(ActivatedRoute);
  readonly bookmarks = inject(BookmarkService);

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap.get('q');
    if (q) this.search.setQuery(q);
  }

  pick(r: { id: string; label: string; route?: string; type: string; score: number }): void {
    this.search.addRecent(r);
  }
}
