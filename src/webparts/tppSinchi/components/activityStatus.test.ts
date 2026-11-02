import {
  ACTIVITY_DAY_STATUS_LEGEND,
  DAILY_HOURS_TARGET,
  getActivityDayStatus
} from './activityStatus';

describe('activity day statuses', () => {
  it('uses the same threshold and labels across the status legend', () => {
    expect(DAILY_HOURS_TARGET).toBe(8);
    expect(ACTIVITY_DAY_STATUS_LEGEND.map(status => status.legendLabel)).toEqual([
      'Completa (8 h o más)',
      'Incompleta',
      'Sin registro',
      'No laborable'
    ]);
  });

  it('maps daily hours to the corresponding status and color variant', () => {
    expect(getActivityDayStatus(8, true)).toMatchObject({
      key: 'complete',
      label: 'Completa',
      badgeVariant: 'success'
    });
    expect(getActivityDayStatus(3.5, true)).toMatchObject({
      key: 'incomplete',
      label: 'Incompleta',
      badgeVariant: 'warning'
    });
    expect(getActivityDayStatus(0, true)).toMatchObject({
      key: 'missing',
      label: 'Sin registro',
      badgeVariant: 'error'
    });
    expect(getActivityDayStatus(0, false)).toMatchObject({
      key: 'nonWorkday',
      label: 'No laborable',
      badgeVariant: 'default'
    });
  });
});
