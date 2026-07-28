import { BasePage } from './base.page';
import { ROUTES } from '../data/constants';

export class RefundsPage extends BasePage {
  async openList(): Promise<void> {
    await this.goto(ROUTES.refunds);
    await this.expectHeading(/Refund Queue|Refunds/i);
  }

  async openRequest(): Promise<void> {
    await this.goto(`${ROUTES.refunds}/request`);
  }

  searchInput = () => this.page.getByPlaceholder(/Search refunds/i);
  newRefundLink = () => this.page.getByRole('link', { name: /New Refund Request/i });
}
