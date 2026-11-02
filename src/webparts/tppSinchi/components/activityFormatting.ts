const activityDateFormatter = new Intl.DateTimeFormat('es-PE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});

const monthFormatter = new Intl.DateTimeFormat('es-PE', {
  month: 'long',
  year: 'numeric'
});

const longDateFormatter = new Intl.DateTimeFormat('es-PE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});

const hoursFormatter = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 });

function dateFromDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatActivityDate(value: string): string {
  return activityDateFormatter.format(dateFromDateOnly(value));
}

export function formatHours(value: number): string {
  return hoursFormatter.format(value);
}

export function formatMonth(value: string): string {
  return monthFormatter.format(dateFromDateOnly(value));
}

export function formatLongDate(value: string): string {
  return longDateFormatter.format(dateFromDateOnly(value));
}

export function formatDateInput(value: string): string {
  return activityDateFormatter.format(dateFromDateOnly(value));
}
