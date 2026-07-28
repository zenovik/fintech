import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReportsStateService } from '../../services/reports-state.service';

@Component({
  selector: 'app-saved-reports',
  standalone: true,
  imports: [CommonModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './saved-reports.component.html',
  styleUrl: './saved-reports.component.scss',
})
export class SavedReportsComponent implements OnInit {
  readonly state = inject(ReportsStateService);
  ngOnInit(): void { this.state.loadReports(); }
}
