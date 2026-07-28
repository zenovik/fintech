import { Component, OnInit, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SettingsStateService } from '../../services/settings-state.service';
import { BrandingService } from '../../services/branding.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { BrandingSettings } from '../../models/settings.models';

@Component({
  selector: 'app-settings-branding',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './settings-branding.component.html',
  styleUrl: './settings-branding.component.scss',
})
export class SettingsBrandingComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly brandingService = inject(BrandingService);
  private pendingRefresh = false;
  private prevPageState = 'idle';

  readonly state = inject(SettingsStateService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly form = this.fb.group({
    companyName: ['', Validators.required],
    logoUrl: [''],
    logoInitials: [''],
    primaryColor: ['#003ec7', Validators.required],
    secondaryColor: ['#1e40af', Validators.required],
    accentColor: ['#22c55e', Validators.required],
    faviconUrl: [''],
  });

  constructor() {
    effect(() => {
      const current = this.state.pageState();
      if (this.prevPageState === 'saving' && current === 'loaded' && this.pendingRefresh) {
        this.brandingService.refresh();
        this.pendingRefresh = false;
      }
      this.prevPageState = current;
    });
  }

  ngOnInit(): void {
    this.state.loadBranding((data) => this.patchForm(data));
  }

  retry(): void {
    this.state.retry();
    this.state.loadBranding((data) => this.patchForm(data));
  }

  save(): void {
    if (this.form.invalid) return;
    this.pendingRefresh = true;
    this.state.saveBranding(this.form.getRawValue() as Partial<BrandingSettings>);
  }

  private patchForm(data: BrandingSettings): void {
    this.form.patchValue({
      companyName: data.companyName,
      logoUrl: data.logoUrl ?? '',
      logoInitials: data.logoInitials ?? '',
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      accentColor: data.accentColor,
      faviconUrl: data.faviconUrl ?? '',
    });
  }
}
