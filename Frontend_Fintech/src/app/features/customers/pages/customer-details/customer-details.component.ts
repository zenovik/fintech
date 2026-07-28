import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomersApiService } from '../../services/customers-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { CustomerDetail, CustomerTransaction } from '../../models/customers.models';
import { CUSTOMER_DETAIL_TABS } from '../../constants/customers.constants';

@Component({
  selector: 'app-customer-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, DatePipe, CurrencyPipe],
  templateUrl: './customer-details.component.html',
  styleUrl: './customer-details.component.scss',
})
export class CustomerDetailsComponent implements OnInit {
  private readonly api = inject(CustomersApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;
  readonly tabs = CUSTOMER_DETAIL_TABS;

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly errorMessage = signal('');
  readonly customer = signal<CustomerDetail | null>(null);
  readonly activeTab = signal('overview');
  readonly transactions = signal<CustomerTransaction[]>([]);
  readonly txLoading = signal(false);
  readonly saving = signal(false);
  statusForm = { status: 'active', reason: '' };

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab) this.activeTab.set(tab);
    this.load();
  }

  load(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.pageState.set('loading');
    this.api.getById(id).subscribe({
      next: (data) => {
        this.customer.set(data);
        this.statusForm.status = data.status;
        this.pageState.set('ready');
        if (this.activeTab() === 'transactions') this.loadTransactions();
      },
      error: () => {
        this.errorMessage.set('Customer not found.');
        this.pageState.set('error');
      },
    });
  }

  setTab(tab: string): void {
    this.activeTab.set(tab);
    if (tab === 'transactions') this.loadTransactions();
  }

  loadTransactions(): void {
    const c = this.customer();
    if (!c) return;
    this.txLoading.set(true);
    this.api.getTransactions(c.id).subscribe({
      next: (data) => {
        this.transactions.set(data.items);
        this.txLoading.set(false);
      },
      error: () => this.txLoading.set(false),
    });
  }

  updateStatus(): void {
    const c = this.customer();
    if (!c || !this.rbac.hasPermission(this.perms.CUSTOMERS_WRITE)) return;
    this.saving.set(true);
    this.api.updateStatus(c.id, this.statusForm.status, this.statusForm.reason || undefined).subscribe({
      next: (updated) => {
        this.customer.set(updated);
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  deleteCustomer(): void {
    const c = this.customer();
    if (!c || !confirm('Delete this customer?')) return;
    this.api.delete(c.id).subscribe({
      next: () => void this.router.navigateByUrl('/customers'),
    });
  }

  badgeClass(status: string): string {
    return `cust-badge cust-badge--${status}`;
  }

  get c() {
    return this.customer()!;
  }
}
