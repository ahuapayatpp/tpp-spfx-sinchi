import * as React from 'react';
import {
  DefaultButton,
  Icon,
  IconButton,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  ProgressIndicator
} from '@fluentui/react';
import type { IActivityRecord } from '../../../services/activityService';
import { getLimaDateOnly } from '../../../services/activityDate';
import {
  ACTIVITY_DAY_STATUS_LEGEND,
  DAILY_HOURS_TARGET,
  getActivityDayStatus
} from './activityStatus';
import type { ActivityDayStatusKey } from './activityStatus';
import { formatHours, formatLongDate, formatMonth } from './activityFormatting';
import { getCalendarDays, isWorkDay } from './activityCalendar';
import LoadingState from './LoadingState';
import StatusBadge from './StatusBadge';
import styles from './TppSinchi.module.scss';

type ActivityView = 'day' | 'month';

export interface IActivitiesPageProps {
  activityDate: string;
  activityView: ActivityView;
  activityNotice: string;
  activities: IActivityRecord[];
  activitiesStatus: 'loading' | 'error' | 'ready';
  activitiesError: string;
  onDismissNotice: () => void;
  onOpenActivityDialog: () => void;
  onMovePeriod: (direction: number) => void;
  onChangeDate: (date: string, view?: ActivityView) => void;
  onChangeView: (view: ActivityView) => void;
  onRetryActivities: () => void;
  onOpenEditor: (activity: IActivityRecord, mode: 'edit' | 'duplicate') => void;
  onRequestDeletion: (activity: IActivityRecord) => void;
}

const CALENDAR_STATUS_CLASSES: Record<ActivityDayStatusKey, string> = {
  complete: styles.calendarComplete,
  incomplete: styles.calendarPartial,
  missing: styles.calendarMissing,
  nonWorkday: styles.calendarNonWorkday
};

