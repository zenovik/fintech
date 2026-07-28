import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { NotificationService } from '../../../../core/auth/services/notification.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { MerchantOnboardingApiService } from '../../services/merchant-onboarding-api.service';
import { KYC_DOC_LABELS, STATUS_LABELS } from '../../constants/merchant-onboarding.constants';
import { OnboardingDetail } from '../../models/merchant-onboarding.models';

@Component({
  selector: 'app-onboarding-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, MatButtonModule, MatTabsModule, DatePipe],
  templateUrl: './onboarding-detail.component.html',
  styleUrl: './onboarding-detail.component.scss',
})
export class OnboardingDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(MerchantOnboardingApiService);
  private readonly notification = inject(NotificationService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;
  readonly statusLabels = STATUS_LABELS;
  readonly kycDocLabels = KYC_DOC_LABELS;

  readonly loading = signal(true);
  readonly detail = signal<OnboardingDetail | null>(null);
  rejectReason = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.load(id);
  }

  load(id: number): void {
    this.loading.set(true);
    this.api.getById(id).subscribe({
      next: (d) => { this.detail.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  approve(): void {
    const d = this.detail();
    if (!d) return;
    this.api.approve(d.id).subscribe({
      next: (updated) => { this.detail.set(updated); this.notification.success('Application approved'); },
      error: () => this.notification.error('Approval failed'),
    });
  }

  reject(): void {
    const d = this.detail();
    if (!d || !this.rejectReason.trim()) return;
    this.api.reject(d.id, this.rejectReason).subscribe({
      next: (updated) => { this.detail.set(updated); this.notification.success('Application rejected'); },
      error: () => this.notification.error('Rejection failed'),
    });
  }

  goLive(): void {
    const d = this.detail();
    if (!d) return;
    this.api.goLive(d.id).subscribe({
      next: (updated) => { this.detail.set(updated); this.notification.success('Merchant is now live'); },
      error: () => this.notification.error('Go live failed'),
    });
  }

  suspend(): void {
    const d = this.detail();
    if (!d) return;
    this.api.suspend(d.id).subscribe({
      next: (updated) => { this.detail.set(updated); this.notification.success('Merchant suspended'); },
      error: () => this.notification.error('Suspend failed'),
    });
  }

  statusClass(status: string): string {
    return `mob-status mob-status--${status}`;
  }
}
