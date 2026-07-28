import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RiskRulesApiService } from '../../services/risk-rules-api.service';

@Component({
  selector: 'app-risk-rules-list',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <h1>Risk Rules</h1>
    @if (loading()) { <mat-spinner diameter="40"></mat-spinner> }
    @else {
      <table class="data-table">
        <thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Action</th><th>Active</th></tr></thead>
        <tbody>
          @for (r of items(); track r['id']) {
            <tr>
              <td>{{ r['ruleCode'] }}</td><td>{{ r['ruleName'] }}</td>
              <td>{{ r['ruleType'] }}</td><td>{{ r['action'] }}</td><td>{{ r['isActive'] }}</td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
})
export class RiskRulesListComponent implements OnInit {
  private readonly api = inject(RiskRulesApiService);
  readonly loading = signal(true);
  readonly items = signal<Record<string, unknown>[]>([]);

  ngOnInit(): void {
    this.api.list({ page: 1, pageSize: 50 }).subscribe({
      next: (d) => { this.items.set((d as { items?: Record<string, unknown>[] }).items ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
