import * as React from 'react';
import {
  DefaultButton,
  Icon,
  IconButton,
  MessageBar,
  MessageBarType,
  Persona,
  PersonaSize,
  ProgressIndicator,
  SearchBox
} from '@fluentui/react';
import type { IDayReviewRow, IDayReviewSummary } from '../models/adminActivityMetrics';
import { DAILY_HOURS_TARGET } from '../models/activityStatus';
import { isWorkDay } from '../utils/activityCalendar';
import { formatLongDate } from '../utils/activityFormatting';
import type { ActivityDayStatusKey } from '../models/activityStatus';
import { formatHours } from '../utils/activityFormatting';
import StatusBadge from '../../../shared/components/StatusBadge/StatusBadge';
import styles from '../styles/AdminActivities.module.scss';

type DayFilter = 'all' | ActivityDayStatusKey;
type SortKey = 'name' | 'hours' | 'status' | 'activities';

export interface IAdminDayReviewProps {
  date: string;
  rows: IDayReviewRow[];
  summary: IDayReviewSummary;
  rosterAvailable: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onSelectPerson: (row: IDayReviewRow) => void;
  onExportPerson: (row: IDayReviewRow) => void;
  onExportActivities: () => void;
  onExportSummary: () => void;
}

const statusOrder: Record<ActivityDayStatusKey, number> = {
  missing: 0,
  incomplete: 1,
  complete: 2,
  nonWorkday: 3
};

function normalized(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-PE');
}

