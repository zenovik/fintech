import { BasePage } from './base.page';
import { ROUTES } from '../data/constants';

export class ChargebacksPage extends BasePage {
  async openList(): Promise<void> {
    await this.goto(ROUTES.chargebacks);
    await this.expectHeading(/Chargeback|Disputes/i);
  }

  async openCreate(): Promise<void> {
    await this.goto(`${ROUTES.chargebacks}/create`);
  }

  async openDetails(id: number): Promise<void> {
    await this.goto(`${ROUTES.chargebacks}/${id}`);
  }
}
