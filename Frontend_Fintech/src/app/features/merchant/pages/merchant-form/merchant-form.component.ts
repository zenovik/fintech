import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MerchantStateService } from '../../services/merchant-state.service';
import { MerchantApiService } from '../../services/merchant-api.service';
import {
  MERCHANT_BUSINESS_TYPES,
  MERCHANT_KYC_STATUSES,
  MERCHANT_RISK_LEVELS,
  MERCHANT_STATUSES,
} from '../../constants/merchant.constants';
import { CreateMerchantPayload } from '../../models/merchant.models';

@Component({
  selector: 'app-merchant-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './merchant-form.component.html',
  styleUrl: './merchant-form.component.scss',
})
export class MerchantFormComponent implements OnInit {
  @ViewChild('stepper') stepper?: MatStepper;

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(MerchantApiService);
  readonly state = inject(MerchantStateService);

  readonly businessTypes = MERCHANT_BUSINESS_TYPES;
  readonly kycStatuses = MERCHANT_KYC_STATUSES;
  readonly riskLevels = MERCHANT_RISK_LEVELS;
  readonly statuses = MERCHANT_STATUSES;

  isEdit = false;
  merchantId: number | null = null;
  loading = false;

  readonly businessForm = this.fb.group({
    legalName: ['', Validators.required],
    displayName: ['', Validators.required],
    businessType: [''],
    entityType: [''],
    registrationNumber: [''],
    website: [''],
    monthlyTpvEstimate: [null as number | null],
    regionId: [1, Validators.required],
    kycStatus: ['pending'],
    riskLevel: ['low'],
    status: ['pending'],
  });

  readonly contactForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    jobTitle: [''],
  });

  readonly addressForm = this.fb.group({
    line1: ['', Validators.required],
    line2: [''],
    city: ['', Validators.required],
    stateProvince: [''],
    postalCode: [''],
    countryCode: ['US'],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && this.route.snapshot.url.some((s) => s.path === 'edit')) {
      this.isEdit = true;
      this.merchantId = Number(idParam);
      this.loadMerchant(this.merchantId);
    }
  }

  loadMerchant(id: number): void {
    this.loading = true;
    this.api.getById(id).subscribe({
      next: (m) => {
        this.businessForm.patchValue({
          legalName: m.legalName,
          displayName: m.displayName,
          businessType: m.businessType ?? '',
          entityType: m.entityType ?? '',
          registrationNumber: m.registrationNumber ?? '',
          website: m.website ?? '',
          monthlyTpvEstimate: m.monthlyTpvEstimate,
          regionId: m.region.id,
          kycStatus: m.kycStatus,
          riskLevel: m.riskLevel,
          status: m.status,
        });
        const contact = m.contacts.find((c) => c.isPrimary) ?? m.contacts[0];
        if (contact) {
          this.contactForm.patchValue({
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
            phone: contact.phone ?? '',
            jobTitle: contact.jobTitle ?? '',
          });
        }
        const addr = m.addresses.find((a) => a.isPrimary) ?? m.addresses[0];
        if (addr) {
          this.addressForm.patchValue({
            line1: addr.line1,
            line2: addr.line2 ?? '',
            city: addr.city,
            stateProvince: addr.stateProvince ?? '',
            postalCode: addr.postalCode ?? '',
            countryCode: addr.countryCode,
          });
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/merchants']);
      },
    });
  }

  buildPayload(): CreateMerchantPayload {
    const b = this.businessForm.getRawValue();
    const c = this.contactForm.getRawValue();
    const a = this.addressForm.getRawValue();

    return {
      legalName: b.legalName!,
      displayName: b.displayName!,
      businessType: (b.businessType || undefined) as CreateMerchantPayload['businessType'],
      entityType: b.entityType || undefined,
      registrationNumber: b.registrationNumber || undefined,
      website: b.website || undefined,
      monthlyTpvEstimate: b.monthlyTpvEstimate ?? undefined,
      regionId: b.regionId!,
      kycStatus: b.kycStatus as CreateMerchantPayload['kycStatus'],
      riskLevel: b.riskLevel as CreateMerchantPayload['riskLevel'],
      status: b.status as CreateMerchantPayload['status'],
      contacts: this.isEdit
        ? undefined
        : [
            {
              firstName: c.firstName!,
              lastName: c.lastName!,
              email: c.email!,
              phone: c.phone || undefined,
              jobTitle: c.jobTitle || undefined,
              isPrimary: true,
            },
          ],
      addresses: this.isEdit
        ? undefined
        : [
            {
              line1: a.line1!,
              line2: a.line2 || undefined,
              city: a.city!,
              stateProvince: a.stateProvince || undefined,
              postalCode: a.postalCode || undefined,
              countryCode: a.countryCode || 'US',
              isPrimary: true,
            },
          ],
    };
  }

  submit(): void {
    if (this.businessForm.invalid) return;
    const payload = this.buildPayload();

    if (this.isEdit && this.merchantId) {
      this.state.updateMerchant(this.merchantId, payload);
    } else {
      if (this.contactForm.invalid || this.addressForm.invalid) return;
      this.state.createMerchant(payload);
    }
  }

  goToStep(index: number): void {
    if (!this.stepper) return;
    const current = this.stepper.selectedIndex ?? 0;
    if (index <= current) this.stepper.selectedIndex = index;
  }
}
