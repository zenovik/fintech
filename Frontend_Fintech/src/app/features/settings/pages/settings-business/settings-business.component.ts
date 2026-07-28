import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SettingsStateService } from '../../services/settings-state.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { OrganizationSettings } from '../../models/settings.models';

@Component({
  selector: 'app-settings-business',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
  ],
  templateUrl: './settings-business.component.html',
  styleUrl: './settings-business.component.scss',
})
export class SettingsBusinessComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly state = inject(SettingsStateService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly form = this.fb.group({
    legalName: ['', Validators.required],
    dbaName: [''],
    taxId: [''],
    addressLine1: [''],
    addressLine2: [''],
    city: [''],
    state: [''],
    postalCode: [''],
    country: [''],
    baseCurrency: ['USD', Validators.required],
    timezone: ['UTC', Validators.required],
    primaryRegion: [''],
    publicProfileEnabled: [false],
    payoutNotificationsEnabled: [true],
  });

  ngOnInit(): void {
    this.state.loadOrganization((data) => this.patchForm(data));
  }

  retry(): void {
    this.state.retry();
    this.state.loadOrganization((data) => this.patchForm(data));
  }

  save(): void {
    if (this.form.invalid) return;
    this.state.saveOrganization(this.form.getRawValue() as Partial<OrganizationSettings>);
  }

  private patchForm(data: OrganizationSettings): void {
    this.form.patchValue({
      legalName: data.legalName,
      dbaName: data.dbaName ?? '',
      taxId: data.taxId ?? '',
      addressLine1: data.addressLine1 ?? '',
      addressLine2: data.addressLine2 ?? '',
      city: data.city ?? '',
      state: data.state ?? '',
      postalCode: data.postalCode ?? '',
      country: data.country ?? '',
      baseCurrency: data.baseCurrency,
      timezone: data.timezone,
      primaryRegion: data.primaryRegion ?? '',
      publicProfileEnabled: data.publicProfileEnabled,
      payoutNotificationsEnabled: data.payoutNotificationsEnabled,
    });
  }
}
