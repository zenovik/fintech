import { Component, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthLayoutComponent } from '../../components/auth-layout/auth-layout.component';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/auth/services/notification.service';
import { AUTH_ROUTES } from '../../../../core/auth/constants/auth.constants';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatProgressSpinnerModule,
    AuthLayoutComponent,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent implements AfterViewInit {
  @ViewChild('emailInput') emailInput!: ElementRef<HTMLInputElement>;

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);

  readonly loginRoute = AUTH_ROUTES.LOGIN;
  loading = false;
  showSuccess = false;
  submittedEmail = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
  });

  ngAfterViewInit(): void {
    setTimeout(() => this.emailInput?.nativeElement?.focus(), 100);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const email = this.form.getRawValue().email;

    this.authService.forgotPassword({ email }).subscribe({
      next: () => {
        this.loading = false;
        this.submittedEmail = email;
        this.showSuccess = true;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.notification.error(this.authService.extractErrorMessage(err));
      },
    });
  }

  closeSuccess(): void {
    this.showSuccess = false;
    this.form.reset();
  }

  get emailError(): string | null {
    const ctrl = this.form.controls.email;
    if (!ctrl.touched) return null;
    if (ctrl.hasError('required')) return 'Email is required';
    if (ctrl.hasError('email')) return 'Please enter a valid email address';
    return null;
  }
}
