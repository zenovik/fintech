import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SettingsService } from '../../core/services/settings.service';
import { BookmarkService } from '../../core/services/bookmark.service';

@Component({
  selector: 'ep-settings-page',
  standalone: true,
  imports: [PageHeaderComponent, FormsModule, MatSlideToggleModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="ep-page">
      <ep-page-header title="Settings" subtitle="Theme, density, graph size, bookmarks" />
      <mat-slide-toggle [checked]="settings.theme() === 'dark'" (change)="settings.toggleTheme()">
        Dark mode
      </mat-slide-toggle>
      <mat-slide-toggle
        [checked]="settings.density() === 'compact'"
        (change)="settings.density.set($event.checked ? 'compact' : 'comfortable')"
      >
        Compact layout
      </mat-slide-toggle>
      <mat-form-field appearance="outline">
        <mat-label>Max graph nodes</mat-label>
        <input matInput type="number" [ngModel]="settings.graphMaxNodes()" (ngModelChange)="settings.graphMaxNodes.set(+$event || 500)" />
      </mat-form-field>
      <p class="ep-muted">Favorites: {{ bookmarks.favorites().length }} · Data cached in browser for offline bookmarks/recent</p>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    mat-form-field {
      max-width: 240px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  readonly settings = inject(SettingsService);
  readonly bookmarks = inject(BookmarkService);
}
