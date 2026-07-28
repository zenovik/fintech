import { Component, inject, signal } from '@angular/core';
import { AiAssistantFabComponent } from '../ai-assistant-fab/ai-assistant-fab.component';
import { AiDrawerComponent } from '../ai-drawer/ai-drawer.component';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [AiAssistantFabComponent, AiDrawerComponent],
  template: `
    @if (rbac.hasPermission(perms.AI_VIEW)) {
      <app-ai-assistant-fab [open]="drawerOpen()" (toggled)="toggleDrawer()" />
      <app-ai-drawer
        [open]="drawerOpen()"
        [canChat]="rbac.hasPermission(perms.AI_CHAT)"
        (closed)="drawerOpen.set(false)"
      />
    }
  `,
})
export class AiAssistantComponent {
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;
  readonly drawerOpen = signal(false);

  toggleDrawer(): void {
    this.drawerOpen.update((open) => !open);
  }
}
