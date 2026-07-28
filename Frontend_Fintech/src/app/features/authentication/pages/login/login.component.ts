import { Component, inject, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthLayoutComponent } from '../../components/auth-layout/auth-layout.component';
import { AuthBrandComponent } from '../../components/auth-brand/auth-brand.component';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { AuthStateService } from '../../../../core/auth/services/auth-state.service';
import { NotificationService } from '../../../../core/auth/services/notification.service';
import { SessionService } from '../../../../core/auth/services/session.service';
import { buildDeviceFingerprint } from '../../../../core/auth/utils/device-fingerprint.util';
import { DASHBOARD_ROUTES } from '../../../../features/dashboard/constants/dashboard.constants';
import { AUTH_ROUTES, AUTH_STORAGE_KEYS, PASSWORD_RULES } from '../../../../core/auth/constants/auth.constants';
import { LoginResponse, MfaChallenge } from '../../../../core/auth/models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    AuthLayoutComponent,
    AuthBrandComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit, AfterViewInit {
  @ViewChild('emailInput') emailInput!: ElementRef<HTMLInputElement>;

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly authState = inject(AuthStateService);
  private readonly notification = inject(NotificationService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  readonly forgotPasswordRoute = AUTH_ROUTES.FORGOT_PASSWORD;

  loading = false;
  showPassword = false;
  serverError = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(PASSWORD_RULES.MAX_LENGTH),
      ],
    ],
    rememberDevice: [false],
  });

  ngOnInit(): void {
    if (this.authState.isAuthenticated()) {
      void this.router.navigate([DASHBOARD_ROUTES.EXECUTIVE]);
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.emailInput?.nativeElement?.focus(), 100);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.serverError = '';
    const { email, password, rememberDevice } = this.form.getRawValue();

    this.authService
      .login({
        email,
        password,
        rememberDevice,
        deviceFingerprint: buildDeviceFingerprint(),
      })
      .subscribe({
        next: (result) => {
          this.loading = false;
          if (this.isMfaChallenge(result)) {
            this.authState.setMfaChallenge(result);
            void this.router.navigate([AUTH_ROUTES.VERIFY_OTP], {
              state: { rememberDevice },
            });
            return;
          }
          this.handleLoginSuccess(result);
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          this.serverError = this.authService.extractErrorMessage(err);
          this.notification.error(this.serverError);
        },
      });
  }

  private isMfaChallenge(result: LoginResponse | MfaChallenge): result is MfaChallenge {
    return 'challengeId' in result;
  }

  private handleLoginSuccess(response: LoginResponse): void {
    this.authState.setAuthenticated(response.user, response.accessToken, response.expiresIn);
    this.sessionService.startIdleMonitoring();
    this.notification.success('Signed in successfully');

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
  }

  get emailError(): string | null {
    const ctrl = this.form.controls.email;
    if (!ctrl.touched && !ctrl.dirty) return null;
    if (ctrl.hasError('required')) return 'Email is required';
    if (ctrl.hasError('email')) return 'Please enter a valid email address';
    return null;
  }

  get passwordError(): string | null {
    const ctrl = this.form.controls.password;
    if (!ctrl.touched && !ctrl.dirty) return null;
    if (ctrl.hasError('required')) return 'Password is required';
    return null;
  }
}
