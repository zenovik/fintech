import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SettingsStateService } from '../../services/settings-state.service';
import { NOTIFICATION_CHANNELS, NOTIFICATION_TYPES } from '../../constants/settings.constants';
import { NotificationPreference } from '../../models/settings.models';

@Component({
  selector: 'app-settings-notifications',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatCheckboxModule],
  templateUrl: './settings-notifications.component.html',
  styleUrl: './settings-notifications.component.scss',
})
export class SettingsNotificationsComponent implements OnInit {
  readonly state = inject(SettingsStateService);
  readonly types = NOTIFICATION_TYPES;
  readonly channels = NOTIFICATION_CHANNELS;

  ngOnInit(): void {
    this.state.loadNotifications(false);
  }

  retry(): void {
    this.state.retry();
    this.state.loadNotifications(false);
  }

  isEnabled(type: string, channel: string): boolean {
    return this.state.notifications().some(
      (pref) => pref.notificationType === type && pref.channel === channel && pref.isEnabled,
    );
  }

  toggle(type: string, channel: string, enabled: boolean): void {
    const prefs = [...this.state.notifications()];
    const idx = prefs.findIndex((p) => p.notificationType === type && p.channel === channel);
    if (idx >= 0) {
      prefs[idx] = { ...prefs[idx], isEnabled: enabled };
    } else {
      prefs.push({ notificationType: type, channel, isEnabled: enabled });
    }
    this.state.notifications.set(prefs);
  }

  save(): void {
    this.state.saveNotifications(this.state.notifications(), false);
  }
}
