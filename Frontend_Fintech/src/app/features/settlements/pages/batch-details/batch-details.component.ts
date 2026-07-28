import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SettlementStateService } from '../../services/settlement-state.service';

@Component({
  selector: 'app-batch-details',
  standalone: true,
  imports: [CommonModule, RouterLink, MatProgressSpinnerModule, DatePipe, CurrencyPipe, TitleCasePipe],
  templateUrl: './batch-details.component.html',
  styleUrl: './batch-details.component.scss',
})
export class BatchDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly state = inject(SettlementStateService);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.state.loadBatchDetail(id);
  }

  statusClass(code: string): string {
    if (code === 'completed') return 'processed';
    if (code === 'pending') return 'pending';
    if (code === 'processing') return 'processing';
    return 'failed';
  }
}
