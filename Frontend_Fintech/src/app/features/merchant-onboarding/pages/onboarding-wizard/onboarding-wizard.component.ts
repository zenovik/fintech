import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../../../../core/auth/services/notification.service';
import { MerchantOnboardingApiService } from '../../services/merchant-onboarding-api.service';
import {
  BUSINESS_TYPES, KYC_DOC_LABELS, KYC_DOC_TYPES, SETTLEMENT_CYCLES, SETTLEMENT_METHODS, STATUS_LABELS,
} from '../../constants/merchant-onboarding.constants';
import { OnboardingAddress, OnboardingDetail } from '../../models/merchant-onboarding.models';

@Component({
  selector: 'app-onboarding-wizard',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink, MatStepperModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatCheckboxModule, MatProgressSpinnerModule,
  ],
  templateUrl: './onboarding-wizard.component.html',
  styleUrl: './onboarding-wizard.component.scss',
})
export class OnboardingWizardComponent implements OnInit {
  @ViewChild('stepper') stepper?: MatStepper;

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(MerchantOnboardingApiService);
  private readonly notification = inject(NotificationService);

  readonly businessTypes = BUSINESS_TYPES;
  readonly settlementCycles = SETTLEMENT_CYCLES;
  readonly settlementMethods = SETTLEMENT_METHODS;
  readonly kycDocTypes = KYC_DOC_TYPES;
  readonly kycDocLabels = KYC_DOC_LABELS;
  readonly statusLabels = STATUS_LABELS;

  applicationId: number | null = null;
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly detail = signal<OnboardingDetail | null>(null);

  readonly businessForm = this.fb.group({
    businessName: ['', Validators.required], legalName: ['', Validators.required],
    merchantCategory: [''], industry: [''], website: [''], email: ['', [Validators.required, Validators.email]],
    phone: [''], gstNumber: [''], panNumber: [''], cinNumber: [''], businessType: [''],
  });

  readonly registeredAddressForm = this.fb.group({
    line1: ['', Validators.required], line2: [''], country: ['India'], state: [''], city: ['', Validators.required],
    pincode: [''], latitude: [null as number | null], longitude: [null as number | null],
  });

  readonly operatingAddressForm = this.fb.group({
    line1: ['', Validators.required], line2: [''], country: ['India'], state: [''], city: ['', Validators.required],
    pincode: [''], latitude: [null as number | null], longitude: [null as number | null],
  });

  readonly bankForm = this.fb.group({
    accountHolder: ['', Validators.required], accountNumber: ['', Validators.required],
    ifsc: ['', Validators.required], bankName: ['', Validators.required], branch: [''],
    accountType: ['current'], verificationStatus: ['pending'],
  });

  readonly settlementForm = this.fb.group({
    settlementCycle: ['t1'], settlementCurrency: ['INR'], settlementMethod: ['bank_transfer'],
    minSettlementAmount: [1000], reservePct: [0], rollingReservePct: [0],
  });

  readonly paymentForm = this.fb.group({
    enableCards: [true], enableUpi: [true], enableNetBanking: [false], enableWallet: [false],
    enableEmi: [false], enableBnpl: [false], enableQr: [false], enablePaymentLinks: [false], enableSubscriptions: [false],
  });

