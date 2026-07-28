import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RoleStateService } from '../../services/role-state.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './role-list.component.html',
  styleUrl: './role-list.component.scss',
})
export class RoleListComponent implements OnInit {
  readonly state = inject(RoleStateService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;
  ngOnInit(): void { this.state.loadRoles(); }
}
