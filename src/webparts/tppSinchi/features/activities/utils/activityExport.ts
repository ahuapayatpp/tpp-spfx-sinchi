import type { ITeamActivityRecord } from '../../../../../services/activities/activityTypes';
import type { IDayReviewRow, IMonthReviewRow } from '../models/adminActivityMetrics';
import { ACTIVITY_DAY_STATUSES } from '../models/activityStatus';
import { formatHours } from './activityFormatting';

function safeCsvCell(value: string | number): string {
  let text = String(value ?? '');
  if (/^[\s\uFEFF]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(headers: Array<string | number>, rows: Array<Array<string | number>>): string {
  return `\uFEFF${[headers, ...rows].map(row => row.map(safeCsvCell).join(';')).join('\r\n')}`;
}

function formatCsvHours(value: number): string {
  return formatHours(value).replace('.', ',');
}

export function createActivitiesCsv(activities: ITeamActivityRecord[]): string {
  const sorted = activities.slice().sort((left, right) =>
    left.date.localeCompare(right.date) || left.authorName.localeCompare(right.authorName, 'es') || left.id - right.id
  );
  return toCsv(
    ['Fecha', 'Usuario', 'Actividad', 'Proceso', 'Proyecto', 'Módulo', 'HU', 'Horas'],
    sorted.map(activity => [
      activity.date,
      activity.authorName,
      activity.activity,
      activity.process,
      activity.project,
      activity.module || '',
      activity.hu,
      formatCsvHours(activity.hours)
    ])
  );
}

export function createDaySummaryCsv(rows: IDayReviewRow[], date: string): string {
  return toCsv(
    ['Fecha', 'Usuario', 'Horas registradas', 'Horas esperadas', 'Estado', 'Grupo'],
    rows.map(row => [
      date,
      row.person.displayName,
      formatCsvHours(row.hours),
      row.person.isInTeamGroup && row.status.key !== 'nonWorkday' ? '8' : '0',
      ACTIVITY_DAY_STATUSES[row.status.key].label,
      row.person.isInTeamGroup ? 'SDC-Aplicaciones' : 'Fuera del grupo'
    ])
  );
}

export function createMonthSummaryCsv(rows: IMonthReviewRow[]): string {
  return toCsv(
    ['Usuario', 'Días exigibles', 'Días completos', 'Días pendientes', 'Horas registradas', 'Horas esperadas', 'Cumplimiento', 'Estado', 'Grupo'],
    rows.map(row => [
      row.person.displayName,
      row.expectedDays,
      row.completeDays,
      row.pendingDays.length,
      formatCsvHours(row.hours),
      formatCsvHours(row.expectedHours),
      `${Math.round(row.percentage * 100)}%`,
      row.status === 'complete' ? 'Al día' : 'Con pendientes',
      row.person.isInTeamGroup ? 'SDC-Aplicaciones' : 'Fuera del grupo'
    ])
  );
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
