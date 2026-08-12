import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PortalDataService } from './core/services/portal-data.service';
import { SettingsService } from './core/services/settings.service';
import { SearchBarComponent } from './shared/components/search-bar/search-bar.component';
import { KeyboardService } from './core/services/keyboard.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'ep-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    SearchBarComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly data = inject(PortalDataService);
  readonly settings = inject(SettingsService);
  private readonly _keyboard = inject(KeyboardService);
  readonly sidenavOpen = signal(true);

  readonly nav: NavItem[] = [
    { label: 'Dashboard', route: '/', icon: 'dashboard' },
    { label: 'Repository', route: '/repository', icon: 'folder' },
    { label: 'Architecture', route: '/architecture', icon: 'account_tree' },
    { label: 'Database', route: '/database', icon: 'storage' },
    { label: 'API', route: '/api', icon: 'api' },
    { label: 'Frontend', route: '/frontend', icon: 'web' },
    { label: 'Backend', route: '/backend', icon: 'dns' },
    { label: 'Workers', route: '/workers', icon: 'schedule' },
    { label: 'Security', route: '/security', icon: 'security' },
    { label: 'Traceability', route: '/traceability', icon: 'timeline' },
    { label: 'Knowledge Graph', route: '/knowledge-graph', icon: 'hub' },
    { label: 'Dependencies', route: '/dependency-graph', icon: 'device_hub' },
    { label: 'Impact Analysis', route: '/impact', icon: 'analytics' },
    { label: 'Search', route: '/search', icon: 'search' },
    { label: 'Documentation', route: '/documentation', icon: 'menu_book' },
    { label: 'Metrics', route: '/metrics', icon: 'bar_chart' },
    { label: 'Settings', route: '/settings', icon: 'settings' },
    { label: 'About', route: '/about', icon: 'info' },
  ];

  toggleSidenav(): void {
    this.sidenavOpen.update((v) => !v);
  }
}