export default function ActivitiesPage(props: IActivitiesPageProps): React.ReactElement {
  const selectedDayActivities = props.activities.filter(activity => activity.date === props.activityDate);
  const selectedDayHours = selectedDayActivities.reduce((total, activity) => total + activity.hours, 0);
  const today = getLimaDateOnly();
  const selectedDayIsWorkday = isWorkDay(props.activityDate);
  const progress = Math.min(selectedDayHours / DAILY_HOURS_TARGET, 1);
  const monthHours = props.activities.reduce((total, activity) => total + activity.hours, 0);
  const hoursByDate = new Map<string, number>();
  props.activities.forEach(activity => {
    hoursByDate.set(activity.date, (hoursByDate.get(activity.date) || 0) + activity.hours);
  });
  const calendarDays = getCalendarDays(props.activityDate);
  const expectedDays = calendarDays.filter(
    (date): date is string => !!date && date <= today && isWorkDay(date)
  );
  const completedDays = expectedDays.filter(
    date => (hoursByDate.get(date) || 0) >= DAILY_HOURS_TARGET
  ).length;
  const overdueDays = expectedDays.filter(
    date => date < today && (hoursByDate.get(date) || 0) < DAILY_HOURS_TARGET
  ).length;
  const dayStatus = getActivityDayStatus(selectedDayHours, selectedDayIsWorkday);
  const [year, month] = props.activityDate.split('-').map(Number);
  const firstWeekday = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;

  return (
    <section className={styles.activitiesPage} aria-labelledby="activitiesTitle">
      <header className={styles.activitiesHeader}>
        <div>
          <h1 id="activitiesTitle">Mis actividades</h1>
          <p>Consulta y registra las horas de tu jornada.</p>
        </div>
        <PrimaryButton
          iconProps={{ iconName: 'Add' }}
          text="Registrar actividad"
          onClick={props.onOpenActivityDialog}
        />
      </header>

      {props.activityNotice && (
        <MessageBar
          messageBarType={MessageBarType.success}
          dismissButtonAriaLabel="Cerrar aviso"
          onDismiss={props.onDismissNotice}
        >
          {props.activityNotice}
        </MessageBar>
      )}

      <div className={styles.activityToolbar}>
        <div className={styles.activityDateControls}>
          <IconButton
            iconProps={{ iconName: 'ChevronLeft' }}
            ariaLabel={props.activityView === 'day' ? 'Día anterior' : 'Mes anterior'}
            onClick={() => props.onMovePeriod(-1)}
          />
          <label className={styles.activityDateField}>
            <span className={styles.visuallyHidden}>Fecha de actividades</span>
            <input
              type="date"
              value={props.activityDate}
              max={today}
              onChange={event => props.onChangeDate(event.currentTarget.value)}
            />
          </label>
          <IconButton
            iconProps={{ iconName: 'ChevronRight' }}
            ariaLabel={props.activityView === 'day' ? 'Día siguiente' : 'Mes siguiente'}
            disabled={props.activityDate >= today}
            onClick={() => props.onMovePeriod(1)}
          />
          <DefaultButton
            text="Hoy"
            onClick={() => props.onChangeDate(today)}
            disabled={props.activityDate === today}
          />
        </div>
        <div className={styles.activityViewSwitch} role="group" aria-label="Tipo de vista">
          <DefaultButton
            text="Día"
            aria-pressed={props.activityView === 'day'}
            className={`${styles.viewButton} ${props.activityView === 'day' ? styles.selectedViewButton : ''}`}
            onClick={() => props.onChangeView('day')}
          />
          <DefaultButton
            text="Mes"
            aria-pressed={props.activityView === 'month'}
            className={`${styles.viewButton} ${props.activityView === 'month' ? styles.selectedViewButton : ''}`}
            onClick={() => props.onChangeView('month')}
          />
        </div>
      </div>

      {props.activitiesStatus === 'loading' && (
        <LoadingState label="Cargando tus actividades..." />
      )}
      {props.activitiesStatus === 'error' && (
        <MessageBar messageBarType={MessageBarType.error} isMultiline>
          No se pudieron cargar tus actividades. {props.activitiesError}
          <DefaultButton text="Reintentar" onClick={props.onRetryActivities} />
        </MessageBar>
      )}

      {props.activitiesStatus === 'ready' && props.activityView === 'day' && (
        <>
          <section className={styles.workdaySummary} aria-label="Progreso de la jornada">
            <div className={styles.workdaySummaryHeading}>
              <div>
                <h2>{formatLongDate(props.activityDate)}</h2>
                <StatusBadge variant={dayStatus.badgeVariant}>
                  {dayStatus.label}
                </StatusBadge>
              </div>
              <strong>{formatHours(selectedDayHours)} <span>de {DAILY_HOURS_TARGET} h</span></strong>
            </div>
            <ProgressIndicator
              percentComplete={progress}
              ariaLabel={`Jornada: ${formatHours(selectedDayHours)} de ${DAILY_HOURS_TARGET} horas`}
            />
            <p className={styles.supportingText}>
              {!selectedDayIsWorkday
                ? 'No se exige un mínimo de horas para fines de semana.'
                : selectedDayHours >= DAILY_HOURS_TARGET
                  ? selectedDayHours > DAILY_HOURS_TARGET
                    ? `Registraste ${formatHours(selectedDayHours - DAILY_HOURS_TARGET)} h adicionales.`
                    : 'Completaste tu jornada.'
                  : `Te faltan ${formatHours(DAILY_HOURS_TARGET - selectedDayHours)} h para completar tu jornada.`}
            </p>
          </section>

          <section className={styles.activityRecordsSection} aria-labelledby="dailyActivitiesHeading">
            <div className={styles.activitySectionHeader}>
              <h2 id="dailyActivitiesHeading">Actividades del día</h2>
              <span>{selectedDayActivities.length}</span>
            </div>
            {selectedDayActivities.length === 0 ? (
              <div className={styles.activityEmpty} role="status">
                <Icon iconName="ClipboardList" aria-hidden="true" />
                <h3>Aún no hay actividades para este día</h3>
                <p>Registra lo que realizaste para mantener actualizado tu avance.</p>
                <DefaultButton
                  text="Registrar actividad"
                  iconProps={{ iconName: 'Add' }}
                  onClick={props.onOpenActivityDialog}
                />
              </div>
            ) : (
              <ul className={styles.activityList}>
                {selectedDayActivities.map(activity => (
                  <li className={styles.activityRecord} key={activity.id}>
                    <div className={styles.activityRecordMain}>
                      <div className={styles.activityRecordTitle}>
                        <h3>{activity.activity}</h3>
                        <strong>{formatHours(activity.hours)} h</strong>
                      </div>
                      <div className={styles.activityMetadata}>
                        <span>{activity.process}</span>
                        <span>{activity.project}</span>
                        {activity.module && <span>{activity.module}</span>}
                        <span>{activity.hu}</span>
                      </div>
                    </div>
                    <div className={styles.activityActions} aria-label={`Acciones para ${activity.activity}`}>
                      <IconButton
                        iconProps={{ iconName: 'Edit' }}
                        ariaLabel={`Editar ${activity.activity}`}
                        title="Editar"
                        onClick={() => props.onOpenEditor(activity, 'edit')}
                      />
                      <IconButton
                        iconProps={{ iconName: 'Copy' }}
                        ariaLabel={`Duplicar ${activity.activity}`}
                        title="Duplicar"
                        onClick={() => props.onOpenEditor(activity, 'duplicate')}
                      />
                      <IconButton
                        iconProps={{ iconName: 'Delete' }}
                        ariaLabel={`Eliminar ${activity.activity}`}
                        title="Eliminar"
                        onClick={() => props.onRequestDeletion(activity)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {selectedDayActivities.length > 0 && (
              <div className={styles.activityTotal}>
                <span>Total del día</span>
                <strong>{formatHours(selectedDayHours)} h</strong>
              </div>
            )}
          </section>
        </>
      )}

      {props.activitiesStatus === 'ready' && props.activityView === 'month' && (
        <>
          <section className={styles.monthSummary} aria-label={`Resumen de ${formatMonth(props.activityDate)}`}>
            <article>
              <span>Horas registradas</span>
              <strong>{formatHours(monthHours)} h</strong>
            </article>
            <article>
              <span>Días completos</span>
              <strong>{completedDays} de {expectedDays.length}</strong>
            </article>
            <article>
              <span>Días por completar</span>
              <strong>{overdueDays}</strong>
            </article>
          </section>
          <section className={styles.monthCalendarSection} aria-labelledby="monthCalendarHeading">
            <h2 id="monthCalendarHeading">{formatMonth(props.activityDate)}</h2>
            <div className={styles.activityCalendar} role="group" aria-label={`Calendario de ${formatMonth(props.activityDate)}`}>
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
                <span className={styles.calendarWeekday} key={`${day}-${index}`}>
                  {day}
                </span>
              ))}
              {Array.from({ length: firstWeekday }, (_, index) => (
                <span className={styles.calendarBlank} key={`blank-${index}`} aria-hidden="true" />
              ))}
              {calendarDays.filter((date): date is string => !!date).map(date => {
                const hours = hoursByDate.get(date) || 0;
                const isFuture = date > today;
                const isToday = date === today;
                const status = getActivityDayStatus(hours, isWorkDay(date));
                const label = isFuture
                  ? `${formatLongDate(date)}, fecha futura`
                  : `${formatLongDate(date)}, ${status.ariaLabel}, ${formatHours(hours)} horas`;
                return (
                  <button
                    className={`${styles.calendarDay} ${CALENDAR_STATUS_CLASSES[status.key]} ${isToday ? styles.calendarToday : ''} ${date === props.activityDate ? styles.calendarSelected : ''}`}
                    key={date}
                    type="button"
                    aria-label={label}
                    aria-current={isToday ? 'date' : undefined}
                    disabled={isFuture}
                    onClick={() => props.onChangeDate(date, 'day')}
                  >
                    <span>{Number(date.slice(8))}</span>
                    <small>{formatHours(hours)} h</small>
                  </button>
                );
              })}
            </div>
            <div className={styles.activityLegend} aria-label="Estados de jornada">
              {ACTIVITY_DAY_STATUS_LEGEND.map(status => (
                <span key={status.label}>
                  <i className={`${styles.legendStatus} ${CALENDAR_STATUS_CLASSES[status.key]}`} />
                  {status.legendLabel}
                </span>
              ))}
            </div>
            <p className={styles.monthSelectionHint}>
              Selecciona un día para consultar sus actividades.
            </p>
          </section>
        </>
      )}
    </section>
  );
}
