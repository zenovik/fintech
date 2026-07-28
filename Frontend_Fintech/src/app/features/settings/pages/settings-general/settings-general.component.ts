import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SettingsStateService } from '../../services/settings-state.service';
import { SETTINGS_ROUTES } from '../../constants/settings.constants';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';

@Component({
  selector: 'app-settings-general',
  standalone: true,
  imports: [CommonModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './settings-general.component.html',
  styleUrl: './settings-general.component.scss',
})
export class SettingsGeneralComponent implements OnInit {
  readonly state = inject(SettingsStateService);
  readonly routes = SETTINGS_ROUTES;
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  ngOnInit(): void { this.state.loadOverview(); }
  retry(): void { this.state.retry(); this.state.loadOverview(); }
}
