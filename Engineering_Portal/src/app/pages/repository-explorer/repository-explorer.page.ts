import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { NestedTreeControl } from '@angular/cdk/tree';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PortalDataService } from '../../core/services/portal-data.service';

interface TreeNode {
  name: string;
  path: string;
  children?: TreeNode[];
  language?: string;
  size?: number;
}

@Component({
  selector: 'ep-repository-explorer-page',
  standalone: true,
  imports: [PageHeaderComponent, MatTreeModule, MatFormFieldModule, MatInputModule, FormsModule],
  template: `
    <div class="ep-page">
      <ep-page-header title="Repository Explorer" subtitle="Browse files, languages, and module ownership" />
      <mat-form-field appearance="outline" class="filter">
        <mat-label>Filter files</mat-label>
        <input matInput [(ngModel)]="filter" (ngModelChange)="filterSig.set($event)" />
      </mat-form-field>
      <div class="stats ep-muted">
        {{ filtered().length }} files · {{ languages().length }} languages · {{ modules().length }} modules
      </div>
      <mat-tree [dataSource]="dataSource" [treeControl]="treeControl" class="tree">
        <mat-nested-tree-node *matTreeNodeDef="let node">
          <li>
            <div class="node-row">
              <span>{{ node.name }}</span>
              @if (node.language) {
                <span class="ep-tag">{{ node.language }}</span>
              }
            </div>
          </li>
        </mat-nested-tree-node>
        <mat-nested-tree-node *matTreeNodeDef="let node; when: hasChild">
          <li>
            <div class="node-row folder" matTreeNodeToggle>
              <span>{{ node.name }}</span>
            </div>
            <ul><ng-container matTreeNodeOutlet /></ul>
          </li>
        </mat-nested-tree-node>
      </mat-tree>
    </div>
  `,
  styles: `
    .filter {
      width: 100%;
      max-width: 480px;
    }
    .tree {
      list-style: none;
      padding-left: 0;
    }
    .node-row {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      padding: 0.25rem 0;
    }
    .folder {
      font-weight: 600;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepositoryExplorerPage {
  private readonly portal = inject(PortalDataService);
  readonly filterSig = signal('');
  filter = '';

  readonly filtered = computed(() => {
    const q = this.filterSig().toLowerCase();
    const files = this.portal.files();
    return q ? files.filter((f) => f.path.toLowerCase().includes(q)) : files;
  });

  readonly languages = computed(() => [...new Set(this.filtered().map((f) => f.language))]);
  readonly modules = computed(() => [...new Set(this.filtered().map((f) => f.ownerModule))]);

  treeControl = new NestedTreeControl<TreeNode>((n) => n.children ?? []);
  dataSource = new MatTreeNestedDataSource<TreeNode>();

  constructor() {
    this.dataSource.data = this.buildTree(this.portal.files().slice(0, 800));
  }

  hasChild = (_: number, node: TreeNode) => !!node.children?.length;

  private buildTree(files: { path: string; language: string; size: number; ownerModule: string }[]): TreeNode[] {
    interface MutableNode {
      name: string;
      path: string;
      language?: string;
      size?: number;
      children: Map<string, MutableNode>;
    }
    const root = new Map<string, MutableNode>();

    for (const f of files) {
      const parts = f.path.split(/[/\\]/);
      let current = root;
      let acc = '';
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        acc = acc ? `${acc}/${part}` : part;
        if (!current.has(part)) {
          current.set(part, { name: part, path: acc, children: new Map() });
        }
        const node = current.get(part)!;
        if (i === parts.length - 1) {
          node.language = f.language;
          node.size = f.size;
        }
        current = node.children;
      }
    }

    const toArray = (map: Map<string, MutableNode>): TreeNode[] =>
      [...map.values()].map((n) => ({
        name: n.name,
        path: n.path,
        language: n.language,
        size: n.size,
        children: n.children.size ? toArray(n.children) : undefined,
      }));

    return toArray(root);
  }
}
