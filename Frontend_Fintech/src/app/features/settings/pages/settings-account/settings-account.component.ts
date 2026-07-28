import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SettingsStateService } from '../../services/settings-state.service';
import { SettingsApiService } from '../../services/settings-api.service';
import { AuthStateService } from '../../../../core/auth/services/auth-state.service';
import { NotificationService } from '../../../../core/auth/services/notification.service';
import { PageState } from '../../models/settings.models';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return newPassword === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-settings-account',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
  ],
  templateUrl: './settings-account.component.html',
  styleUrl: './settings-account.component.scss',
})
export class SettingsAccountComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(SettingsApiService);
  private readonly authState = inject(AuthStateService);
  private readonly notification = inject(NotificationService);

  readonly state = inject(SettingsStateService);
  readonly pageState = signal<PageState>('idle');
  readonly errorMessage = signal<string | null>(null);

  readonly passwordForm = this.fb.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator },
  );

  mfaEnabled = false;
  mfaSaving = false;

  ngOnInit(): void {
    const user = this.authState.user();
    if (user) {
      this.mfaEnabled = user.mfaEnabled;
    }
    this.pageState.set('loaded');
  }

  retry(): void {
    this.state.retry();
    this.errorMessage.set(null);
    this.pageState.set('loaded');
  }

  get userName(): string {
    const user = this.authState.user();
    return user ? `${user.firstName} ${user.lastName}` : '—';
  }

  get userEmail(): string {
    return this.authState.user()?.email ?? '—';
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    this.pageState.set('saving');
    const v = this.passwordForm.getRawValue();
    this.api.changePassword({
      currentPassword: v.currentPassword!,
      newPassword: v.newPassword!,
      confirmPassword: v.confirmPassword!,
    }).subscribe({
      next: () => {
        this.pageState.set('loaded');
        this.notification.success('Password changed successfully');
        this.passwordForm.reset();
      },
      error: () => {
        this.pageState.set('error');
        this.errorMessage.set('Failed to change password. Check your current password and try again.');
        this.notification.error('Failed to change password');
      },
    });
  }

  toggleMfa(enabled: boolean): void {
    this.mfaSaving = true;
    this.api.updateMfaPreferences({ mfaEnabled: enabled, mfaMethod: enabled ? 'totp' : undefined }).subscribe({
      next: (result) => {
        this.mfaEnabled = result.mfaEnabled;
        this.mfaSaving = false;
        const user = this.authState.user();
        if (user) {
          this.authState.updateUser({ ...user, mfaEnabled: result.mfaEnabled });
        }
        this.notification.success(result.mfaEnabled ? 'MFA enabled' : 'MFA disabled');
      },
      error: () => {
        this.mfaSaving = false;
        this.mfaEnabled = !enabled;
        this.notification.error('Failed to update MFA preferences');
      },
    });
  }
}
