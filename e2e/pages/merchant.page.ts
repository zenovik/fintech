import { BasePage } from './base.page';
import { ROUTES } from '../data/constants';

export class MerchantPage extends BasePage {
  async openList(): Promise<void> {
    await this.goto(ROUTES.merchants);
    await this.expectHeading(/Merchant Management|Merchants/i);
  }

  async openCreate(): Promise<void> {
    await this.goto(ROUTES.merchantCreate);
    await this.expectHeading(/New Merchant|Business Information|Onboarding/i);
  }

  searchInput = () => this.page.getByPlaceholder(/MID or Business Name|Search/i);
  addMerchantButton = () => this.page.getByRole('link', { name: /Add Merchant/i });

  async search(term: string): Promise<void> {
    await this.searchInput().fill(term);
    await this.searchInput().press('Enter');
  }

  async expectMerchantInTable(name: string): Promise<void> {
    await this.page.getByRole('cell', { name }).or(this.page.getByText(name)).first().waitFor({ state: 'visible' });
  }
}
