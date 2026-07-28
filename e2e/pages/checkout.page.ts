import { BasePage } from './base.page';
import { ROUTES } from '../data/constants';

export class CheckoutPage extends BasePage {
  async openSessions(): Promise<void> {
    await this.goto(ROUTES.checkoutSessions);
    await this.page.waitForLoadState('networkidle');
  }

  async openPublicCheckout(ref: string, secret: string): Promise<void> {
    await this.goto(`/pay/checkout/${ref}?client_secret=${encodeURIComponent(secret)}`);
  }

  async expectSessionsLoaded(): Promise<void> {
    await this.expectHeading(/Checkout|Sessions/i);
  }

  payButton = () => this.page.getByRole('button', { name: /pay|complete|submit/i });
}
