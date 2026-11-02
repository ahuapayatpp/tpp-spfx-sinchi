function dateOnly(year: number, month: number, day: number): string {
  const formattedMonth = month < 10 ? `0${month}` : `${month}`;
  const formattedDay = day < 10 ? `0${day}` : `${day}`;
  return `${year}-${formattedMonth}-${formattedDay}`;
}

export function isWorkDay(date: string): boolean {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day !== 0 && day !== 6;
}

export function getCalendarDays(date: string): Array<string | undefined> {
  const [year, month] = date.split('-').map(Number);
  const firstDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const mondayOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return [
    ...Array<string | undefined>(mondayOffset).fill(undefined),
    ...Array.from({ length: daysInMonth }, (_, index) => dateOnly(year, month, index + 1))
  ];
}
