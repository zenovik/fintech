import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrganizationsApiService } from '../../services/organizations-api.service';

@Component({
  selector: 'app-organization-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './organization-form.component.html',
  styleUrl: './organization-form.component.scss',
})
export class OrganizationFormComponent implements OnInit {
  private readonly api = inject(OrganizationsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly pageState = signal<'loading' | 'ready' | 'saving' | 'error'>('ready');
  readonly errorMessage = signal('');
  readonly isEdit = signal(false);
  private orgId: number | null = null;

  model = {
    code: '',
    legalName: '',
    displayName: '',
    dbaName: '',
    taxId: '',
    industry: 'Financial Services',
    website: '',
    status: 'pending',
    logoInitials: '',
    primaryColor: '#003ec7',
    baseCurrency: 'USD',
    timezone: 'UTC',
    locale: 'en-US',
    primaryRegion: '',
    description: '',
    addressLine1: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    countryCode: 'US',
    contactFirstName: '',
    contactLastName: '',
    contactEmail: '',
    contactPhone: '',
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'create') {
      this.isEdit.set(true);
      this.orgId = Number(id);
      this.pageState.set('loading');
      this.api.getById(this.orgId).subscribe({
        next: (org) => {
          this.model = {
            ...this.model,
            code: org.code,
            legalName: org.legalName,
            displayName: org.displayName,
            dbaName: org.dbaName ?? '',
            taxId: org.taxId ?? '',
            industry: org.industry ?? 'Financial Services',
            website: org.website ?? '',
            status: org.status,
            logoInitials: org.logoInitials ?? '',
            primaryColor: org.primaryColor ?? '#003ec7',
            baseCurrency: org.baseCurrency,
            timezone: org.timezone,
            locale: org.locale,
            primaryRegion: org.primaryRegion ?? '',
            description: org.description ?? '',
            addressLine1: org.addresses[0]?.line1 ?? '',
            city: org.addresses[0]?.city ?? '',
            stateProvince: org.addresses[0]?.stateProvince ?? '',
            postalCode: org.addresses[0]?.postalCode ?? '',
            countryCode: org.addresses[0]?.countryCode ?? 'US',
            contactFirstName: org.contacts[0]?.firstName ?? '',
            contactLastName: org.contacts[0]?.lastName ?? '',
            contactEmail: org.contacts[0]?.email ?? '',
            contactPhone: org.contacts[0]?.phone ?? '',
          };
          this.pageState.set('ready');
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message ?? 'Failed to load organization');
          this.pageState.set('error');
        },
      });
    }
  }

  save(): void {
    this.pageState.set('saving');
    this.errorMessage.set('');
    const payload: Record<string, unknown> = {
      legalName: this.model.legalName,
      displayName: this.model.displayName,
      dbaName: this.model.dbaName || undefined,
      taxId: this.model.taxId || undefined,
      industry: this.model.industry || undefined,
      website: this.model.website || undefined,
      status: this.model.status,
      logoInitials: this.model.logoInitials || this.model.displayName.slice(0, 2).toUpperCase(),
      primaryColor: this.model.primaryColor,
      baseCurrency: this.model.baseCurrency,
      timezone: this.model.timezone,
      locale: this.model.locale,
      primaryRegion: this.model.primaryRegion || undefined,
      description: this.model.description || undefined,
    };

    if (!this.isEdit()) {
      payload['code'] = this.model.code;
      if (this.model.addressLine1 && this.model.city) {
        payload['addresses'] = [{
          line1: this.model.addressLine1,
          city: this.model.city,
          stateProvince: this.model.stateProvince || undefined,
          postalCode: this.model.postalCode || undefined,
          countryCode: this.model.countryCode,
          isPrimary: true,
        }];
      }
      if (this.model.contactEmail && this.model.contactFirstName) {
        payload['contacts'] = [{
          firstName: this.model.contactFirstName,
          lastName: this.model.contactLastName || 'Contact',
          email: this.model.contactEmail,
          phone: this.model.contactPhone || undefined,
          isPrimary: true,
        }];
      }
      this.api.create(payload).subscribe({
        next: (org) => this.router.navigate(['/organizations', org.id]),
        error: (err) => {
          this.errorMessage.set(err?.error?.message ?? 'Failed to create organization');
          this.pageState.set('ready');
        },
      });
    } else if (this.orgId) {
      this.api.update(this.orgId, payload).subscribe({
        next: (org) => this.router.navigate(['/organizations', org.id]),
        error: (err) => {
          this.errorMessage.set(err?.error?.message ?? 'Failed to update organization');
          this.pageState.set('ready');
        },
      });
    }
  }
}
