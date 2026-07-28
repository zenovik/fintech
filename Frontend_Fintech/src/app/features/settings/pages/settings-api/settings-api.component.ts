import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SettingsStateService } from '../../services/settings-state.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { ApiSettings } from '../../models/settings.models';

@Component({
  selector: 'app-settings-api',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './settings-api.component.html',
  styleUrl: './settings-api.component.scss',
})
export class SettingsApiComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly state = inject(SettingsStateService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly form = this.fb.group({
    apiBaseUrl: [''],
    webhookRetryCount: [3, [Validators.required, Validators.min(0)]],
    webhookTimeoutSeconds: [30, [Validators.required, Validators.min(1)]],
    rateLimitPerMinute: [60, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.state.loadApiSettings((data) => this.patchForm(data));
  }

  retry(): void {
    this.state.retry();
    this.state.loadApiSettings((data) => this.patchForm(data));
  }

  save(): void {
    if (this.form.invalid) return;
    this.state.saveApiSettings(this.form.getRawValue() as Partial<ApiSettings>);
  }

  private patchForm(data: ApiSettings): void {
    this.form.patchValue({
      apiBaseUrl: data.apiBaseUrl ?? '',
      webhookRetryCount: data.webhookRetryCount,
      webhookTimeoutSeconds: data.webhookTimeoutSeconds,
      rateLimitPerMinute: data.rateLimitPerMinute,
    });
  }
}
