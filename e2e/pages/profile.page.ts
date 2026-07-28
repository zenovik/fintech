import { BasePage } from './base.page';
import { ROUTES } from '../data/constants';

export class ProfilePage extends BasePage {
  async open(): Promise<void> {
    await this.goto(ROUTES.profile);
    await this.page.waitForLoadState('networkidle');
  }

  async expectLoaded(): Promise<void> {
    await this.expectHeading(/Account|Profile/i);
  }
}
