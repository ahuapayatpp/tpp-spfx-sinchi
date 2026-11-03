import { getLimaDateOnly } from '../../../../../services/activities/activityDate';

function dateOnly(year: number, month: number, day: number): string {
  const formattedMonth = month < 10 ? `0${month}` : String(month);
  const formattedDay = day < 10 ? `0${day}` : String(day);
  return `${year}-${formattedMonth}-${formattedDay}`;
}

export function getMonthRange(date: string): { from: string; to: string } {
  const [year, month] = date.split('-').map(Number);
  return {
    from: dateOnly(year, month, 1),
    to: dateOnly(year, month, new Date(Date.UTC(year, month, 0)).getUTCDate())
  };
}

export function addDateDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return dateOnly(result.getUTCFullYear(), result.getUTCMonth() + 1, result.getUTCDate());
}

export function getDateInMonth(date: string, year: number, month: number): string {
  const day = Number(date.slice(-2));
  const adjustedDay = Math.min(day, new Date(Date.UTC(year, month, 0)).getUTCDate());
  const candidate = dateOnly(year, month, adjustedDay);
  const today = getLimaDateOnly();
  return candidate > today ? today : candidate;
}
