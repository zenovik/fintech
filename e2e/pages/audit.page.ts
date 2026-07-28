import { BasePage } from './base.page';
import { ROUTES } from '../data/constants';

export class AuditPage extends BasePage {
  async openDashboard(): Promise<void> {
    await this.goto(ROUTES.audit);
    await this.page.waitForLoadState('networkidle');
  }

  async openTimeline(): Promise<void> {
    await this.goto(`${ROUTES.audit}/timeline`);
  }

  async expectLoaded(): Promise<void> {
    await this.expectHeading(/Audit|Security|Compliance/i);
  }

  auditRows = () => this.page.locator('.audit-table tbody tr, .audit-timeline__item, table tbody tr');
}
