import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { SlicePipe } from '@angular/common';
import { SettingsService } from '../../../core/services/settings.service';
import type { GraphEdge, GraphNode } from '../../../core/models/portal.models';

@Component({
  selector: 'ep-graph-viewer',
  standalone: true,
  imports: [SlicePipe],
  template: `
    <div class="graph-toolbar">
      <span class="ep-muted">{{ nodes().length }} nodes · {{ edges().length }} edges</span>
      <button type="button" (click)="resetView()">Reset view</button>
      <button type="button" (click)="exportSvg()">Export SVG</button>
    </div>
    <div class="graph-wrap" (wheel)="onWheel($event)">
      <svg
        #svg
        viewBox="0 0 1200 800"
        (mousedown)="onPanStart($event)"
        (mousemove)="onPanMove($event)"
        (mouseup)="onPanEnd()"
        (mouseleave)="onPanEnd()"
      >
        <g [attr.transform]="transform()">
          @for (edge of layoutEdges(); track edge.id) {
            <line [attr.x1]="edge.x1" [attr.y1]="edge.y1" [attr.x2]="edge.x2" [attr.y2]="edge.y2" class="edge" />
          }
          @for (node of layoutNodes(); track node.id) {
            <g [attr.transform]="'translate(' + node.x + ',' + node.y + ')'" class="node">
              <circle r="8" [class]="'t-' + node.type" />
              <text y="18" text-anchor="middle">{{ node.label | slice: 0 : 24 }}</text>
            </g>
          }
        </g>
      </svg>
    </div>
  `,
  styles: `
    .graph-wrap {
      overflow: hidden;
      border: 1px solid rgba(148, 163, 184, 0.25);
      border-radius: 12px;
      background: rgba(15, 23, 42, 0.4);
      min-height: 420px;
      cursor: grab;
    }
    svg {
      width: 100%;
      height: 480px;
    }
    .edge {
      stroke: #64748b;
      stroke-width: 1;
      opacity: 0.5;
    }
    .node circle {
      fill: #3b82f6;
    }
    .node text {
      font-size: 9px;
      fill: currentColor;
    }
    .t-Endpoint circle,
    .t-endpoint circle {
      fill: #22c55e;
    }
    .t-Table circle,
    .t-table circle {
      fill: #f59e0b;
    }
    .t-Component circle {
      fill: #a855f7;
    }
    .graph-toolbar {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    button {
      background: #334155;
      border: none;
      color: inherit;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      cursor: pointer;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphViewerComponent {
  readonly nodes = input<GraphNode[]>([]);
  readonly edges = input<GraphEdge[]>([]);

  private readonly settings = inject(SettingsService);
  private readonly svgRef = viewChild<ElementRef<SVGSVGElement>>('svg');

  private readonly panX = signal(0);
  private readonly panY = signal(0);
  private readonly zoom = signal(1);
  private dragging = false;
  private lastX = 0;
  private lastY = 0;

  readonly layoutNodes = computed(() => {
    const max = this.settings.graphMaxNodes();
    const n = this.nodes().slice(0, max);
    const cols = Math.ceil(Math.sqrt(n.length || 1));
    return n.map((node, i) => ({
      ...node,
      x: (i % cols) * 90 + 40,
      y: Math.floor(i / cols) * 70 + 40,
    }));
  });

  readonly layoutEdges = computed(() => {
    const max = this.settings.graphMaxNodes();
    const n = this.nodes().slice(0, max);
    const e = this.edges().slice(0, max * 3);
    const positions = new Map(this.layoutNodes().map((node) => [node.id, { x: node.x, y: node.y }]));
    return e
      .map((edge, i) => {
        const a = positions.get(edge.from);
        const b = positions.get(edge.to);
        if (!a || !b) return null;
        return { id: `${i}`, x1: a.x, y1: a.y, x2: b.x, y2: b.y };
      })
      .filter(Boolean) as { id: string; x1: number; y1: number; x2: number; y2: number }[];
  });

  transform = computed(() => `translate(${this.panX()},${this.panY()}) scale(${this.zoom()})`);

  onWheel(ev: WheelEvent): void {
    ev.preventDefault();
    this.zoom.update((z) => Math.min(3, Math.max(0.3, z - ev.deltaY * 0.001)));
  }

  onPanStart(ev: MouseEvent): void {
    this.dragging = true;
    this.lastX = ev.clientX;
    this.lastY = ev.clientY;
  }

  onPanMove(ev: MouseEvent): void {
    if (!this.dragging) return;
    this.panX.update((v) => v + ev.clientX - this.lastX);
    this.panY.update((v) => v + ev.clientY - this.lastY);
    this.lastX = ev.clientX;
    this.lastY = ev.clientY;
  }

  onPanEnd(): void {
    this.dragging = false;
  }

  resetView(): void {
    this.panX.set(0);
    this.panY.set(0);
    this.zoom.set(1);
  }

  exportSvg(): void {
    const svg = this.svgRef()?.nativeElement;
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graph-export.svg';
    a.click();
    URL.revokeObjectURL(url);
  }
}
