import { BasePage } from './base.page';
import { ROUTES } from '../data/constants';

export class SandboxPage extends BasePage {
  async open(): Promise<void> {
    await this.goto(ROUTES.sandbox);
    await this.page.waitForLoadState('networkidle');
  }

  async expectLoaded(): Promise<void> {
    await this.expectHeading(/Sandbox/i);
  }

  simulateButtons = () => this.page.getByRole('button', { name: /simulate|run|test/i });
}
