import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SettingsStateService } from '../../services/settings-state.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { FeatureFlag } from '../../models/settings.models';

@Component({
  selector: 'app-settings-feature-flags',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
  ],
  templateUrl: './settings-feature-flags.component.html',
  styleUrl: './settings-feature-flags.component.scss',
})
export class SettingsFeatureFlagsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly state = inject(SettingsStateService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  searchInput = '';
  editingId: number | null | 'new' = null;

  readonly flagForm = this.fb.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    description: [''],
    isEnabled: [false],
    isBeta: [false],
    rolloutPercentage: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
  });

  ngOnInit(): void {
    this.state.loadFeatureFlags();
  }

  retry(): void {
    this.state.retry();
    this.state.loadFeatureFlags();
  }

  onSearch(): void {
    this.state.applySearch(this.searchInput.trim());
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.state.totalPages()) {
      this.state.setPage(page);
    }
  }

  pageStart(): number {
    return (this.state.currentPage() - 1) * this.state.pageSize() + 1;
  }

  pageEnd(): number {
    return Math.min(this.state.currentPage() * this.state.pageSize(), this.state.totalItems());
  }

  startCreate(): void {
    this.editingId = 'new';
    this.flagForm.reset({ isEnabled: false, isBeta: false, rolloutPercentage: 100 });
  }

  startEdit(flag: FeatureFlag): void {
    this.editingId = flag.id;
    this.flagForm.patchValue({
      code: flag.code,
      name: flag.name,
      description: flag.description ?? '',
      isEnabled: flag.isEnabled,
      isBeta: flag.isBeta,
      rolloutPercentage: flag.rolloutPercentage,
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.flagForm.reset();
  }

  saveFlag(): void {
    if (this.flagForm.invalid || !this.rbac.hasPermission(this.perms.SETTINGS_WRITE)) return;
    const id = this.editingId === 'new' ? null : this.editingId;
    this.state.saveFeatureFlag(id, this.flagForm.getRawValue() as Partial<FeatureFlag>);
    this.editingId = null;
    this.flagForm.reset();
  }

  deleteFlag(id: number): void {
    if (!this.rbac.hasPermission(this.perms.SETTINGS_WRITE)) return;
    if (confirm('Delete this feature flag?')) {
      this.state.deleteFeatureFlag(id);
    }
  }
}
