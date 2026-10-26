import { describe, expect, it } from '@jest/globals';
import { daysUntil, getNextRenewalDate } from './renewals.js';

const now = new Date('2026-10-25T15:30:00Z');
const iso = (date) => date.toISOString().slice(0, 10);

describe('getNextRenewalDate', () => {
  it('keeps future dates as they are', () => {
    expect(iso(getNextRenewalDate({ renewalDate: '2026-11-03', billingCycle: 'monthly' }, now))).toBe('2026-11-03');
  });

  it('treats today as upcoming', () => {
    expect(iso(getNextRenewalDate({ renewalDate: '2026-10-25T08:00:00Z', billingCycle: 'yearly' }, now))).toBe('2026-10-25');
  });

  it('rolls past monthly dates forward month by month', () => {
    expect(iso(getNextRenewalDate({ renewalDate: '2026-03-10', billingCycle: 'monthly' }, now))).toBe('2026-11-10');
    expect(iso(getNextRenewalDate({ renewalDate: '2026-03-28', billingCycle: 'monthly' }, now))).toBe('2026-10-28');
  });

  it('rolls past yearly dates forward year by year', () => {
    expect(iso(getNextRenewalDate({ renewalDate: '2024-02-01', billingCycle: 'yearly' }, now))).toBe('2027-02-01');
  });

  it('does not overflow short months', () => {
    const jan31 = { renewalDate: '2027-01-31', billingCycle: 'monthly' };
    expect(iso(getNextRenewalDate(jan31, new Date('2027-02-05')))).toBe('2027-02-28');
  });

  it('returns null for invalid dates', () => {
    expect(getNextRenewalDate({ renewalDate: 'nope', billingCycle: 'monthly' }, now)).toBeNull();
  });
});

describe('daysUntil', () => {
  it('counts whole days ignoring the time of day', () => {
    expect(daysUntil(new Date('2026-10-25T23:00:00Z'), now)).toBe(0);
    expect(daysUntil(new Date('2026-10-28T01:00:00Z'), now)).toBe(3);
  });
});
