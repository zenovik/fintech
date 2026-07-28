import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SettingsStateService } from '../../services/settings-state.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { StorageSettings } from '../../models/settings.models';

const STORAGE_PROVIDERS = ['local', 's3', 'gcs', 'azure'] as const;

@Component({
  selector: 'app-settings-storage',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './settings-storage.component.html',
  styleUrl: './settings-storage.component.scss',
})
export class SettingsStorageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly state = inject(SettingsStateService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;
  readonly providers = STORAGE_PROVIDERS;

  readonly form = this.fb.group({
    provider: ['local', Validators.required],
    bucketName: [''],
    region: [''],
    maxUploadMb: [10, [Validators.required, Validators.min(1)]],
    allowedExtensionsText: [''],
  });

  ngOnInit(): void {
    this.state.loadStorageSettings((data) => this.patchForm(data));
  }

  retry(): void {
    this.state.retry();
    this.state.loadStorageSettings((data) => this.patchForm(data));
  }

  save(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const body: Partial<StorageSettings> = {
      provider: raw.provider ?? 'local',
      bucketName: raw.bucketName || null,
      region: raw.region || null,
      maxUploadMb: raw.maxUploadMb ?? 10,
      allowedExtensions: (raw.allowedExtensionsText ?? '')
        .split(',')
        .map((ext) => ext.trim())
        .filter(Boolean),
    };
    this.state.saveStorageSettings(body);
  }

  private patchForm(data: StorageSettings): void {
    this.form.patchValue({
      provider: data.provider,
      bucketName: data.bucketName ?? '',
      region: data.region ?? '',
      maxUploadMb: data.maxUploadMb,
      allowedExtensionsText: (data.allowedExtensions ?? []).join(', '),
    });
  }
}
