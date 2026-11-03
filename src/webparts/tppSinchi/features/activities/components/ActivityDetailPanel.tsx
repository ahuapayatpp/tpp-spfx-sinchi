import * as React from 'react';
import {
  Icon,
  Panel,
  PanelType,
  Persona,
  PersonaSize,
  ProgressIndicator
} from '@fluentui/react';
import type { ITeamActivityRecord } from '../../../../../services/activities/activityTypes';
import { isActivityForPerson } from '../models/adminActivityMetrics';
import type { IMonthReviewRow, IReviewPerson } from '../models/adminActivityMetrics';
import { DAILY_HOURS_TARGET, getActivityDayStatus } from '../models/activityStatus';
import { getCalendarDays, isWorkDay } from '../utils/activityCalendar';
import { formatHours, formatLongDate, formatMonth } from '../utils/activityFormatting';
import { getLimaDateOnly } from '../../../../../services/activities/activityDate';
import StatusBadge from '../../../shared/components/StatusBadge/StatusBadge';
import styles from '../styles/AdminActivities.module.scss';

export interface IActivityDetailPanelProps {
  isOpen: boolean;
  person?: IReviewPerson;
  activities: ITeamActivityRecord[];
  date: string;
  view: 'day' | 'month';
  monthRow?: IMonthReviewRow;
  onDismiss: () => void;
  onSelectDate: (date: string) => void;
}

