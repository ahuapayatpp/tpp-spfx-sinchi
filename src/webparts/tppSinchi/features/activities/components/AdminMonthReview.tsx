import * as React from 'react';
import { DefaultButton, Icon, IconButton, Persona, PersonaSize, SearchBox } from '@fluentui/react';
import type { IMonthReviewRow, IMonthReviewSummary } from '../models/adminActivityMetrics';
import { getCalendarDays, isWorkDay } from '../utils/activityCalendar';
import { getActivityDayStatus } from '../models/activityStatus';
import { getLimaDateOnly } from '../../../../../services/activities/activityDate';
import { formatHours } from '../utils/activityFormatting';
import StatusBadge from '../../../shared/components/StatusBadge/StatusBadge';
import styles from '../styles/AdminActivities.module.scss';

type MonthFilter = 'all' | 'pending' | 'complete';

export interface IAdminMonthReviewProps {
  date: string;
  rows: IMonthReviewRow[];
  summary: IMonthReviewSummary;
  rosterAvailable: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onSelectDay: (row: IMonthReviewRow, date: string) => void;
  onSelectPerson: (row: IMonthReviewRow) => void;
  onExportPerson: (row: IMonthReviewRow) => void;
  onExportActivities: () => void;
  onExportSummary: () => void;
}

function normalized(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-PE');
}

function dateTitle(date: string): string {
  return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short' })
    .format(new Date(`${date}T12:00:00Z`));
}

