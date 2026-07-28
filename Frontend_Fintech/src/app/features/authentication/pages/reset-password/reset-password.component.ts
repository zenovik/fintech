import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthLayoutComponent } from '../../components/auth-layout/auth-layout.component';
import { PasswordRequirementsComponent } from '../../components/password-requirements/password-requirements.component';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/auth/services/notification.service';
import { AUTH_ROUTES, PASSWORD_RULES } from '../../../../core/auth/constants/auth.constants';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return newPassword === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatProgressSpinnerModule,
    AuthLayoutComponent,
    PasswordRequirementsComponent,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loginRoute = AUTH_ROUTES.LOGIN;
  loading = false;
  success = false;
  showNewPassword = false;
  showConfirmPassword = false;
  token = '';

  form = this.fb.nonNullable.group(
    {
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(PASSWORD_RULES.MIN_LENGTH),
          Validators.maxLength(PASSWORD_RULES.MAX_LENGTH),
          Validators.pattern(PASSWORD_RULES.UPPERCASE),
          Validators.pattern(PASSWORD_RULES.NUMBER_OR_SPECIAL),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator },
  );

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.notification.error('Reset token is missing or invalid.');
      void this.router.navigate([AUTH_ROUTES.FORGOT_PASSWORD]);
    }
  }

  onSubmit(): void {
    if (this.form.invalid || !this.token) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { newPassword, confirmPassword } = this.form.getRawValue();

    this.authService.resetPassword({ token: this.token, newPassword, confirmPassword }).subscribe({
      next: (message) => {
        this.loading = false;
        this.success = true;
        this.notification.success(message);
        setTimeout(() => void this.router.navigate([AUTH_ROUTES.LOGIN]), 2000);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.notification.error(this.authService.extractErrorMessage(err));
      },
    });
  }

  get passwordMismatch(): boolean {
    return this.form.hasError('passwordMismatch') && this.form.controls.confirmPassword.touched;
  }
}
