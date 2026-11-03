import * as React from 'react';
import { DefaultButton, MessageBar, MessageBarType } from '@fluentui/react';
import type { IActivityService } from '../../../../../services/activities/activityService';
import type { ITeamActivityRecord } from '../../../../../services/activities/activityTypes';
import type { ICollaboratorService } from '../../../../../services/collaborators/collaboratorTypes';
import type { ITeamMember } from '../../../../../services/collaborators/collaboratorTypes';
import { getLimaDateOnly } from '../../../../../services/activities/activityDate';
import LoadingState from '../../../shared/components/LoadingState/LoadingState';
import ActivityPeriodToolbar from '../components/ActivityPeriodToolbar';
import type { ActivityView } from '../components/ActivityPeriodToolbar';
import AdminDayReview from '../components/AdminDayReview';
import AdminMonthReview from '../components/AdminMonthReview';
import ActivityDetailPanel from '../components/ActivityDetailPanel';
import {
  getDayReviewRows,
  getDayReviewSummary,
  isActivityForPerson,
  getMonthReviewRows,
  getMonthReviewSummary,
  getReviewPeople
} from '../models/adminActivityMetrics';
import type { IDayReviewRow, IMonthReviewRow, IReviewPerson } from '../models/adminActivityMetrics';
import { formatLongDate, formatMonth } from '../utils/activityFormatting';
import { getMonthRange } from '../utils/activityDateRange';
import {
  createActivitiesCsv,
  createDaySummaryCsv,
  createMonthSummaryCsv,
  downloadCsv
} from '../utils/activityExport';
import styles from '../styles/AdminActivities.module.scss';

export interface IAdminActivitiesPageProps {
  activityDate: string;
  activityView: ActivityView;
  activityService: IActivityService;
  collaboratorService: ICollaboratorService;
  onMovePeriod: (direction: number) => void;
  onChangeDate: (date: string, view?: ActivityView) => void;
  onChangeView: (view: ActivityView) => void;
}

type LoadStatus = 'loading' | 'error' | 'ready';

function filePersonPart(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLocaleLowerCase('en-US');
}

