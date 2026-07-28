import { BasePage } from './base.page';
import { ROUTES } from '../data/constants';

export class QrPaymentsPage extends BasePage {
  async openList(): Promise<void> {
    await this.goto(ROUTES.qrPayments);
    await this.page.waitForLoadState('networkidle');
  }

  async openCreate(): Promise<void> {
    await this.goto(`${ROUTES.qrPayments}/create`);
  }

  async openPublicPay(token: string): Promise<void> {
    await this.goto(`/qr/${token}`);
  }

  async expectListLoaded(): Promise<void> {
    await this.expectHeading(/QR/i);
  }
}
