import { AccountingRepository } from '../repositories/accounting.repository';

export class AccountingService {
  constructor(private readonly repo = new AccountingRepository()) {}

  async listAccounts() {
    return (await this.repo.listAccounts()).map((a) => ({
      id: a.id, accountCode: a.account_code, accountName: a.account_name, accountType: a.account_type,
      currency: a.currency, balance: Number(a.balance),
    }));
  }

  async listEntries(query: { page: number; pageSize: number; accountId?: number; referenceType?: string }) {
    const { items, total } = await this.repo.listEntries(query);
    return {
      items: items.map((e) => ({
        id: e.id, entryRef: e.entry_ref, accountCode: e.account_code, accountName: e.account_name,
        accountType: e.account_type, entryType: e.entry_type, amount: Number(e.amount), currency: e.currency,
        referenceType: e.reference_type, referenceId: e.reference_id, description: e.description, postedAt: e.posted_at,
      })),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) || 1 },
    };
  }

  async summary() {
    return (await this.repo.getSummary()).map((s) => ({
      accountType: s.account_type, accountCode: s.account_code, accountName: s.account_name,
      balance: Number(s.balance), computedBalance: Number(s.computed_balance ?? s.balance),
    }));
  }

  async export(query: { accountId?: number; referenceType?: string }) {
    const { items } = await this.repo.listEntries({ page: 1, pageSize: 10000, ...query });
    return { format: 'csv', rows: items.length, data: items };
  }
}