export default function ActivityDetailPanel(props: IActivityDetailPanelProps): React.ReactElement {
  const person = props.person;
  const personActivities = person
    ? props.activities.filter(activity => isActivityForPerson(activity, person))
    : [];
  const selectedActivities = personActivities.filter(activity => activity.date === props.date);
  const selectedHours = selectedActivities.reduce((total, activity) => total + activity.hours, 0);
  const selectedStatus = getActivityDayStatus(selectedHours, isWorkDay(props.date));
  const calendarDays = getCalendarDays(props.date);
  const [year, month] = props.date.split('-').map(Number);
  const firstWeekday = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const today = getLimaDateOnly();
  const totalMonthHours = personActivities
    .filter(activity => activity.date.startsWith(props.date.slice(0, 7)))
    .reduce((total, activity) => total + activity.hours, 0);

  return (
    <Panel
      isOpen={props.isOpen}
      onDismiss={props.onDismiss}
      type={PanelType.medium}
      headerText={person ? `Actividades de ${person.displayName}` : 'Detalle de actividades'}
      closeButtonAriaLabel="Cerrar detalle"
      isBlocking={false}
    >
      {person && (
        <div className={styles.detailPanelContent}>
          <div className={styles.detailPerson}>
            <Persona text={person.displayName} secondaryText={person.email} size={PersonaSize.size48} />
            {!person.isInTeamGroup && <StatusBadge variant="warning">Fuera del grupo del sitio</StatusBadge>}
          </div>

          {props.view === 'day' ? (
            <>
              <section className={styles.detailSummary} aria-label="Resumen de jornada">
                <div className={styles.detailSummaryTop}>
                  <h3>{formatLongDate(props.date)}</h3>
                  <StatusBadge variant={selectedStatus.badgeVariant}>{selectedStatus.label}</StatusBadge>
                </div>
                <strong className={styles.detailHours}>{formatHours(selectedHours)} <small>de {DAILY_HOURS_TARGET} h</small></strong>
                <ProgressIndicator
                  percentComplete={Math.min(selectedHours / DAILY_HOURS_TARGET, 1)}
                  ariaLabel={`${formatHours(selectedHours)} de ${DAILY_HOURS_TARGET} horas`}
                />
                {!isWorkDay(props.date) && <p>Fin de semana: no se exige un mínimo de horas.</p>}
              </section>
              <ActivityList activities={selectedActivities} />
            </>
          ) : (
            <>
              <section className={styles.detailSummary} aria-label="Resumen mensual">
                <div className={styles.detailSummaryTop}>
                  <h3>{formatMonth(props.date)}</h3>
                  <StatusBadge variant={props.monthRow?.status === 'complete' ? 'success' : 'warning'}>
                    {props.monthRow?.status === 'complete' ? 'Al día' : 'Con pendientes'}
                  </StatusBadge>
                </div>
                <strong className={styles.detailHours}>{formatHours(totalMonthHours)} <small>horas registradas</small></strong>
                {props.monthRow && (
                  <>
                    <ProgressIndicator
                      percentComplete={props.monthRow.percentage}
                      ariaLabel={`${Math.round(props.monthRow.percentage * 100)} por ciento de cumplimiento`}
                    />
                    <p>{Math.round(props.monthRow.percentage * 100)}% de cumplimiento · {props.monthRow.completeDays} de {props.monthRow.expectedDays} días completos · {props.monthRow.pendingDays.length} pendientes</p>
                  </>
                )}
              </section>
              <section className={styles.detailCalendarSection} aria-label={`Calendario de ${formatMonth(props.date)}`}>
                <h3>Calendario</h3>
                <div className={styles.detailCalendar}>
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => <span className={styles.detailCalendarWeekday} key={`${day}-${index}`}>{day}</span>)}
                  {Array.from({ length: firstWeekday }, (_, index) => <span key={`blank-${index}`} aria-hidden="true" />)}
                  {calendarDays.filter((day): day is string => !!day).map(day => {
                    const hours = personActivities
                      .filter(activity => activity.date === day)
                      .reduce((total, activity) => total + activity.hours, 0);
                    const status = getActivityDayStatus(hours, isWorkDay(day));
                    const isInProgress = day === today && status.key === 'missing';
                    const statusClass = isInProgress
                      ? styles.calendarDayInProgress
                      : status.key === 'complete'
                      ? styles.calendarDayComplete
                      : status.key === 'incomplete'
                        ? styles.calendarDayIncomplete
                        : status.key === 'missing'
                          ? styles.calendarDayMissing
                          : styles.calendarDayNonWorkday;
                    return (
                      <button
                        key={day}
                        type="button"
                        className={`${styles.detailCalendarDay} ${statusClass} ${props.date === day ? styles.detailCalendarSelected : ''}`}
                        disabled={day > today}
                        aria-label={`${formatLongDate(day)}, ${isInProgress ? 'en curso' : status.label}, ${formatHours(hours)} horas`}
                        aria-current={props.date === day ? 'date' : undefined}
                        onClick={() => props.onSelectDate(day)}
                      >
                        <span>{Number(day.slice(8))}</span>
                        {hours > 0 && <small>{formatHours(hours)} h</small>}
                      </button>
                    );
                  })}
                </div>
              </section>
              <ActivityList activities={selectedActivities} />
            </>
          )}
        </div>
      )}
    </Panel>
  );
}

function ActivityList(props: { activities: ITeamActivityRecord[] }): React.ReactElement {
  const activities = props.activities.slice().sort((left, right) => left.id - right.id);
  return (
    <section className={styles.detailActivities} aria-labelledby="detailActivitiesHeading">
      <div className={styles.detailActivityHeading}>
        <h3 id="detailActivitiesHeading">Actividades del día</h3>
        <span>{activities.length}</span>
      </div>
      {activities.length === 0 ? (
        <div className={styles.detailEmpty} role="status">
          <Icon iconName="ClipboardList" aria-hidden="true" />
          <strong>Sin actividades registradas</strong>
          <span>No hay registros para esta fecha.</span>
        </div>
      ) : (
        <ul className={styles.detailActivityList}>
          {activities.map(activity => (
            <li key={activity.id}>
              <div className={styles.detailActivityTitle}><strong>{activity.activity}</strong><b>{formatHours(activity.hours)} h</b></div>
              <div className={styles.detailActivityTags}>
                <span>{activity.process}</span><span>{activity.project}</span>
                {activity.module && <span>{activity.module}</span>}
                <span>{activity.hu}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