export default function AdminActivitiesPage(props: IAdminActivitiesPageProps): React.ReactElement {
  const range = getMonthRange(props.activityDate);
  const [members, setMembers] = React.useState<ITeamMember[]>([]);
  const [activities, setActivities] = React.useState<ITeamActivityRecord[]>([]);
  const [status, setStatus] = React.useState<LoadStatus>('loading');
  const [error, setError] = React.useState('');
  const [rosterError, setRosterError] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [selectedPersonId, setSelectedPersonId] = React.useState<number | string | undefined>();
  const [selectedDetailDate, setSelectedDetailDate] = React.useState(props.activityDate);
  const [reloadKey, setReloadKey] = React.useState(0);
  const requestId = React.useRef(0);

  React.useEffect(() => {
    const currentRequest = ++requestId.current;
    setStatus('loading');
    setError('');
    setRosterError('');

    const rosterPromise = props.collaboratorService.getTeamMembers()
      .then(data => ({ ok: true as const, data }), reason => ({ ok: false as const, reason }));
    const activitiesPromise = props.activityService.getTeamActivities(range.from, range.to)
      .then(data => ({ ok: true as const, data }), reason => ({ ok: false as const, reason }));

    Promise.all([rosterPromise, activitiesPromise]).then(([rosterResult, activitiesResult]) => {
      if (currentRequest !== requestId.current) {
        return;
      }
      if (!activitiesResult.ok) {
        setActivities([]);
        setMembers(rosterResult.ok ? rosterResult.data : []);
        setRosterError(rosterResult.ok ? '' : 'No se pudo consultar el grupo Microsoft 365 asociado al sitio.');
        setError(activitiesResult.reason instanceof Error
          ? activitiesResult.reason.message
          : 'Ocurrió un error al consultar las actividades.');
        setStatus('error');
        return;
      }

      setActivities(activitiesResult.data);
      if (rosterResult.ok) {
        setMembers(rosterResult.data);
        setRosterError(rosterResult.data.length === 0
          ? 'El grupo Microsoft 365 asociado al sitio no contiene personas para revisar.'
          : '');
      } else {
        setMembers([]);
        setRosterError(rosterResult.reason instanceof Error
          ? rosterResult.reason.message
          : 'No se pudo consultar el grupo Microsoft 365 asociado al sitio.');
      }
      setStatus('ready');
    }).catch(reason => {
      if (currentRequest === requestId.current) {
        setError(reason instanceof Error ? reason.message : 'Ocurrió un error al consultar SharePoint.');
        setStatus('error');
      }
    });

    return () => {
      requestId.current++;
    };
  }, [props.activityService, props.collaboratorService, range.from, range.to, reloadKey]);

  const people: IReviewPerson[] = React.useMemo(
    () => getReviewPeople(members, activities),
    [members, activities]
  );
  const dayRows: IDayReviewRow[] = React.useMemo(
    () => getDayReviewRows(people, activities, props.activityDate),
    [people, activities, props.activityDate]
  );
  const monthRows: IMonthReviewRow[] = React.useMemo(
    () => getMonthReviewRows(people, activities, props.activityDate),
    [people, activities, props.activityDate]
  );
  const rosterAvailable = !rosterError && members.length > 0;
  const daySummary = getDayReviewSummary(dayRows, rosterAvailable, props.activityDate);
  const monthSummary = getMonthReviewSummary(monthRows, rosterAvailable);
  const selectedPerson = people.find(person => person.id === selectedPersonId);
  const selectedMonthRow = monthRows.find(row => row.person.id === selectedPersonId);

  const openDayDetail = (row: IDayReviewRow): void => {
    setSelectedPersonId(row.person.id);
    setSelectedDetailDate(props.activityDate);
  };

  const openMonthDetail = (row: IMonthReviewRow): void => {
    setSelectedPersonId(row.person.id);
    setSelectedDetailDate(row.pendingDays[0] || (props.activityDate <= getLimaDateOnly() ? props.activityDate : getLimaDateOnly()));
  };

  const activitiesFilename = `actividades_${range.from.slice(0, 7)}_todos.csv`;
  const summaryFilename = `${props.activityView === 'day' ? 'resumen_diario' : 'resumen'}_${range.from.slice(0, 7)}.csv`;
  const exportActivities = (): void => downloadCsv(activitiesFilename, createActivitiesCsv(activities));
  const exportSummary = (): void => {
    if (!rosterAvailable) {
      return;
    }
    const content = props.activityView === 'day'
      ? createDaySummaryCsv(dayRows, props.activityDate)
      : createMonthSummaryCsv(monthRows);
    downloadCsv(summaryFilename, content);
  };
  const exportPerson = (person: IReviewPerson): void => {
    const personActivities = activities.filter(activity => isActivityForPerson(activity, person));
    downloadCsv(
      `actividades_${range.from.slice(0, 7)}_${filePersonPart(person.displayName)}.csv`,
      createActivitiesCsv(personActivities)
    );
  };

  return (
    <section className={styles.adminActivitiesPage} aria-labelledby="adminActivitiesTitle">
      <header className={styles.adminPageHeader}>
        <div>
          <h1 id="adminActivitiesTitle">Revisión de actividades</h1>
          <p>{props.activityView === 'day'
            ? `${formatLongDate(props.activityDate)} · quién completó su jornada`
            : `Cumplimiento de ${formatMonth(props.activityDate)}`}</p>
        </div>
      </header>

      <ActivityPeriodToolbar
        date={props.activityDate}
        view={props.activityView}
        onMovePeriod={props.onMovePeriod}
        onChangeDate={props.onChangeDate}
        onChangeView={props.onChangeView}
      />

      {rosterError && status === 'ready' && (
        <MessageBar messageBarType={MessageBarType.warning} isMultiline>
          No se pudo obtener la lista de personas del grupo <strong>SDC-Aplicaciones</strong>. La información siguiente es parcial: solo se muestran autores con actividades y no se pueden identificar personas sin registro. {rosterError}
          <DefaultButton text="Reintentar" onClick={() => setReloadKey(key => key + 1)} />
        </MessageBar>
      )}

      {status === 'loading' && <LoadingState label="Cargando actividades del equipo..." />}
      {status === 'error' && (
        <MessageBar messageBarType={MessageBarType.error} isMultiline>
          No se pudieron cargar las actividades del equipo. {error}
          <DefaultButton text="Reintentar" onClick={() => setReloadKey(key => key + 1)} />
        </MessageBar>
      )}

      {status === 'ready' && props.activityView === 'day' && (
        <AdminDayReview
          date={props.activityDate}
          rows={dayRows}
          summary={daySummary}
          rosterAvailable={rosterAvailable}
          search={search}
          onSearchChange={setSearch}
          onSelectPerson={openDayDetail}
          onExportPerson={row => exportPerson(row.person)}
          onExportActivities={exportActivities}
          onExportSummary={exportSummary}
        />
      )}
      {status === 'ready' && props.activityView === 'month' && (
        <AdminMonthReview
          date={props.activityDate}
          rows={monthRows}
          summary={monthSummary}
          rosterAvailable={rosterAvailable}
          search={search}
          onSearchChange={setSearch}
          onSelectDay={(row, date) => {
            setSelectedPersonId(row.person.id);
            setSelectedDetailDate(date);
          }}
          onSelectPerson={openMonthDetail}
          onExportPerson={row => exportPerson(row.person)}
          onExportActivities={exportActivities}
          onExportSummary={exportSummary}
        />
      )}

      <ActivityDetailPanel
        isOpen={!!selectedPerson}
        person={selectedPerson}
        activities={activities}
        date={props.activityView === 'day' || selectedDetailDate.slice(0, 7) !== props.activityDate.slice(0, 7)
          ? props.activityDate
          : selectedDetailDate}
        view={props.activityView}
        monthRow={selectedMonthRow}
        onDismiss={() => setSelectedPersonId(undefined)}
        onSelectDate={setSelectedDetailDate}
      />
    </section>
  );
}
