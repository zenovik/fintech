import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';

@Component({
  selector: 'app-notifications-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './notifications-shell.component.html',
  styleUrl: './notifications-shell.component.scss',
})
export class NotificationsShellComponent {
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;
}
