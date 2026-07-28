import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthLayoutComponent } from '../../components/auth-layout/auth-layout.component';
import { OtpInputComponent } from '../../components/otp-input/otp-input.component';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { AuthStateService } from '../../../../core/auth/services/auth-state.service';
import { NotificationService } from '../../../../core/auth/services/notification.service';
import { SessionService } from '../../../../core/auth/services/session.service';
import { buildDeviceFingerprint } from '../../../../core/auth/utils/device-fingerprint.util';
import { AUTH_ROUTES, AUTH_STORAGE_KEYS } from '../../../../core/auth/constants/auth.constants';
import { DASHBOARD_ROUTES } from '../../../../features/dashboard/constants/dashboard.constants';
import { MfaChallenge } from '../../../../core/auth/models/auth.models';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    AuthLayoutComponent,
    OtpInputComponent,
  ],
  templateUrl: './verify-otp.component.html',
  styleUrl: './verify-otp.component.scss',
})
export class VerifyOtpComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly authState = inject(AuthStateService);
  private readonly notification = inject(NotificationService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  readonly loginRoute = AUTH_ROUTES.LOGIN;
  challenge: MfaChallenge | null = null;
  loading = false;
  resendLoading = false;
  showSmsView = false;
  resendSeconds = 59;
  rememberDevice = false;
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  form = this.fb.nonNullable.group({
    otp: [''],
    trustDevice: [true],
  });

  ngOnInit(): void {
    this.challenge = this.authState.getMfaChallenge();
    const navState = history.state as { rememberDevice?: boolean } | undefined;
    this.rememberDevice = navState?.rememberDevice ?? false;

    if (!this.challenge) {
      void this.router.navigate([AUTH_ROUTES.LOGIN]);
      return;
    }

    this.showSmsView = this.challenge.nextStep === 'otp';
    this.startResendTimer();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  get isTotpMode(): boolean {
    return this.challenge?.nextStep === 'totp' && !this.showSmsView;
  }

  get maskedDestination(): string {
    if (this.challenge?.maskedDestination) return this.challenge.maskedDestination;
    return this.isTotpMode ? 'your authenticator app' : 'your phone';
  }

  switchToSms(): void {
    this.showSmsView = true;
    this.form.controls.otp.setValue('');
  }

  switchToTotp(): void {
    this.showSmsView = false;
    this.form.controls.otp.setValue('');
  }

  onOtpCompleted(code: string): void {
    this.form.controls.otp.setValue(code);
    this.verify();
  }

  verify(): void {
    const otp = this.form.controls.otp.value;
    if (!this.challenge || otp.length !== 6) {
      this.notification.error('Please enter the 6-digit verification code.');
      return;
    }

    this.loading = true;
    this.authService
      .verifyOtp({
        challengeId: this.challenge.challengeId,
        otp,
        trustDevice: this.form.controls.trustDevice.value,
        deviceFingerprint: buildDeviceFingerprint(),
      })
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.authState.clearMfaChallenge();
          this.authState.setAuthenticated(response.user, response.accessToken, response.expiresIn);
          this.sessionService.startIdleMonitoring();
          this.notification.success('Verification successful');

          if (response.requiresOrganizationSelection && (response.organizations?.length ?? 0) > 1) {
            const stored = localStorage.getItem('mp_current_organization_id');
            if (!stored) {
              void this.router.navigateByUrl('/select-organization');
              return;
            }
          }

          const returnUrl = sessionStorage.getItem(AUTH_STORAGE_KEYS.RETURN_URL);
          sessionStorage.removeItem(AUTH_STORAGE_KEYS.RETURN_URL);
          void this.router.navigateByUrl(returnUrl ?? DASHBOARD_ROUTES.EXECUTIVE);
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          this.form.controls.otp.setValue('');
          this.notification.error(this.authService.extractErrorMessage(err));
        },
      });
  }

  resendOtp(): void {
    if (!this.challenge || this.resendSeconds > 0) return;

    this.resendLoading = true;
    this.authService.resendOtp(this.challenge.challengeId).subscribe({
      next: () => {
        this.resendLoading = false;
        this.resendSeconds = 59;
        this.startResendTimer();
        this.notification.info('Verification code resent');
      },
      error: (err: HttpErrorResponse) => {
        this.resendLoading = false;
        this.notification.error(this.authService.extractErrorMessage(err));
      },
    });
  }

  private startResendTimer(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.resendSeconds > 0) {
        this.resendSeconds--;
      } else if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  get resendLabel(): string {
    if (this.resendSeconds > 0) {
      const m = Math.floor(this.resendSeconds / 60);
      const s = this.resendSeconds % 60;
      return `Resend in ${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return 'Resend Code';
  }
}
