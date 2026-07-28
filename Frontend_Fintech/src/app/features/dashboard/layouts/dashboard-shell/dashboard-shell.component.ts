import { Component, OnInit, inject, computed } from '@angular/core';
import { Router, RouterOutlet, RouterLink, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { DashboardSidenavComponent } from '../dashboard-sidenav/dashboard-sidenav.component';
import { DashboardTopnavComponent } from '../dashboard-topnav/dashboard-topnav.component';
import { OrganizationContextService } from '../../../organizations/services/organization-context.service';
import { AiAssistantComponent } from '../../../../shared/ai/components/ai-assistant/ai-assistant.component';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, DashboardSidenavComponent, DashboardTopnavComponent, AiAssistantComponent],
  templateUrl: './dashboard-shell.component.html',
  styleUrl: './dashboard-shell.component.scss',
})
export class DashboardShellComponent implements OnInit {
  private readonly orgContext = inject(OrganizationContextService);
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly showGlobalAi = computed(() => !this.currentUrl().includes('/dashboard/executive'));

  ngOnInit(): void {
    this.orgContext.load();
  }
}