export default function AdminMonthReview(props: IAdminMonthReviewProps): React.ReactElement {
  const [filter, setFilter] = React.useState<MonthFilter>('all');
  const [sortDescending, setSortDescending] = React.useState(false);
  const days = getCalendarDays(props.date).filter((day): day is string => !!day);
  const today = getLimaDateOnly();
  const searched = props.rows.filter(row => normalized(row.person.displayName).includes(normalized(props.search.trim())));
  const counts = {
    pending: searched.filter(row => row.person.isInTeamGroup && row.status === 'pending').length,
    complete: searched.filter(row => row.person.isInTeamGroup && row.status === 'complete').length
  };
  const teamCount = searched.filter(row => row.person.isInTeamGroup).length;
  const rows = searched
    .filter(row => filter === 'all' || (row.person.isInTeamGroup && row.status === filter))
    .sort((left, right) => {
      const compared = left.pendingDays.length - right.pendingDays.length || left.percentage - right.percentage;
      return (sortDescending ? -compared : compared) || left.person.displayName.localeCompare(right.person.displayName, 'es');
    });
  const dayHeaders = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  const cell = (row: IMonthReviewRow, date: string): React.ReactElement => {
    const hours = row.hoursByDate[date] || 0;
    const status = !isWorkDay(date)
      ? getActivityDayStatus(0, false)
      : getActivityDayStatus(hours, true);
    const isFuture = date > today;
    const isInProgress = date === today && status.key === 'missing';
    const displayStatus = isInProgress ? 'En curso' : !isWorkDay(date) ? 'No laborable' : status.label;
    const cellClass = isInProgress
      ? styles.matrixInProgress
      : (status.key === 'complete' || (!isWorkDay(date) && hours > 0))
      ? styles.matrixComplete
      : status.key === 'incomplete'
        ? styles.matrixIncomplete
        : status.key === 'missing'
          ? styles.matrixMissing
          : styles.matrixNonWorkday;
    return (
      <td key={date} className={`${styles.matrixDay} ${!isWorkDay(date) ? styles.matrixWeekend : ''}`}>
        {isFuture ? <span aria-hidden="true">—</span> : (
          <button
            type="button"
            className={`${styles.matrixCell} ${cellClass}`}
            aria-label={`${row.person.displayName}, ${dateTitle(date)}: ${displayStatus}${hours ? `, ${formatHours(hours)} horas` : ''}`}
            title={`${row.person.displayName} · ${dateTitle(date)} · ${displayStatus}${hours ? ` · ${formatHours(hours)} h` : ''}`}
            onClick={() => props.onSelectDay(row, date)}
          >
            {hours > 0 && (status.key === 'complete' || !isWorkDay(date))
              ? <Icon iconName="CheckMark" aria-hidden="true" />
              : status.key === 'incomplete' || isInProgress
                ? <Icon iconName="Clock" aria-hidden="true" />
                : status.key === 'missing'
                  ? <Icon iconName="Warning" aria-hidden="true" />
                  : null}
          </button>
        )}
      </td>
    );
  };

  return (
    <section className={styles.adminReviewSection} aria-labelledby="adminMonthHeading">
      {/* <div className={styles.adminSectionHeading}>
        <div>
          <h2 id="adminMonthHeading">Cumplimiento por persona</h2>
          <p>Selecciona un día de la matriz para consultar sus actividades.</p>
        </div>
      </div> */}

      <div className={styles.adminKpis} aria-label={`Resumen de ${props.date.slice(0, 7)}`}>
        <button
          type="button"
          className={`${styles.adminKpi} ${styles.adminKpiFilter} ${styles.kpiSuccess} ${filter === 'complete' ? styles.adminKpiSelected : ''}`}
          aria-label={`Filtrar por cumplimiento: Al día (${counts.complete})`}
          aria-pressed={filter === 'complete'}
          disabled={!props.rosterAvailable}
          onClick={() => setFilter(filter === 'complete' ? 'all' : 'complete')}
        >
          <span>Al día</span><strong>{props.rosterAvailable ? counts.complete : '—'}<small> / {props.rosterAvailable ? teamCount : '—'}</small></strong>
        </button>
        <button
          type="button"
          className={`${styles.adminKpi} ${styles.adminKpiFilter} ${styles.kpiWarning} ${filter === 'pending' ? styles.adminKpiSelected : ''}`}
          aria-label={`Filtrar por cumplimiento: Con pendientes (${counts.pending})`}
          aria-pressed={filter === 'pending'}
          disabled={!props.rosterAvailable}
          onClick={() => setFilter(filter === 'pending' ? 'all' : 'pending')}
        >
          <span>Con pendientes</span><strong>{props.rosterAvailable ? counts.pending : '—'}</strong>
        </button>
        <article className={styles.adminKpi}><span>Cumplimiento promedio</span><strong>{props.rosterAvailable ? `${Math.round(props.summary.averagePercentage * 100)}%` : '—'}</strong></article>
        <article className={styles.adminKpi}><span>Horas registradas</span><strong>{formatHours(props.summary.hours)}<small> / {props.rosterAvailable ? `${formatHours(props.summary.expectedHours)} h` : '—'}</small></strong></article>
      </div>

      <div className={styles.adminFilters}>
        <SearchBox
          className={styles.adminSearch}
          placeholder="Buscar persona"
          ariaLabel="Buscar persona"
          value={props.search}
          onChange={(_, value) => props.onSearchChange(value || '')}
          onClear={() => props.onSearchChange('')}
        />
        <div className={styles.adminFilterActions}>
          {filter !== 'all' && (
            <>
              <span className={styles.adminActiveFilter}>Filtro: {filter === 'pending' ? 'Con pendientes' : 'Al día'}</span>
              <button type="button" className={styles.adminClearFilter} onClick={() => setFilter('all')}>Ver todos</button>
            </>
          )}
          <DefaultButton
            text="Descargar"
            iconProps={{ iconName: 'Download' }}
            menuProps={{
              ariaLabel: 'Opciones de descarga',
              items: [
                { key: 'activities', text: 'Actividades CSV', onClick: props.onExportActivities },
                { key: 'summary', text: 'Resumen CSV', disabled: !props.rosterAvailable, onClick: props.onExportSummary }
              ]
            }}
          />
          {/* <DefaultButton
            className={styles.adminFilterChip}
            text="Ordenar por pendientes"
            iconProps={{ iconName: sortDescending ? 'SortDown' : 'SortUp' }}
            onClick={() => setSortDescending(!sortDescending)}
          /> */}
        </div>
      </div>

      <div className={styles.matrixLegend} aria-label="Leyenda de la matriz">
        <span><i className={styles.matrixLegendComplete} /> Completo</span>
        <span><i className={styles.matrixLegendIncomplete} /> Incompleto</span>
        <span><i className={styles.matrixLegendMissing} /> Sin registro</span>
        <span><i className={styles.matrixLegendInProgress} /> En curso</span>
        <span><i className={styles.matrixLegendNonWorkday} /> Fin de semana</span>
      </div>

      {rows.length === 0 ? (
        <div className={styles.adminEmpty} role="status"><strong>No hay personas con esos filtros</strong><span>Cambia la búsqueda o el filtro.</span></div>
      ) : (
        <>
          <div className={styles.adminMatrixWrap}>
            <table className={styles.adminMatrix}>
              <thead><tr>
                <th scope="col" className={styles.matrixPersonHeader}>Persona</th>
                {days.map(day => <th key={day} scope="col" className={`${styles.matrixDateHeader} ${!isWorkDay(day) ? styles.matrixWeekend : ''}`} title={dateTitle(day)}>{Number(day.slice(8))}<small>{dayHeaders[new Date(`${day}T00:00:00Z`).getUTCDay()]}</small></th>)}
                <th scope="col">Pendientes</th><th scope="col">Cumplimiento</th><th scope="col">Estado</th><th scope="col"><span className={styles.visuallyHidden}>Acciones</span></th>
              </tr></thead>
              <tbody>{rows.map(row => (
                <tr key={row.person.id}>
                  <th scope="row" className={styles.matrixPersonCell}>
                    <div className={styles.adminPerson}><Persona text={row.person.displayName} size={PersonaSize.size32} hidePersonaDetails /><span className={styles.adminPersonName}>{row.person.displayName}{!row.person.isInTeamGroup && <small>Fuera de SDC-Aplicaciones</small>}</span></div>
                  </th>
                  {days.map(day => cell(row, day))}
                  <td>{row.pendingDays.length}</td>
                  <td><strong>{Math.round(row.percentage * 100)}%</strong><small className={styles.matrixSubtext}>{row.completeDays}/{row.expectedDays} días</small></td>
                  <td><StatusBadge variant={row.status === 'complete' ? 'success' : 'warning'}>{row.person.isInTeamGroup ? row.status === 'complete' ? 'Al día' : 'Con pendientes' : 'Fuera del grupo'}</StatusBadge></td>
                  <td className={styles.adminRowActions}>
                    <IconButton iconProps={{ iconName: 'RedEye' }} ariaLabel={`Ver detalle de ${row.person.displayName}`} onClick={() => props.onSelectPerson(row)} />
                    <IconButton iconProps={{ iconName: 'Download' }} ariaLabel={`Descargar actividades de ${row.person.displayName}`} onClick={() => props.onExportPerson(row)} />
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <ul className={styles.adminMonthCards}>
            {rows.map(row => (
              <li key={row.person.id}>
                <div className={styles.adminCardPerson}>
                  <div className={styles.adminPerson}><Persona text={row.person.displayName} size={PersonaSize.size32} hidePersonaDetails /><span className={styles.adminPersonName}>{row.person.displayName}{!row.person.isInTeamGroup && <small>Fuera de SDC-Aplicaciones</small>}</span></div>
                  <StatusBadge variant={row.status === 'complete' ? 'success' : 'warning'}>{row.person.isInTeamGroup ? row.status === 'complete' ? 'Al día' : 'Con pendientes' : 'Fuera del grupo'}</StatusBadge>
                </div>
                <strong>{Math.round(row.percentage * 100)}% de cumplimiento</strong>
                <p>{row.completeDays} días completos · {row.pendingDays.length} pendientes · {formatHours(row.hours)} h</p>
                <div className={styles.adminCardActions}>
                  <DefaultButton text="Ver detalle" iconProps={{ iconName: 'RedEye' }} onClick={() => props.onSelectPerson(row)} />
                  <IconButton iconProps={{ iconName: 'Download' }} ariaLabel={`Descargar actividades de ${row.person.displayName}`} onClick={() => props.onExportPerson(row)} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
