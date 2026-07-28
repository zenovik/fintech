import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';

@Component({
  selector: 'app-audit-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './audit-shell.component.html',
  styleUrl: './audit-shell.component.scss',
})
export class AuditShellComponent {
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;
}
