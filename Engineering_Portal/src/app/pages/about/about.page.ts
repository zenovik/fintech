import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { MarkdownViewerComponent } from '../../shared/components/markdown-viewer/markdown-viewer.component';

@Component({
  selector: 'ep-about-page',
  standalone: true,
  imports: [PageHeaderComponent, MatCardModule, MarkdownViewerComponent],
  template: `
    <div class="ep-page">
      <ep-page-header title="About" subtitle="Enterprise Engineering Documentation Portal — Phase 9" />
      <mat-card class="ep-card">
        <mat-card-content>
          <ep-markdown-viewer [content]="about" />
        </mat-card-content>
      </mat-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPage {
  readonly about = `# Engineering Portal

Static Angular 19 application for browsing, searching, and visualizing fintech repository intelligence.

## Data Sources

- \`engineering-intelligence/output/json\`
- \`frontend-analysis/output/json\`
- \`backend-analysis/output/json\`
- \`engineering-knowledge/\`
- \`docs/07_Governance/json\`
- \`docs/08_Enterprise_Delivery/json\`

## Features

- Dashboard scores and metrics
- Repository, API, database, frontend, backend explorers
- Knowledge & dependency graphs
- Global search with ranked results
- Markdown documentation with Mermaid
- Dark/light themes, bookmarks, offline localStorage

**No production code modified.** Portal reads generated JSON only.
`;
}
