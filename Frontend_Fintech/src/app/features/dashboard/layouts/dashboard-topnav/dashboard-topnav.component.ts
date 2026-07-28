import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { AuthStateService } from '../../../../core/auth/services/auth-state.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { NotificationsRealtimeService } from '../../../notifications/services/notifications-realtime.service';
import { OrganizationContextService } from '../../../organizations/services/organization-context.service';
import { SearchApiService, GlobalSearchResult } from '../../../../core/search/services/search-api.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';

@Component({
  selector: 'app-dashboard-topnav',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './dashboard-topnav.component.html',
  styleUrl: './dashboard-topnav.component.scss',
})
export class DashboardTopnavComponent implements OnInit {
  readonly authState = inject(AuthStateService);
  readonly rbac = inject(RbacService);
  readonly realtime = inject(NotificationsRealtimeService);
  readonly orgContext = inject(OrganizationContextService);
  private readonly searchApi = inject(SearchApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly perms = PERMISSIONS;

  searchQuery = '';
  readonly searchResults = signal<GlobalSearchResult[]>([]);
  readonly searchOpen = signal(false);
  readonly searchLoading = signal(false);
  private readonly searchSubject = new Subject<string>();

  get userName(): string {
    const u = this.authState.user();
    return u ? `${u.firstName} ${u.lastName}` : 'User';
  }

  get canSearch(): boolean {
    return this.rbac.hasPermission(PERMISSIONS.GLOBAL_SEARCH_READ);
  }

  ngOnInit(): void {
    if (!this.orgContext.loaded()) this.orgContext.load();
    if (this.rbac.hasPermission(PERMISSIONS.NOTIFICATIONS_READ)) {
      this.realtime.startPolling(30000);
    }

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((q) => {
        if (!this.canSearch || q.trim().length < 2) {
          this.searchResults.set([]);
          this.searchOpen.set(false);
          return of(null);
        }
        this.searchLoading.set(true);
        return this.searchApi.search(q.trim());
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => {
        this.searchLoading.set(false);
        if (!res) return;
        this.searchResults.set(res.results);
        this.searchOpen.set(res.results.length > 0);
      },
      error: () => {
        this.searchLoading.set(false);
        this.searchResults.set([]);
      },
    });
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  selectResult(result: GlobalSearchResult): void {
    this.searchOpen.set(false);
    this.searchQuery = '';
    this.router.navigateByUrl(result.route);
  }

  onOrgChange(orgId: number): void {
    this.orgContext.select(Number(orgId));
  }
}
