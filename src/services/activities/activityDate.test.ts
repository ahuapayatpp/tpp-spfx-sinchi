import { getLimaDateOnly, getLimaDateStartUtc } from './activityDate';

describe('activityDate', () => {
  it('uses the Lima calendar day when determining today', () => {
    expect(getLimaDateOnly(new Date('2026-10-31T04:59:59.000Z'))).toBe('2026-10-30');
    expect(getLimaDateOnly(new Date('2026-10-31T05:00:00.000Z'))).toBe('2026-10-31');
  });

  it('serializes the selected calendar day to Lima midnight in UTC', () => {
    expect(getLimaDateStartUtc('2026-10-30')).toBe('2026-10-30T05:00:00.000Z');
    expect(getLimaDateStartUtc('2026-10-30', 1)).toBe('2026-10-31T05:00:00.000Z');
  });

  it('rejects invalid date-only values', () => {
    expect(() => getLimaDateStartUtc('2026-02-30')).toThrow('fecha');
    expect(() => getLimaDateStartUtc('2026-10-30', 1.5)).toThrow('fecha');
  });
});