  kycFiles: Record<string, { fileName: string; fileSize: number; mimeType: string }> = {};

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.applicationId = Number(idParam);
      this.loadApplication(this.applicationId);
    } else {
      this.api.create().subscribe({
        next: (app) => {
          this.applicationId = app.id;
          this.detail.set(app);
          this.loading.set(false);
          this.router.navigate(['/merchant-onboarding', app.id, 'wizard'], { replaceUrl: true });
        },
        error: () => this.router.navigate(['/merchant-onboarding']),
      });
    }
  }

  loadApplication(id: number): void {
    this.api.getById(id).subscribe({
      next: (app) => {
        this.detail.set(app);
        if (app.business) this.businessForm.patchValue(app.business as never);
        const reg = app.addresses.find((a) => a.addressType === 'registered');
        const op = app.addresses.find((a) => a.addressType === 'operating');
        if (reg) this.registeredAddressForm.patchValue(reg as never);
        if (op) this.operatingAddressForm.patchValue(op as never);
        if (app.bank) this.bankForm.patchValue({ ...app.bank, accountNumber: '' });
        if (app.settlement) this.settlementForm.patchValue(app.settlement as never);
        if (app.payment) this.paymentForm.patchValue(app.payment as never);
        for (const doc of app.kycDocuments) {
          this.kycFiles[doc.documentType] = { fileName: doc.fileName, fileSize: doc.fileSize ?? 0, mimeType: doc.mimeType ?? 'application/pdf' };
        }
        this.loading.set(false);
        setTimeout(() => { if (this.stepper && app.currentStep > 1) this.stepper.selectedIndex = Math.min(app.currentStep - 1, 7); }, 0);
      },
      error: () => this.router.navigate(['/merchant-onboarding']),
    });
  }

  saveBusiness(): void {
    if (!this.applicationId || this.businessForm.invalid) return;
    this.saving.set(true);
    this.api.saveBusiness(this.applicationId, this.businessForm.getRawValue() as never).subscribe({
      next: (d) => { this.detail.set(d); this.saving.set(false); this.stepper?.next(); this.notification.success('Business information saved'); },
      error: () => { this.saving.set(false); this.notification.error('Failed to save business info'); },
    });
  }

  saveAddresses(): void {
    if (!this.applicationId || this.registeredAddressForm.invalid) return;
    this.saving.set(true);
    const addresses = [
      { addressType: 'registered' as const, ...this.registeredAddressForm.getRawValue() },
      { addressType: 'operating' as const, ...this.operatingAddressForm.getRawValue() },
    ];
    this.api.saveAddresses(this.applicationId, addresses as OnboardingAddress[]).subscribe({
      next: (d) => { this.detail.set(d); this.saving.set(false); this.stepper?.next(); this.notification.success('Addresses saved'); },
      error: () => { this.saving.set(false); this.notification.error('Failed to save addresses'); },
    });
  }

  onKycFileChange(type: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.kycFiles[type] = { fileName: file.name, fileSize: file.size, mimeType: file.type || 'application/pdf' };
  }

  saveKyc(): void {
    if (!this.applicationId) return;
    this.saving.set(true);
    const documents = Object.entries(this.kycFiles).map(([documentType, f]) => ({
      documentType, fileName: f.fileName, fileSize: f.fileSize, mimeType: f.mimeType,
      storagePath: `/uploads/onboarding/${this.applicationId}/${f.fileName}`,
    }));
    this.api.saveKyc(this.applicationId, documents).subscribe({
      next: (d) => { this.detail.set(d); this.saving.set(false); this.stepper?.next(); this.notification.success('KYC documents saved'); },
      error: () => { this.saving.set(false); this.notification.error('Failed to save KYC documents'); },
    });
  }

  saveBank(): void {
    if (!this.applicationId || this.bankForm.invalid) return;
    this.saving.set(true);
    this.api.saveBank(this.applicationId, this.bankForm.getRawValue() as never).subscribe({
      next: (d) => { this.detail.set(d); this.saving.set(false); this.stepper?.next(); this.notification.success('Bank details saved'); },
      error: () => { this.saving.set(false); this.notification.error('Failed to save bank details'); },
    });
  }

  saveSettlement(): void {
    if (!this.applicationId) return;
    this.saving.set(true);
    this.api.saveSettlement(this.applicationId, this.settlementForm.getRawValue() as never).subscribe({
      next: (d) => { this.detail.set(d); this.saving.set(false); this.stepper?.next(); this.notification.success('Settlement config saved'); },
      error: () => { this.saving.set(false); this.notification.error('Failed to save settlement config'); },
    });
  }

  savePayment(): void {
    if (!this.applicationId) return;
    this.saving.set(true);
    this.api.savePayment(this.applicationId, this.paymentForm.getRawValue() as never).subscribe({
      next: (d) => { this.detail.set(d); this.saving.set(false); this.stepper?.next(); this.notification.success('Payment config saved'); },
      error: () => { this.saving.set(false); this.notification.error('Failed to save payment config'); },
    });
  }

  submitApplication(): void {
    if (!this.applicationId) return;
    this.saving.set(true);
    this.api.submit(this.applicationId).subscribe({
      next: () => {
        this.saving.set(false);
        this.notification.success('Application submitted successfully');
        this.router.navigate(['/merchant-onboarding', this.applicationId]);
      },
      error: () => { this.saving.set(false); this.notification.error('Failed to submit application'); },
    });
  }

  goToStep(index: number): void {
    if (this.stepper) this.stepper.selectedIndex = index;
  }
}
