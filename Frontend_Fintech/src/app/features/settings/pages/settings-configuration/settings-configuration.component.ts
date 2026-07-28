import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SettingsApiService } from '../../services/settings-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';

interface PlatformConfigItem {
  key: string;
  group: string;
  value: unknown;
  description: string | null;
  updatedAt: string;
}

@Component({
  selector: 'app-settings-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, DatePipe, TitleCasePipe],
  templateUrl: './settings-configuration.component.html',
  styleUrl: './settings-configuration.component.scss',
})
export class SettingsConfigurationComponent implements OnInit {
  private readonly api = inject(SettingsApiService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly items = signal<PlatformConfigItem[]>([]);
  readonly saving = signal(false);
  groupFilter = '';
  editValues: Record<string, string> = {};

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.pageState.set('loading');
    this.api.listPlatformConfig(this.groupFilter || undefined).subscribe({
      next: (data) => {
        this.items.set(data);
        this.editValues = Object.fromEntries(data.map((d) => [d.key, JSON.stringify(d.value, null, 2)]));
        this.pageState.set('ready');
      },
      error: () => this.pageState.set('error'),
    });
  }

  save(item: PlatformConfigItem): void {
    if (!this.rbac.hasPermission(this.perms.PLATFORM_CONFIG_WRITE)) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(this.editValues[item.key] ?? '{}');
    } catch {
      return;
    }
    this.saving.set(true);
    this.api.updatePlatformConfig({ key: item.key, group: item.group, value: parsed }).subscribe({
      next: (data) => {
        this.items.set(data);
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }
}
