import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { SearchIndexService } from '../../../core/services/search-index.service';

@Component({
  selector: 'ep-search-bar',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <mat-form-field appearance="outline" class="search-field" subscriptSizing="dynamic">
      <mat-icon matPrefix>search</mat-icon>
      <input
        matInput
        placeholder="Search (Ctrl+K)"
        [ngModel]="search.query()"
        (ngModelChange)="onInput($event)"
        (keydown.enter)="goSearch()"
      />
    </mat-form-field>
  `,
  styles: `
    .search-field {
      width: min(320px, 40vw);
      margin: 0 0.5rem;
    }
    :host ::ng-deep .search-field .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBarComponent {
  readonly search = inject(SearchIndexService);
  private readonly router = inject(Router);

  onInput(v: string): void {
    this.search.setQuery(v);
  }

  goSearch(): void {
    void this.router.navigate(['/search'], { queryParams: { q: this.search.query() } });
  }
}
