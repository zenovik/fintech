import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserStateService } from '../../services/user-state.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { PAGE_SIZE_OPTIONS, USER_STATUSES } from '../../constants/user.constants';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, DatePipe, TitleCasePipe],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  readonly state = inject(UserStateService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;
  searchInput = '';
  statusFilter = '';
  readonly statuses = USER_STATUSES;
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  ngOnInit(): void { this.state.loadUsers(); }
  onSearch(): void { this.state.applySearch(this.searchInput.trim()); }
  onFilter(): void { this.state.applyStatusFilter(this.statusFilter); }
  onClear(): void { this.searchInput = ''; this.statusFilter = ''; this.state.clearFilters(); }
  goToPage(p: number): void { if (p >= 1 && p <= this.state.totalPages()) this.state.setPage(p); }
  pageStart(): number { return (this.state.currentPage() - 1) * this.state.pageSize() + 1; }
  pageEnd(): number { return Math.min(this.state.currentPage() * this.state.pageSize(), this.state.totalItems()); }
  roleNames(u: { roles: { name: string }[] }): string { return u.roles.map((r) => r.name).join(', ') || '—'; }
}
