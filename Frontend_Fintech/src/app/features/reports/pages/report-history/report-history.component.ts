import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReportsStateService } from '../../services/reports-state.service';

@Component({
  selector: 'app-report-history',
  standalone: true,
  imports: [CommonModule, RouterLink, MatProgressSpinnerModule, DatePipe, TitleCasePipe],
  templateUrl: './report-history.component.html',
  styleUrl: './report-history.component.scss',
})
export class ReportHistoryComponent implements OnInit {
  readonly state = inject(ReportsStateService);
  ngOnInit(): void { this.state.loadHistory(); }
}
