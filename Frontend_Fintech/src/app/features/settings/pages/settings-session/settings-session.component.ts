import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SettingsStateService } from '../../services/settings-state.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { SessionSettings } from '../../models/settings.models';

@Component({
  selector: 'app-settings-session',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './settings-session.component.html',
  styleUrl: './settings-session.component.scss',
})
export class SettingsSessionComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly state = inject(SettingsStateService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly form = this.fb.group({
    idleTimeoutMinutes: [30, [Validators.required, Validators.min(1)]],
    maxSessionDurationMinutes: [480, [Validators.required, Validators.min(1)]],
    maxConcurrentSessions: [3, [Validators.required, Validators.min(1)]],
    rememberDeviceDays: [30, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.state.loadSessionSettings((data) => this.patchForm(data));
  }

  retry(): void {
    this.state.retry();
    this.state.loadSessionSettings((data) => this.patchForm(data));
  }

  save(): void {
    if (this.form.invalid) return;
    this.state.saveSessionSettings(this.form.getRawValue() as Partial<SessionSettings>);
  }

  private patchForm(data: SessionSettings): void {
    this.form.patchValue({
      idleTimeoutMinutes: data.idleTimeoutMinutes,
      maxSessionDurationMinutes: data.maxSessionDurationMinutes,
      maxConcurrentSessions: data.maxConcurrentSessions,
      rememberDeviceDays: data.rememberDeviceDays,
    });
  }
}
