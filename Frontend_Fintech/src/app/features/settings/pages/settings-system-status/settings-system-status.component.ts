import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SystemApiService } from '../../services/system-api.service';
import { formatUptime, mapBooleanReady, mapComponentState } from '../../constants/system.constants';
import { SystemHealth, SystemReadiness, SystemVersion } from '../../models/system.models';

@Component({
  selector: 'app-settings-system-status',
  standalone: true,
  imports: [CommonModule, DatePipe, MatProgressSpinnerModule],
  templateUrl: './settings-system-status.component.html',
  styleUrl: './settings-system-status.component.scss',
})
export class SettingsSystemStatusComponent implements OnInit {
  private readonly api = inject(SystemApiService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly health = signal<SystemHealth | null>(null);
  readonly readiness = signal<SystemReadiness | null>(null);
  readonly version = signal<SystemVersion | null>(null);

  readonly mapComponentState = mapComponentState;
  readonly mapBooleanReady = mapBooleanReady;
  readonly formatUptime = formatUptime;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.getHealth().subscribe({
      next: (health) => {
        this.health.set(health);
        this.api.getReadiness().subscribe({
          next: (readiness) => {
            this.readiness.set(readiness);
            this.api.getVersion().subscribe({
              next: (version) => {
                this.version.set(version);
                this.loading.set(false);
              },
              error: () => this.finishWithPartial(health, readiness, null),
            });
          },
          error: () => this.finishWithPartial(health, null, null),
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Unable to load system status');
      },
    });
  }

  private finishWithPartial(
    health: SystemHealth,
    readiness: SystemReadiness | null,
    version: SystemVersion | null,
  ): void {
    this.health.set(health);
    if (readiness) this.readiness.set(readiness);
    if (version) this.version.set(version);
    this.loading.set(false);
  }
}
