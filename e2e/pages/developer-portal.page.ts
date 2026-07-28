import { BasePage } from './base.page';
import { ROUTES } from '../data/constants';

export class DeveloperPortalPage extends BasePage {
  async open(): Promise<void> {
    await this.goto(ROUTES.developer);
    await this.expectHeading('Developer Portal');
  }
}

export class WebhooksPage extends BasePage {
  async open(): Promise<void> {
    await this.goto(ROUTES.webhooks);
    await this.expectHeading('Webhook Platform');
  }

  refreshButton = () => this.page.getByRole('button', { name: 'Refresh' });
  replaySection = () => this.page.locator('section').filter({ hasText: /Replay|Deliveries/i });
}
