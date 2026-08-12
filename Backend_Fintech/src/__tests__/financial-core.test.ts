import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

interface JournalLineInput {
  accountCode: string;
  lineType: 'debit' | 'credit';
  amount: number;
}

function validateBalance(lines: JournalLineInput[]): { totalDebit: number; totalCredit: number } {
  let totalDebit = 0;
  let totalCredit = 0;
  for (const line of lines) {
    if (!Number.isFinite(line.amount) || line.amount <= 0) {
      throw new Error('Journal line amounts must be positive');
    }
    if (line.lineType === 'debit') totalDebit += line.amount;
    else totalCredit += line.amount;
  }
  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    throw new Error(`Journal out of balance: debit ${totalDebit} != credit ${totalCredit}`);
  }
  return { totalDebit, totalCredit };
}

describe('Financial Core — double-entry validation', () => {
  it('validates balanced journal lines', () => {
    const result = validateBalance([
      { accountCode: '1000-CASH', lineType: 'debit', amount: 100 },
      { accountCode: '4000-REV', lineType: 'credit', amount: 100 },
    ]);
    assert.equal(result.totalDebit, 100);
    assert.equal(result.totalCredit, 100);
  });

  it('rejects unbalanced journal', () => {
    assert.throws(() => validateBalance([
      { accountCode: '1000-CASH', lineType: 'debit', amount: 100 },
      { accountCode: '4000-REV', lineType: 'credit', amount: 50 },
    ]));
  });

  it('rejects non-positive amounts', () => {
    assert.throws(() => validateBalance([
      { accountCode: '1000-CASH', lineType: 'debit', amount: 0 },
      { accountCode: '4000-REV', lineType: 'credit', amount: 0 },
    ]));
  });
});
