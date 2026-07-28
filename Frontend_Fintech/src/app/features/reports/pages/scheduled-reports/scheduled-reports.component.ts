import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReportsStateService } from '../../services/reports-state.service';

@Component({
  selector: 'app-scheduled-reports',
  standalone: true,
  imports: [CommonModule, RouterLink, MatProgressSpinnerModule, DatePipe, TitleCasePipe],
  templateUrl: './scheduled-reports.component.html',
  styleUrl: './scheduled-reports.component.scss',
})
export class ScheduledReportsComponent implements OnInit {
  readonly state = inject(ReportsStateService);
  ngOnInit(): void { this.state.loadScheduled(); }
}
