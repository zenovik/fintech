import { BasePage } from './base.page';
import { ROUTES } from '../data/constants';

export class PaymentsPage extends BasePage {
  async openList(): Promise<void> {
    await this.goto(ROUTES.transactions);
    await this.expectHeading(/Transaction History|Transactions/i);
  }

  searchInput = () => this.page.getByPlaceholder(/Search by Transaction/i);
  refreshButton = () => this.page.getByTitle('Refresh');

  async openTransaction(ref: string): Promise<void> {
    await this.page.getByRole('link', { name: ref }).click();
    await this.expectHeading(new RegExp(ref));
  }

  async expectTimelineTab(): Promise<void> {
    await this.page.getByRole('tab', { name: 'Timeline' }).click();
    await this.page.locator('.timeline, .empty-text').first().waitFor({ state: 'visible' });
  }

  refundButton = () => this.page.getByRole('button', { name: 'Refund' });
}
