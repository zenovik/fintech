import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RoleStateService } from '../../services/role-state.service';
import { PermissionApiService } from '../../../permissions/services/permission-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';

@Component({
  selector: 'app-permission-matrix',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCheckboxModule, MatProgressSpinnerModule, TitleCasePipe],
  templateUrl: './permission-matrix.component.html',
  styleUrl: './permission-matrix.component.scss',
})
export class PermissionMatrixComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly state = inject(RoleStateService);
  private readonly permApi = inject(PermissionApiService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;
  readonly byModule = signal<Record<string, { id: number; code: string; name: string }[]>>({});
  readonly selected = signal<Set<number>>(new Set());
  roleId = 0;
  loading = true;

  ngOnInit(): void {
    this.roleId = Number(this.route.snapshot.paramMap.get('id'));
    this.state.loadRoles();
    this.state.loadRole(this.roleId);
    this.permApi.list().subscribe({
      next: (d) => {
        this.byModule.set(d.byModule);
        this.loading = false;
        const t = setInterval(() => {
          const r = this.state.selectedRole();
          if (r?.permissionIds) { this.selected.set(new Set(r.permissionIds)); clearInterval(t); }
        }, 100);
      },
      error: () => this.loading = false,
    });
  }

  actionColumn(code: string): 'view' | 'create' | 'edit' | 'delete' | 'approve' {
    const action = code.split(':')[1] ?? '';
    const map: Record<string, 'view' | 'create' | 'edit' | 'delete' | 'approve'> = {
      read: 'view',
      write: 'edit',
      delete: 'delete',
      export: 'approve',
      manage: 'approve',
    };
    return map[action] ?? 'view';
  }

  hierarchyIcon(index: number): string {
    return ['admin_panel_settings', 'cloud', 'description'][index] ?? 'shield';
  }

  isChecked(id: number): boolean { return this.selected().has(id); }

  toggle(id: number): void {
    const s = new Set(this.selected());
    if (s.has(id)) s.delete(id); else s.add(id);
    this.selected.set(s);
  }

  save(): void {
    if (!this.rbac.hasPermission(this.perms.PERMISSIONS_MANAGE)) return;
    this.state.savePermissions(this.roleId, [...this.selected()]);
  }
}
