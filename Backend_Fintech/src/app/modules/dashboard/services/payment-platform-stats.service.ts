import { PaymentPlatformStatsRepository } from '../repositories/payment-platform-stats.repository';

export class PaymentPlatformStatsService {
  constructor(private readonly repo = new PaymentPlatformStatsRepository()) {}

  async getStats() {
    const s = await this.repo.getStats();
    return {
      devices: { total: s.devicesTotal, active: s.devicesActive },
      qr: { total: s.qrTotal, active: s.qrActive },
      settlements: { pending: s.settlementsPending, held: s.settlementsHeld },
      fraud: { pending: s.fraudPending },
      risk: { activeRules: s.riskRulesActive },
      revenue: { today: s.revenueToday },
    };
  }
}
