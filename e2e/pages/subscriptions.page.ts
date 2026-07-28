import { BasePage } from './base.page';
import { ROUTES } from '../data/constants';

export class SubscriptionsPage extends BasePage {
  async openList(): Promise<void> {
    await this.goto(ROUTES.subscriptions);
    await this.page.waitForLoadState('networkidle');
  }

  async openCreate(): Promise<void> {
    await this.goto(`${ROUTES.subscriptions}/create`);
  }

  async expectLoaded(): Promise<void> {
    await this.expectHeading(/Subscription/i);
  }
}
