import type { StatusBadgeVariant } from './StatusBadge';

export const DAILY_HOURS_TARGET: number = 8;

export const ACTIVITY_DAY_STATUSES = {
  complete: {
    key: 'complete',
    label: 'Completa',
    legendLabel: 'Completa (8 h o más)',
    ariaLabel: 'jornada completa',
    badgeVariant: 'success'
  },
  incomplete: {
    key: 'incomplete',
    label: 'Incompleta',
    legendLabel: 'Incompleta',
    ariaLabel: 'jornada incompleta',
    badgeVariant: 'warning'
  },
  missing: {
    key: 'missing',
    label: 'Sin registro',
    legendLabel: 'Sin registro',
    ariaLabel: 'sin registro',
    badgeVariant: 'error'
  },
  nonWorkday: {
    key: 'nonWorkday',
    label: 'No laborable',
    legendLabel: 'No laborable',
    ariaLabel: 'día no laborable',
    badgeVariant: 'default'
  }
} as const satisfies Record<string, {
  key: string;
  label: string;
  legendLabel: string;
  ariaLabel: string;
  badgeVariant: StatusBadgeVariant;
}>;

export type ActivityDayStatus = typeof ACTIVITY_DAY_STATUSES[keyof typeof ACTIVITY_DAY_STATUSES];
export type ActivityDayStatusKey = keyof typeof ACTIVITY_DAY_STATUSES;

export function getActivityDayStatus(hours: number, isWorkday: boolean): ActivityDayStatus {
  if (!isWorkday) {
    return ACTIVITY_DAY_STATUSES.nonWorkday;
  }
  if (hours >= DAILY_HOURS_TARGET) {
    return ACTIVITY_DAY_STATUSES.complete;
  }
  if (hours > 0) {
    return ACTIVITY_DAY_STATUSES.incomplete;
  }
  return ACTIVITY_DAY_STATUSES.missing;
}

export const ACTIVITY_DAY_STATUS_LEGEND: ActivityDayStatus[] = [
  ACTIVITY_DAY_STATUSES.complete,
  ACTIVITY_DAY_STATUSES.incomplete,
  ACTIVITY_DAY_STATUSES.missing,
  ACTIVITY_DAY_STATUSES.nonWorkday
];
