const LIMA_UTC_OFFSET_HOURS: number = 5;

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function formatDateOnly(year: number, month: number, day: number): string {
  const formattedMonth = month < 10 ? `0${month}` : `${month}`;
  const formattedDay = day < 10 ? `0${day}` : `${day}`;
  return `${year}-${formattedMonth}-${formattedDay}`;
}

export function getLimaDateOnly(date: Date = new Date()): string {
  const limaDate = new Date(date.getTime() - LIMA_UTC_OFFSET_HOURS * 60 * 60 * 1000);
  return formatDateOnly(
    limaDate.getUTCFullYear(),
    limaDate.getUTCMonth() + 1,
    limaDate.getUTCDate()
  );
}

export function getLimaDateStartUtc(date: string, daysAfter: number = 0): string {
  if (!isValidDateOnly(date) || !Number.isInteger(daysAfter)) {
    throw new Error('La fecha para consultar la jornada no tiene un formato válido.');
  }

  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + daysAfter, LIMA_UTC_OFFSET_HOURS)).toISOString();
}
