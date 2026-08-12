import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  ElementRef,
  viewChild,
} from '@angular/core';
import { marked } from 'marked';
import mermaid from 'mermaid';

@Component({
  selector: 'ep-markdown-viewer',
  standalone: true,
  template: `<article class="md-body" #container></article>`,
  styles: `
    .md-body {
      line-height: 1.65;
      max-width: 900px;
    }
    .md-body :is(h1, h2, h3) {
      margin-top: 1.5rem;
    }
    .md-body pre {
      overflow-x: auto;
      padding: 1rem;
      border-radius: 8px;
      background: #1e293b;
    }
    .md-body table {
      width: 100%;
      border-collapse: collapse;
    }
    .md-body th,
    .md-body td {
      border: 1px solid rgba(148, 163, 184, 0.3);
      padding: 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownViewerComponent {
  readonly content = input('');
  private readonly container = viewChild<ElementRef<HTMLElement>>('container');

  constructor() {
    mermaid.initialize({ startOnLoad: false, theme: 'dark' });
    effect(() => {
      void this.render(this.content());
    });
  }

  private async render(raw: string): Promise<void> {
    const el = this.container()?.nativeElement;
    if (!el) return;
    if (!raw) {
      el.innerHTML = '<p class="ep-muted">No content.</p>';
      return;
    }
    const html = await marked.parse(raw);
    el.innerHTML = typeof html === 'string' ? html : '';
    const blocks = el.querySelectorAll('code.language-mermaid');
    for (const block of Array.from(blocks)) {
      const parent = block.parentElement;
      if (!parent) continue;
      const graph = block.textContent ?? '';
      const id = `mmd-${Math.random().toString(36).slice(2)}`;
      try {
        const { svg } = await mermaid.render(id, graph);
        parent.outerHTML = svg;
      } catch {
        /* keep raw block */
      }
    }
  }
}
