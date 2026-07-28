import { BasePage } from './base.page';
import { ROUTES } from '../data/constants';

export class PaymentLinksPage extends BasePage {
  async openList(): Promise<void> {
    await this.goto(ROUTES.paymentLinks);
    await this.page.waitForLoadState('networkidle');
  }

  async openCreate(): Promise<void> {
    await this.goto(`${ROUTES.paymentLinks}/create`);
  }

  async openPublicLink(token: string): Promise<void> {
    await this.goto(`/pay/${token}`);
  }

  async expectListLoaded(): Promise<void> {
    await this.expectHeading(/Payment Links|Links/i);
  }
}
