import { BasePage } from './base.page';
import { ROUTES } from '../data/constants';

export class ReportsPage extends BasePage {
  async openCenter(): Promise<void> {
    await this.goto(ROUTES.reports);
    await this.page.waitForLoadState('networkidle');
  }

  async expectLoaded(): Promise<void> {
    await this.expectHeading(/Report|Analytics/i);
  }

  downloadButtons = () => this.page.getByRole('button', { name: /download|export|generate/i });
}
