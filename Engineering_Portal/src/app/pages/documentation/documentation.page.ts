import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatListModule } from '@angular/material/list';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { MarkdownViewerComponent } from '../../shared/components/markdown-viewer/markdown-viewer.component';

interface DocManifest {
  docs?: { path: string; title: string; category: string }[];
}

@Component({
  selector: 'ep-documentation-page',
  standalone: true,
  imports: [PageHeaderComponent, MatListModule, MarkdownViewerComponent],
  template: `
    <div class="ep-page docs-layout">
      <ep-page-header title="Documentation" subtitle="Markdown docs with TOC, Mermaid, and dark mode" />
      <div class="split">
        <mat-nav-list class="doc-list">
          @for (d of docs(); track d.path) {
            <a mat-list-item (click)="loadDoc(d.path)">
              <span matListItemTitle>{{ d.title }}</span>
              <span matListItemLine>{{ d.category }}</span>
            </a>
          } @empty {
            <p class="ep-muted">Loading documentation index…</p>
          }
        </mat-nav-list>
        <div class="doc-view">
          <ep-markdown-viewer [content]="content()" />
        </div>
      </div>
    </div>
  `,
  styles: `
    .split {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 1rem;
    }
    .doc-list {
      border-right: 1px solid rgba(148, 163, 184, 0.2);
      max-height: 70vh;
      overflow: auto;
    }
    @media (max-width: 900px) {
      .split {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentationPage implements OnInit {
  private readonly http = inject(HttpClient);
  readonly docs = signal<{ path: string; title: string; category: string }[]>([]);
  readonly content = signal('');

  ngOnInit(): void {
    this.http.get<DocManifest>('data/docs/manifest.json').subscribe({
      next: (m) => {
        this.docs.set(m.docs ?? []);
        if (m.docs?.[0]) void this.loadDoc(m.docs[0].path);
      },
      error: () => {
        this.docs.set([
          { path: 'about.md', title: 'Engineering Portal', category: 'Portal' },
          { path: 'governance.md', title: 'Governance Overview', category: 'Governance' },
        ]);
        void this.loadDoc('about.md');
      },
    });
  }

  loadDoc(path: string): void {
    this.http.get(`data/docs/${path}`, { responseType: 'text' }).subscribe({
      next: (text) => this.content.set(text),
      error: () =>
        this.content.set(
          `# Documentation\n\nStatic markdown for \`${path}\` will appear here after \`npm run sync-data\` copies docs into \`public/data/docs\`.\n\n\`\`\`mermaid\nflowchart LR\n  Portal --> JSON\n  JSON --> Explorers\n\`\`\``,
        ),
    });
  }
}
