import { Component, inject } from '@angular/core';
import { DashboardAiDrawerComponent } from '../dashboard-ai-drawer/dashboard-ai-drawer.component';
import { DashboardAiSessionService } from '../../services/dashboard-ai-session.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';

@Component({
  selector: 'app-dashboard-ai-widget',
  standalone: true,
  imports: [DashboardAiDrawerComponent],
  template: `
    @if (rbac.hasPermission(perms.AI_VIEW)) {
      <app-dashboard-ai-drawer
        [open]="session.drawerOpen()"
        [canChat]="rbac.hasPermission(perms.AI_CHAT)"
        (closed)="session.closeDrawer()"
      />
    }
  `,
})
export class DashboardAiWidgetComponent {
  readonly session = inject(DashboardAiSessionService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;
}
