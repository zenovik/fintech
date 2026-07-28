import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomersApiService } from '../../services/customers-api.service';
import { OrganizationContextService } from '../../../organizations/services/organization-context.service';
import { CreateCustomerPayload } from '../../models/customers.models';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.scss',
})
export class CustomerFormComponent implements OnInit {
  private readonly api = inject(CustomersApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly orgContext = inject(OrganizationContextService);

  readonly isEdit = signal(false);
  readonly saving = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');

  form: CreateCustomerPayload = {
    customerType: 'individual',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: 'active',
    kycStatus: 'pending',
    riskLevel: 'low',
  };

  ngOnInit(): void {
    if (!this.orgContext.loaded()) this.orgContext.load();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && this.route.snapshot.url.some((s) => s.path === 'edit')) {
      this.isEdit.set(true);
      this.loading.set(true);
      this.api.getById(Number(id)).subscribe({
        next: (c) => {
          this.form = {
            primaryMerchantId: c.primaryMerchantId ?? undefined,
            customerType: c.customerType,
            firstName: c.firstName,
            lastName: c.lastName ?? undefined,
            displayName: c.displayName,
            email: c.email ?? undefined,
            phone: c.phone ?? undefined,
            companyName: c.companyName ?? undefined,
            kycStatus: c.kycStatus,
            riskLevel: c.riskLevel,
            status: c.status,
            notes: c.notes ?? undefined,
          };
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load customer.');
          this.loading.set(false);
        },
      });
    }
  }

  submit(): void {
    if (!this.form.firstName.trim()) {
      this.error.set('First name is required.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const id = Number(this.route.snapshot.paramMap.get('id'));

    const req = this.isEdit()
      ? this.api.update(id, this.form)
      : this.api.create(this.form);

    req.subscribe({
      next: (c) => void this.router.navigate(['/customers', c.id]),
      error: () => {
        this.error.set('Failed to save customer.');
        this.saving.set(false);
      },
    });
  }
}
