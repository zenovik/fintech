import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';
import { UserStateService } from '../../services/user-state.service';
import { RoleApiService } from '../../../roles/services/role-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { AssignRolesDialogComponent } from '../../components/assign-roles-dialog/assign-roles-dialog.component';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CommonModule, RouterLink, MatProgressSpinnerModule, MatTabsModule, DatePipe, TitleCasePipe],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.scss',
})
export class UserDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly roleApi = inject(RoleApiService);
  readonly state = inject(UserStateService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;
  activeTab = 0;
  allRoles: { id: number; name: string }[] = [];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.state.loadUserDetail(id);
      this.roleApi.list().subscribe({ next: (d) => this.allRoles = d.items.map((r) => ({ id: r.id, name: r.name })) });
    }
  }

  openAssignRoles(): void {
    const u = this.state.selectedUser();
    if (!u) return;
    const ref = this.dialog.open(AssignRolesDialogComponent, {
      width: '480px',
      data: { userName: u.fullName, roles: this.allRoles, selectedIds: u.roleIds },
    });
    ref.afterClosed().subscribe((roleIds: number[] | undefined) => {
      if (roleIds) this.state.assignRoles(u.id, roleIds);
    });
  }

  confirmDelete(): void {
    const u = this.state.selectedUser();
    if (!u || !confirm(`Delete user "${u.fullName}"?`)) return;
    this.state.deleteUser(u.id);
  }

  roleNames(u: { roles: { name: string }[] }): string {
    return u.roles.map((r) => r.name).join(', ') || '—';
  }

  initials(u: { firstName: string; lastName: string }): string {
    return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase() || '?';
  }

  primaryRole(u: { roles: { name: string }[] }): string {
    return u.roles[0]?.name ?? 'No Role Assigned';
  }

  securityScore(u: { mfaEnabled: boolean; status: string }): number {
    let score = u.status === 'active' ? 60 : 30;
    if (u.mfaEnabled) score += 25;
    if (u.status === 'active') score += 15;
    return Math.min(score, 100);
  }
}
