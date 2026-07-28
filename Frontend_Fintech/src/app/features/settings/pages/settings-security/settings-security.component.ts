import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SettingsStateService } from '../../services/settings-state.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { SecuritySettings } from '../../models/settings.models';

const MFA_METHODS = ['totp', 'sms', 'email'] as const;

@Component({
  selector: 'app-settings-security',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatCheckboxModule,
  ],
  templateUrl: './settings-security.component.html',
  styleUrl: './settings-security.component.scss',
})
export class SettingsSecurityComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly state = inject(SettingsStateService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;
  readonly mfaMethods = MFA_METHODS;

  readonly form = this.fb.group({
    mfaEnforced: [false],
    mfaMethodsAllowed: this.fb.control<string[]>([]),
    ipWhitelistEnabled: [false],
    ipWhitelistText: [''],
  });

  ngOnInit(): void {
    this.state.loadSecurity((data) => this.patchForm(data));
  }

  retry(): void {
    this.state.retry();
    this.state.loadSecurity((data) => this.patchForm(data));
  }

  isMethodAllowed(method: string): boolean {
    return (this.form.get('mfaMethodsAllowed')?.value ?? []).includes(method);
  }

  toggleMethod(method: string, checked: boolean): void {
    const current = [...(this.form.get('mfaMethodsAllowed')?.value ?? [])];
    const next = checked ? [...current, method] : current.filter((m) => m !== method);
    this.form.patchValue({ mfaMethodsAllowed: next });
  }

  save(): void {
    const raw = this.form.getRawValue();
    const body: Partial<SecuritySettings> = {
      mfaEnforced: raw.mfaEnforced ?? false,
      mfaMethodsAllowed: raw.mfaMethodsAllowed ?? [],
      ipWhitelistEnabled: raw.ipWhitelistEnabled ?? false,
      ipWhitelist: (raw.ipWhitelistText ?? '')
        .split('\n')
        .map((ip) => ip.trim())
        .filter(Boolean),
    };
    this.state.saveSecurity(body);
  }

  private patchForm(data: SecuritySettings): void {
    this.form.patchValue({
      mfaEnforced: data.mfaEnforced,
      mfaMethodsAllowed: data.mfaMethodsAllowed,
      ipWhitelistEnabled: data.ipWhitelistEnabled,
      ipWhitelistText: (data.ipWhitelist ?? []).join('\n'),
    });
  }
}
