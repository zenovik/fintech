import { BasePage } from './base.page';
import { ROUTES } from '../data/constants';

export class SettingsPage extends BasePage {
  async open(): Promise<void> {
    await this.goto(ROUTES.settings);
    await this.page.waitForLoadState('networkidle');
  }

  async openSecurity(): Promise<void> {
    await this.goto(`${ROUTES.settings}/security`);
  }

  async expectLoaded(): Promise<void> {
    await this.expectHeading(/Settings|General/i);
  }

  navItems = () => this.page.locator('.settings-nav a, .settings-shell a');
}

export class UsersPage extends BasePage {
  async openList(): Promise<void> {
    await this.goto(ROUTES.users);
    await this.page.waitForLoadState('networkidle');
  }

  async openCreate(): Promise<void> {
    await this.goto(`${ROUTES.users}/create`);
  }

  async expectLoaded(): Promise<void> {
    await this.expectHeading(/Users|User Management/i);
  }
}
