import { NotFoundError } from '../../../shared/exceptions/app.exception';
import { auditRecorder } from '../../audit';
import { notificationDispatch } from '../../notifications';
import { SettlementEngineRepository } from '../repositories/settlement-engine.repository';
import { SettlementRepository } from '../repositories/settlement.repository';

export class SettlementEngineService {
  constructor(
    private readonly engineRepo = new SettlementEngineRepository(),
    private readonly settlementRepo = new SettlementRepository(),
  ) {}

  async calendar(year?: number) {
    return (await this.engineRepo.getCalendar(year)).map((c) => ({
      date: c.calendar_date, isHoliday: Boolean(c.is_holiday), holidayName: c.holiday_name, regionCode: c.region_code,
    }));
  }

  async hold(settlementId: number, dto: { amount: number; holdType?: string; reason: string }, actorId?: number) {
    const settlement = await this.settlementRepo.findById(settlementId);
    if (!settlement) throw new NotFoundError('Settlement not found');
    const holdId = await this.engineRepo.hold(settlementId, dto.amount, dto.holdType ?? 'manual', dto.reason, actorId);
    void auditRecorder.record({ module: 'settlements', categoryCode: 'settlements', actionCode: 'settlement_hold', entityType: 'settlement', entityId: String(settlementId), description: dto.reason, userId: actorId, riskLevel: 'high' }).catch(() => {});
    return { holdId, settlementId, status: 'held' };
  }

  async release(settlementId: number, actorId?: number) {
    await this.engineRepo.release(settlementId, actorId);
    void auditRecorder.record({ module: 'settlements', categoryCode: 'settlements', actionCode: 'settlement_released', entityType: 'settlement', entityId: String(settlementId), description: 'Settlement hold released', userId: actorId }).catch(() => {});
    return { settlementId, status: 'released' };
  }

  async createReserve(merchantId: number, dto: Record<string, unknown>) {
    const id = await this.engineRepo.createReserve(merchantId, dto);
    return { id, merchantId, ...dto };
  }

  async listReserves(merchantId?: number) {
    return (await this.engineRepo.listReserves(merchantId)).map((r) => ({
      id: r.id, merchantId: r.merchant_id, reserveType: r.reserve_type,
      reservePct: r.reserve_pct ? Number(r.reserve_pct) : null, reserveAmount: Number(r.reserve_amount), currency: r.currency,
    }));
  }

  async retry(settlementId: number, actorId?: number) {
    await this.engineRepo.retry(settlementId);
    if (actorId) void notificationDispatch.dispatch({ userId: actorId, eventCode: 'settlement_failed', title: 'Settlement retry', body: `Settlement #${settlementId} queued for retry` }).catch(() => {});
    return { settlementId, status: 'pending' };
  }
}
