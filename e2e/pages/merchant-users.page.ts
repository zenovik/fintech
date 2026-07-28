import { BasePage } from './base.page';
import { ROUTES } from '../data/constants';

export class MerchantUsersPage extends BasePage {
  async open(): Promise<void> {
    await this.goto(ROUTES.merchantUsers);
    await this.page.waitForLoadState('networkidle');
  }

  async expectLoaded(): Promise<void> {
    await this.expectHeading(/Merchant Users|Users/i);
  }
}
