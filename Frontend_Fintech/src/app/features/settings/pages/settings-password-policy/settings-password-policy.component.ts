import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SettingsStateService } from '../../services/settings-state.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { PasswordPolicySettings } from '../../models/settings.models';

@Component({
  selector: 'app-settings-password-policy',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
  ],
  templateUrl: './settings-password-policy.component.html',
  styleUrl: './settings-password-policy.component.scss',
})
export class SettingsPasswordPolicyComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly state = inject(SettingsStateService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly form = this.fb.group({
    minLength: [8, [Validators.required, Validators.min(6)]],
    requireUppercase: [true],
    requireLowercase: [true],
    requireNumber: [true],
    requireSpecial: [false],
    maxAgeDays: [90, [Validators.required, Validators.min(0)]],
    historyCount: [5, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.state.loadPasswordPolicy((data) => this.patchForm(data));
  }

  retry(): void {
    this.state.retry();
    this.state.loadPasswordPolicy((data) => this.patchForm(data));
  }

  save(): void {
    if (this.form.invalid) return;
    this.state.savePasswordPolicy(this.form.getRawValue() as Partial<PasswordPolicySettings>);
  }

  private patchForm(data: PasswordPolicySettings): void {
    this.form.patchValue({
      minLength: data.minLength,
      requireUppercase: data.requireUppercase,
      requireLowercase: data.requireLowercase,
      requireNumber: data.requireNumber,
      requireSpecial: data.requireSpecial,
      maxAgeDays: data.maxAgeDays,
      historyCount: data.historyCount,
    });
  }
}
