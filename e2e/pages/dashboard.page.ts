import { BasePage } from './base.page';
import { ROUTES } from '../data/constants';

export class DashboardPage extends BasePage {
  async open(): Promise<void> {
    await this.goto(ROUTES.dashboard);
  }

  async expectLoaded(): Promise<void> {
    await this.page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    await this.page.locator('.dash-main, .dash-content, app-dashboard-shell').first().waitFor({ state: 'visible' });
  }

  statCards = () => this.page.locator('.stat-card, .summary-card, .kpi-card');
}