export default function AdminDayReview(props: IAdminDayReviewProps): React.ReactElement {
  const workday = isWorkDay(props.date);
  const [filter, setFilter] = React.useState<DayFilter>('all');
  const [sortKey, setSortKey] = React.useState<SortKey>('status');
  const [sortAscending, setSortAscending] = React.useState(true);
  const search = normalized(props.search.trim());
  const searchRows = props.rows.filter(row => normalized(row.person.displayName).includes(search));
  const counts: Record<DayFilter, number> = {
    all: searchRows.length,
    missing: searchRows.filter(row => row.person.isInTeamGroup && row.status.key === 'missing').length,
    incomplete: searchRows.filter(row => row.person.isInTeamGroup && row.status.key === 'incomplete').length,
    complete: searchRows.filter(row => row.person.isInTeamGroup && row.status.key === 'complete').length,
    nonWorkday: searchRows.filter(row => row.status.key === 'nonWorkday').length
  };
  const teamCount = searchRows.filter(row => row.person.isInTeamGroup).length;
  const rows = searchRows
    .filter(row => !workday || filter === 'all' || (row.person.isInTeamGroup && row.status.key === filter))
    .sort((left, right) => {
      let comparison = 0;
      if (sortKey === 'name') {
        comparison = left.person.displayName.localeCompare(right.person.displayName, 'es');
      } else if (sortKey === 'hours') {
        comparison = left.hours - right.hours;
      } else if (sortKey === 'status') {
        comparison = statusOrder[left.status.key] - statusOrder[right.status.key];
      } else {
        comparison = left.activities.length - right.activities.length;
      }
      return (comparison || left.person.displayName.localeCompare(right.person.displayName, 'es')) *
        (sortAscending ? 1 : -1);
    });
  const filterLabels: Record<DayFilter, string> = {
    all: 'Todos',
    missing: 'Sin registro',
    incomplete: 'Incompletos',
    complete: 'Completos',
    nonWorkday: 'No laborable'
  };

  const sort = (key: SortKey): void => {
    if (sortKey === key) {
      setSortAscending(!sortAscending);
    } else {
      setSortKey(key);
      setSortAscending(true);
    }
  };

  const sortButton = (key: SortKey, label: string): React.ReactElement => (
    <button type="button" className={styles.sortButton} onClick={() => sort(key)}>
      {label}{sortKey === key && <Icon iconName={sortAscending ? 'SortUp' : 'SortDown'} aria-hidden="true" />}
    </button>
  );

  const personContent = (row: IDayReviewRow): React.ReactElement => (
    <div className={styles.adminPerson}>
      <Persona text={row.person.displayName} size={PersonaSize.size32} hidePersonaDetails />
      <span className={styles.adminPersonName}>
        {row.person.displayName}
        {!row.person.isInTeamGroup && <small>Fuera de SDC-Aplicaciones</small>}
      </span>
    </div>
  );

  const progress = (row: IDayReviewRow): React.ReactElement => (
    <div className={styles.adminProgress}>
      <ProgressIndicator
        percentComplete={Math.min(row.hours / DAILY_HOURS_TARGET, 1)}
        ariaLabel={`${formatHours(row.hours)} de ${DAILY_HOURS_TARGET} horas`}
      />
      <span>{formatHours(row.hours)} / {DAILY_HOURS_TARGET} h</span>
    </div>
  );

  return (
    <section className={styles.adminReviewSection} aria-labelledby="adminDayHeading">
      {!workday && (
        <MessageBar messageBarType={MessageBarType.info}>
          {formatLongDate(props.date)} es fin de semana; no se exige un mínimo de horas.
        </MessageBar>
      )}
      <div className={styles.adminSectionHeading}>
        <div>
          <h2 id="adminDayHeading">Equipo del día</h2>
          <p>Revisa el avance y abre el detalle para consultar sus actividades.</p>
        </div>
      </div>

      {workday && <div className={styles.adminKpis} aria-label="Resumen de la jornada">
        <button
          type="button"
          className={`${styles.adminKpi} ${styles.adminKpiFilter} ${styles.kpiSuccess} ${filter === 'complete' ? styles.adminKpiSelected : ''}`}
          aria-label={`Filtrar por estado: Completos (${counts.complete})`}
          aria-pressed={filter === 'complete'}
          disabled={!props.rosterAvailable}
          onClick={() => setFilter(filter === 'complete' ? 'all' : 'complete')}
        >
          <span>Completos</span><strong>{props.rosterAvailable ? counts.complete : '—'}<small> / {props.rosterAvailable ? teamCount : '—'}</small></strong>
        </button>
        <button
          type="button"
          className={`${styles.adminKpi} ${styles.adminKpiFilter} ${styles.kpiWarning} ${filter === 'incomplete' ? styles.adminKpiSelected : ''}`}
          aria-label={`Filtrar por estado: Incompletos (${counts.incomplete})`}
          aria-pressed={filter === 'incomplete'}
          disabled={!props.rosterAvailable}
          onClick={() => setFilter(filter === 'incomplete' ? 'all' : 'incomplete')}
        >
          <span>Incompletos</span><strong>{props.rosterAvailable ? counts.incomplete : '—'}</strong>
        </button>
        <button
          type="button"
          className={`${styles.adminKpi} ${styles.adminKpiFilter} ${styles.kpiError} ${filter === 'missing' ? styles.adminKpiSelected : ''}`}
          aria-label={`Filtrar por estado: Sin registro (${counts.missing})`}
          aria-pressed={filter === 'missing'}
          disabled={!props.rosterAvailable}
          onClick={() => setFilter(filter === 'missing' ? 'all' : 'missing')}
        >
          <span>Sin registro</span><strong>{props.rosterAvailable ? counts.missing : '—'}</strong>
        </button>
        <article className={styles.adminKpi}>
          <span>Horas registradas</span>
          <strong>{formatHours(props.summary.hours)}<small> / {props.summary.expectedHours ? `${formatHours(props.summary.expectedHours)} h` : '—'}</small></strong>
        </article>
      </div>}

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
          {workday && filter !== 'all' && (
            <>
              <span className={styles.adminActiveFilter}>Filtro: {filterLabels[filter]}</span>
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
        </div>
      </div>

      {rows.length === 0 ? (
        <div className={styles.adminEmpty} role="status">
          <Icon iconName="Search" aria-hidden="true" />
          <strong>No hay personas con esos filtros</strong>
          <span>Cambia la búsqueda o selecciona otro estado.</span>
        </div>
      ) : (
        <>
          <div className={styles.adminDayTableWrap}>
            <table className={styles.adminDayTable}>
              <thead><tr>
                <th scope="col">{sortButton('name', 'Persona')}</th>
                <th scope="col">{sortButton('hours', 'Progreso')}</th>
                <th scope="col">{sortButton('status', 'Estado')}</th>
                <th scope="col">{sortButton('activities', 'Actividades')}</th>
                <th scope="col"><span className={styles.visuallyHidden}>Acciones</span></th>
              </tr></thead>
              <tbody>{rows.map(row => (
                <tr key={row.person.id}>
                  <td>{personContent(row)}</td>
                  <td>{progress(row)}</td>
                  <td><StatusBadge variant={row.status.badgeVariant}>{row.status.label}</StatusBadge></td>
                  <td>{row.activities.length}</td>
                  <td className={styles.adminRowActions}>
                    <IconButton iconProps={{ iconName: 'RedEye' }} ariaLabel={`Ver actividades de ${row.person.displayName}`} onClick={() => props.onSelectPerson(row)} />
                    <IconButton iconProps={{ iconName: 'Download' }} ariaLabel={`Descargar actividades de ${row.person.displayName}`} onClick={() => props.onExportPerson(row)} />
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <ul className={styles.adminDayCards}>
            {rows.map(row => (
              <li key={row.person.id}>
                <div className={styles.adminCardPerson}>{personContent(row)}<StatusBadge variant={row.status.badgeVariant}>{row.status.label}</StatusBadge></div>
                {progress(row)}
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
