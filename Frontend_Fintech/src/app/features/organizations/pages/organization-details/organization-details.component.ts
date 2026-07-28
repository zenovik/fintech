import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrganizationsApiService } from '../../services/organizations-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { OrganizationDetail, OrganizationRole } from '../../models/organizations.models';
import { ORG_DETAIL_TABS } from '../../constants/organizations.constants';

@Component({
  selector: 'app-organization-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, DatePipe, CurrencyPipe],
  templateUrl: './organization-details.component.html',
  styleUrl: './organization-details.component.scss',
})
export class OrganizationDetailsComponent implements OnInit {
  private readonly api = inject(OrganizationsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;
  readonly tabs = ORG_DETAIL_TABS;

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly errorMessage = signal('');
  readonly org = signal<OrganizationDetail | null>(null);
  readonly activeTab = signal('overview');
  readonly roles = signal<OrganizationRole[]>([]);
  readonly saving = signal(false);
  readonly toast = signal('');

  newDomain = '';
  newKeyName = 'API Key';
  newKeyEnv = 'test';
  brandingForm = { companyName: '', logoInitials: '', primaryColor: '', secondaryColor: '', accentColor: '', logoUrl: '' as string | null };
  preferencesForm: Record<string, boolean> = {};
  billingForm = { planName: '', billingEmail: '', billingCycle: 'monthly', status: 'active', amount: 0, currency: 'USD' };

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab) this.activeTab.set(tab);
    this.load();
    this.api.getRoles().subscribe({ next: (r) => this.roles.set(r) });
  }

  load(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.pageState.set('loading');
    this.api.getById(id).subscribe({
      next: (data) => {
        this.org.set(data);
        if (data.branding) {
          this.brandingForm = {
            companyName: data.branding.companyName,
            logoInitials: data.branding.logoInitials ?? '',
            primaryColor: data.branding.primaryColor,
            secondaryColor: data.branding.secondaryColor,
            accentColor: data.branding.accentColor,
            logoUrl: data.branding.logoUrl,
          };
        }
        this.preferencesForm = {
          automatic_invoicing: Boolean(data.preferences['automatic_invoicing']),
          payout_notifications: Boolean(data.preferences['payout_notifications']),
          public_profile: Boolean(data.preferences['public_profile']),
        };
        if (data.billing) {
          this.billingForm = {
            planName: data.billing.planName,
            billingEmail: data.billing.billingEmail ?? '',
            billingCycle: data.billing.billingCycle,
            status: data.billing.status,
            amount: data.billing.amount,
            currency: data.billing.currency,
          };
        }
        this.pageState.set('ready');
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Failed to load organization');
        this.pageState.set('error');
      },
    });
  }

  setTab(tab: string): void {
    this.activeTab.set(tab);
    this.router.navigate([], { queryParams: { tab }, queryParamsHandling: 'merge' });
  }

  archive(): void {
    const o = this.org();
    if (!o || !confirm('Archive this organization?')) return;
    this.api.archive(o.id).subscribe({ next: () => this.load() });
  }

  restore(): void {
    const o = this.org();
    if (!o) return;
    this.api.restore(o.id).subscribe({ next: () => this.load() });
  }

  saveBranding(): void {
    const o = this.org();
    if (!o) return;
    this.saving.set(true);
    this.api.updateBranding(o.id, this.brandingForm).subscribe({
      next: () => { this.saving.set(false); this.showToast('Branding saved'); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  savePreferences(): void {
    const o = this.org();
    if (!o) return;
    this.saving.set(true);
    this.api.updatePreferences(o.id, this.preferencesForm).subscribe({
      next: () => { this.saving.set(false); this.showToast('Preferences saved'); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  saveBilling(): void {
    const o = this.org();
    if (!o) return;
    this.saving.set(true);
    this.api.updateBilling(o.id, this.billingForm).subscribe({
      next: () => { this.saving.set(false); this.showToast('Billing updated'); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  addDomain(): void {
    const o = this.org();
    if (!o || !this.newDomain.trim()) return;
    this.api.addDomain(o.id, { domain: this.newDomain.trim() }).subscribe({
      next: () => { this.newDomain = ''; this.load(); },
      error: (err) => this.showToast(err?.error?.message ?? 'Failed to add domain'),
    });
  }

  verifyDomain(domainId: number): void {
    const o = this.org();
    if (!o) return;
    this.api.updateDomain(o.id, domainId, { status: 'verified' }).subscribe({ next: () => this.load() });
  }

  deleteDomain(domainId: number): void {
    const o = this.org();
    if (!o || !confirm('Remove this domain?')) return;
    this.api.deleteDomain(o.id, domainId).subscribe({ next: () => this.load() });
  }

  createApiKey(): void {
    const o = this.org();
    if (!o) return;
    this.api.createApiKey(o.id, { name: this.newKeyName, environment: this.newKeyEnv }).subscribe({
      next: (key) => {
        if (key.secret) alert(`API key created. Copy now:\n${key.secret}`);
        this.load();
      },
    });
  }

  revokeApiKey(keyId: number): void {
    const o = this.org();
    if (!o || !confirm('Revoke this API key?')) return;
    this.api.revokeApiKey(o.id, keyId).subscribe({ next: () => this.load() });
  }

  removeMember(memberId: number): void {
    const o = this.org();
    if (!o || !confirm('Remove this member?')) return;
    this.api.removeMember(o.id, memberId).subscribe({ next: () => this.load() });
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 3000);
  }
}
