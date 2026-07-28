import { RowDataPacket } from 'mysql2/promise';
import { NotFoundError } from '../../../shared/exceptions/app.exception';
import { AcceptanceRepository } from '../repositories/acceptance.repository';

export class AcceptanceService {
  constructor(private readonly repo = new AcceptanceRepository()) {}

  async analytics(merchantId?: number, days?: number) {
    const data = await this.repo.getAnalytics(merchantId, days ?? 30);
    const totals = (data.daily as RowDataPacket[]).reduce(
      (acc, d) => ({
        qrScans: acc.qrScans + Number(d.qr_scans ?? 0),
        qrPayments: acc.qrPayments + Number(d.qr_payments ?? 0),
        linkVisits: acc.linkVisits + Number(d.link_visits ?? 0),
        linkPayments: acc.linkPayments + Number(d.link_payments ?? 0),
        collectionsAmount: acc.collectionsAmount + Number(d.collections_amount ?? 0),
      }),
      { qrScans: 0, qrPayments: 0, linkVisits: 0, linkPayments: 0, collectionsAmount: 0 },
    );
    const conversionRate = totals.linkVisits > 0
      ? Math.round((totals.linkPayments / totals.linkVisits) * 1000) / 10 : 0;
    return { daily: data.daily, qrSummary: data.qrSummary, plSummary: data.plSummary, totals, conversionRate };
  }

  async merchantPortal(merchantId: number) {
    const data = await this.repo.getMerchantPortal(merchantId);
    if (!data) throw new NotFoundError('Merchant not found');
    return {
      merchant: { id: data.merchant.id, name: data.merchant.display_name, code: data.merchant.merchant_code },
      stats: {
        qrCodes: { total: Number(data.qr?.total ?? 0), active: Number(data.qr?.active ?? 0), scans: Number(data.qr?.scans ?? 0) },
        paymentLinks: { total: Number(data.paymentLinks?.total ?? 0), active: Number(data.paymentLinks?.active ?? 0), visits: Number(data.paymentLinks?.visits ?? 0) },
        collections: { total: Number(data.collections?.total ?? 0), matched: Number(data.collections?.matched ?? 0), amount: Number(data.collections?.amount ?? 0) },
        customers: Number(data.customers?.cnt ?? 0),
      },
    };
  }

  async topMerchants(limit?: number) {
    return (await this.repo.getTopMerchants(limit ?? 10)).map((r) => ({
      merchantId: r.merchant_id, merchantName: r.merchant_name,
      totalPayments: Number(r.total_payments ?? 0), totalAmount: Number(r.total_amount ?? 0),
      avgConversion: Number(r.avg_conversion ?? 0),
    }));
  }

  async failureInsights(merchantId?: number) {
    return await this.repo.getFailureInsights(merchantId);
  }
}
