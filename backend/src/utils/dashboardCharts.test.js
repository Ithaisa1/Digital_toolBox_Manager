import { describe, expect, it } from '@jest/globals';
import { getCostByCategory, getUpcomingPayments } from './dashboardCharts.js';

const now = new Date(Date.UTC(2026, 9, 15)); // 15 oct 2026

describe('getCostByCategory', () => {
  it('sums the monthly equivalent per category, highest first', () => {
    const result = getCostByCategory([
      { price: 10, billingCycle: 'monthly', tool: { category: { name: 'Design' } } },
      { price: 120, billingCycle: 'yearly', tool: { category: { name: 'Dev' } } },
      { price: 5, billingCycle: 'monthly', tool: { category: { name: 'Dev' } } },
      { price: 3, billingCycle: 'monthly', tool: { category: null } },
    ]);

    expect(result).toEqual([
      { category: 'Dev', monthlyCost: 15 },
      { category: 'Design', monthlyCost: 10 },
      { category: 'Uncategorized', monthlyCost: 3 },
    ]);
  });
});

describe('getUpcomingPayments', () => {
  it('returns one entry per month starting this month', () => {
    const result = getUpcomingPayments([], now);
    expect(result).toHaveLength(12);
    expect(result[0]).toEqual({ month: '2026-10', amount: 0 });
    expect(result[11].month).toBe('2027-09');
  });

  it('charges monthly plans every month from their next renewal', () => {
    const result = getUpcomingPayments(
      [{ price: 10, billingCycle: 'monthly', renewalDate: '2026-12-01' }],
      now,
    );
    expect(result[0].amount).toBe(0);
    expect(result[1].amount).toBe(0);
    expect(result[2].amount).toBe(10);
    expect(result[11].amount).toBe(10);
  });

  it('charges yearly plans once, rolling past dates forward', () => {
    const result = getUpcomingPayments(
      [{ price: 120, billingCycle: 'yearly', renewalDate: '2025-03-10' }],
      now,
    );
    const charged = result.filter((m) => m.amount > 0);
    expect(charged).toEqual([{ month: '2027-03', amount: 120 }]);
  });

  it('keeps monthly plans with a past renewal date charging every month', () => {
    const result = getUpcomingPayments(
      [{ price: 7.5, billingCycle: 'monthly', renewalDate: '2026-01-20' }],
      now,
    );
    expect(result.every((m) => m.amount === 7.5)).toBe(true);
  });
});
