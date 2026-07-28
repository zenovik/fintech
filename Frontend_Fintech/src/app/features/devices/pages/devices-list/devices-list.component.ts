import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DevicesApiService } from '../../services/devices-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';

interface DeviceItem {
  id: number;
  deviceRef: string;
  deviceType: string;
  serialNumber: string;
  merchantName?: string;
  status: string;
  healthStatus: string;
  lastSyncAt?: string;
}

@Component({
  selector: 'app-devices-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule],
  templateUrl: './devices-list.component.html',
})
export class DevicesListComponent implements OnInit {
  private readonly api = inject(DevicesApiService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly items = signal<DeviceItem[]>([]);
  readonly stats = signal<Record<string, number>>({});
  statusFilter = '';
  searchInput = '';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.pageState.set('loading');
    this.api.list({ page: 1, pageSize: 25, status: this.statusFilter || undefined, search: this.searchInput || undefined }).subscribe({
      next: (d) => {
        const data = d as { items?: DeviceItem[]; stats?: Record<string, number> };
        this.items.set(data.items ?? []);
        this.stats.set(data.stats ?? {});
        this.pageState.set('ready');
      },
      error: () => this.pageState.set('error'),
    });
  }
}
