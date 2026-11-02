import * as React from 'react';
import {
  createTheme,
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  Icon,
  IconButton,
  initializeIcons,
  Link,
  MessageBar,
  MessageBarType,
  Persona,
  PersonaSize,
  PrimaryButton,
  ProgressIndicator,
  Spinner,
  ThemeProvider
} from '@fluentui/react';
import styles from './TppSinchi.module.scss';
import type { ITppSinchiProps } from './ITppSinchiProps';
import type { IResource } from '../../../services/resourcesService';
import { getLimaDateOnly } from '../../../services/activityDate';
import type {
  IActivityCatalogs,
  IActivityDraft,
  IActivityOption,
  IActivityRecord
} from '../../../services/activityService';
import {
  ACTIVITY_DAY_STATUS_LEGEND,
  DAILY_HOURS_TARGET,
  getActivityDayStatus
} from './activityStatus';
import type { ActivityDayStatusKey } from './activityStatus';
import AddActivityDialog from './AddActivityDialog';
import IconBadge from './IconBadge';
import LoadingState from './LoadingState';
import ResourceItem from './ResourceItem';
import StatusBadge from './StatusBadge';
import sinchiColors from '../styles/SinchiColors.module.scss';

initializeIcons();

const CALENDAR_STATUS_CLASSES: Record<ActivityDayStatusKey, string> = {
  complete: styles.calendarComplete,
  incomplete: styles.calendarPartial,
  missing: styles.calendarMissing,
  nonWorkday: styles.calendarNonWorkday
};

const sinchiTheme = createTheme({
  palette: {
    themePrimary: sinchiColors.themePrimary,
    themeLighterAlt: sinchiColors.themeLighterAlt,
    themeLighter: sinchiColors.themeLighter,
    themeLight: sinchiColors.themeLight,
    themeTertiary: sinchiColors.themeTertiary,
    themeSecondary: sinchiColors.themeSecondary,
    themeDarkAlt: sinchiColors.themeDarkAlt,
    themeDark: sinchiColors.themeDark,
    themeDarker: sinchiColors.themeDarker,
    neutralLighterAlt: sinchiColors.neutralLighterAlt,
    neutralLighter: sinchiColors.neutralLighter,
    neutralLight: sinchiColors.neutralLight,
    neutralQuaternaryAlt: sinchiColors.neutralQuaternaryAlt,
    neutralQuaternary: sinchiColors.neutralQuaternary,
    neutralTertiaryAlt: sinchiColors.neutralTertiaryAlt,
    neutralTertiary: sinchiColors.neutralTertiary,
    neutralSecondary: sinchiColors.neutralSecondary,
    neutralPrimaryAlt: sinchiColors.neutralPrimaryAlt,
    neutralPrimary: sinchiColors.neutralPrimary,
    neutralDark: sinchiColors.neutralDark,
    black: sinchiColors.black,
    white: sinchiColors.white
  }
});

const events = [
  { initials: 'LR', name: 'Luis Rojas', period: '2 nov – 8 nov · 5 días', type: 'Soporte' },
  { initials: 'AT', name: 'Ana Torres', period: '2 nov – 6 nov · 5 días', type: 'Vacaciones' },
  { initials: 'CM', name: 'Carla Méndez', period: '9 nov – 13 nov · 5 días', type: 'Vacaciones' },
  { initials: 'MQ', name: 'Martín Quispe', period: '9 nov – 15 nov · 5 días', type: 'Soporte' }
];

interface IResourceGroup {
  title: string;
  resources: IResource[];
}

interface ITppSinchiState {
  currentPage: 'home' | 'activities';
  resources: IResource[];
  resourcesStatus: 'loading' | 'error' | 'ready';
  resourcesError: string;
  activityDialogOpen: boolean;
  activityNotice: string;
  dailyHours: number;
  dailyHoursStatus: 'loading' | 'error' | 'ready';
  dailyHoursError: string;
  activityProcessOptions: IActivityOption[];
  activityProjectOptions: IActivityOption[];
  activityCatalogsStatus: 'loading' | 'error' | 'ready';
  activityCatalogsError: string;
  activitySaving: boolean;
  activitySaveError: string;
  activityDate: string;
  activityView: 'day' | 'month';
  activities: IActivityRecord[];
  activitiesStatus: 'loading' | 'error' | 'ready';
  activitiesError: string;
  activityDialogMode: 'create' | 'edit' | 'duplicate';
  activityInitialDraft?: IActivityDraft;
  editingActivityId?: number;
  deleteActivity?: IActivityRecord;
  deletingActivity: boolean;
  deleteActivityError: string;
}

function formatActivityDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(year, month - 1, day));
}

function formatHours(value: number): string {
  return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 }).format(value);
}

function dateOnly(year: number, month: number, day: number): string {
  const formattedMonth = month < 10 ? `0${month}` : `${month}`;
  const formattedDay = day < 10 ? `0${day}` : `${day}`;
  return `${year}-${formattedMonth}-${formattedDay}`;
}

function getMonthRange(date: string): { from: string; to: string } {
  const [year, month] = date.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    from: dateOnly(year, month, 1),
    to: dateOnly(year, month, lastDay)
  };
}

function isWorkDay(date: string): boolean {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day !== 0 && day !== 6;
}

function addDateDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return dateOnly(result.getUTCFullYear(), result.getUTCMonth() + 1, result.getUTCDate());
}

function formatMonth(date: string): string {
  const [year, month] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' })
    .format(new Date(year, month - 1, 1));
}

function formatLongDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(year, month - 1, day));
}

function getCalendarDays(date: string): Array<string | undefined> {
  const [year, month] = date.split('-').map(Number);
  const firstDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const mondayOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return [
    ...Array<string | undefined>(mondayOffset).fill(undefined),
    ...Array.from({ length: daysInMonth }, (_, index) => dateOnly(year, month, index + 1))
  ];
}

function groupResources(resources: IResource[]): IResourceGroup[] {
  const groups = new Map<string, IResource[]>();

  resources.forEach(resource => {
    const categoryResources = groups.get(resource.category) || [];
    categoryResources.push(resource);
    groups.set(resource.category, categoryResources);
  });

  return Array.from(groups.entries()).map(([title, groupedResources]) => ({
    title,
    resources: groupedResources
  }));
}

const preventNavigation = (event: React.MouseEvent<HTMLElement>): void => {
  event.preventDefault();
};

export default class TppSinchi extends React.Component<ITppSinchiProps, ITppSinchiState> {
  public constructor(props: ITppSinchiProps) {
    super(props);
    this.state = {
      currentPage: 'home',
      resources: [],
      resourcesStatus: 'loading',
      resourcesError: '',
      activityDialogOpen: false,
      activityNotice: '',
      dailyHours: 0,
      dailyHoursStatus: 'loading',
      dailyHoursError: '',
      activityProcessOptions: [],
      activityProjectOptions: [],
      activityCatalogsStatus: 'loading',
      activityCatalogsError: '',
      activitySaving: false,
      activitySaveError: '',
      activityDate: getLimaDateOnly(),
      activityView: 'day',
      activities: [],
      activitiesStatus: 'ready',
      activitiesError: '',
      activityDialogMode: 'create',
      activityInitialDraft: undefined,
      deletingActivity: false,
      deleteActivityError: ''
    };
  }

  private _isMounted: boolean = false;
  private _activityCatalogRequestId: number = 0;
  private _dailyHoursRequestId: number = 0;
  private _activitiesRequestId: number = 0;
  private _activitySaveInProgress: boolean = false;

  public componentDidMount(): void {
    this._isMounted = true;
    this._loadResources();
    this._loadActivityCatalogs();
    this._loadDailyHours();
  }

  public componentWillUnmount(): void {
    this._isMounted = false;
  }

  public componentDidUpdate(previousProps: ITppSinchiProps): void {
    if (previousProps.resourcesService !== this.props.resourcesService) {
      this._loadResources();
    }
    if (previousProps.activityService !== this.props.activityService) {
      this._loadActivityCatalogs();
      this._loadDailyHours();
      if (this.state.currentPage === 'activities') {
        this._loadActivities();
      }
    } else if (previousProps.userDisplayName !== this.props.userDisplayName) {
      this._loadDailyHours();
      if (this.state.currentPage === 'activities') {
        this._loadActivities();
      }
    }
  }

  private _loadResources = (): void => {
    this.setState({ resourcesStatus: 'loading', resourcesError: '' });

    this.props.resourcesService.getResources()
      .then(resources => {
        if (this._isMounted) {
          this.setState({ resources, resourcesStatus: 'ready' });
        }
      })
      .catch(error => {
        console.error('No se pudieron cargar los recursos de SharePoint.', error);
        if (this._isMounted) {
          this.setState({
            resourcesStatus: 'error',
            resourcesError: error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
          });
        }
      });
  };

  private _loadActivityCatalogs = (): void => {
    const requestId = ++this._activityCatalogRequestId;
    this.setState({
      activityProcessOptions: [],
      activityProjectOptions: [],
      activityCatalogsStatus: 'loading',
      activityCatalogsError: ''
    });

    this.props.activityService.getCatalogs()
      .then((catalogs: IActivityCatalogs) => {
        if (this._isMounted && requestId === this._activityCatalogRequestId) {
          this.setState({
            activityProcessOptions: catalogs.processes,
            activityProjectOptions: catalogs.projects,
            activityCatalogsStatus: 'ready'
          });
        }
      })
      .catch(error => {
        console.error('No se pudieron cargar los catálogos de actividades.', error);
        if (this._isMounted && requestId === this._activityCatalogRequestId) {
          this.setState({
            activityCatalogsStatus: 'error',
            activityCatalogsError: error instanceof Error
              ? error.message
              : 'Ocurrió un error inesperado al cargar los procesos y proyectos.'
          });
        }
      });
  };

  private _loadDailyHours = (): void => {
    const requestId = ++this._dailyHoursRequestId;
    this.setState({ dailyHoursStatus: 'loading', dailyHoursError: '' });

    this.props.activityService.getDailyHours(this.props.userDisplayName, getLimaDateOnly())
      .then(
        dailyHours => {
          if (this._isMounted && requestId === this._dailyHoursRequestId) {
            this.setState({ dailyHours, dailyHoursStatus: 'ready' });
          }
        },
        error => {
          console.error('No se pudieron cargar las horas registradas de hoy.', error);
          if (this._isMounted && requestId === this._dailyHoursRequestId) {
            this.setState({
              dailyHoursStatus: 'error',
              dailyHoursError: error instanceof Error
                ? error.message
                : 'Ocurrió un error inesperado al consultar las horas de hoy.'
            });
          }
        }
      );
  };

  private _loadActivities = (date: string = this.state.activityDate): void => {
      const requestId = ++this._activitiesRequestId;
      const range = getMonthRange(date);
      this.setState({ activitiesStatus: 'loading', activitiesError: '' });

      this.props.activityService.getActivities(this.props.userDisplayName, range.from, range.to)
        .then(activities => {
          if (this._isMounted && requestId === this._activitiesRequestId) {
            this.setState({ activities, activitiesStatus: 'ready' });
          }
        })
        .catch(error => {
          console.error('No se pudieron cargar las actividades del usuario.', error);
          if (this._isMounted && requestId === this._activitiesRequestId) {
            this.setState({
              activitiesStatus: 'error',
              activitiesError: error instanceof Error
                ? error.message
                : 'Ocurrió un error inesperado al consultar las actividades.'
            });
          }
        });
  };

  private _showActivities = (event: React.MouseEvent<HTMLElement>): void => {
      event.preventDefault();
      const today = getLimaDateOnly();
      this.setState({
        currentPage: 'activities',
        activityDate: today,
        activityView: 'day',
        activityNotice: ''
      }, () => this._loadActivities(today));
  };

  private _showHome = (event: React.MouseEvent<HTMLElement>): void => {
      event.preventDefault();
      this.setState({ currentPage: 'home' });
  };

  private _changeActivityDate = (date: string, view?: 'day' | 'month'): void => {
      if (!date || date > getLimaDateOnly()) {
        return;
      }

      const currentRange = getMonthRange(this.state.activityDate);
      const nextRange = getMonthRange(date);
      this.setState({
        activityDate: date,
        activityView: view || this.state.activityView
      }, () => {
        if (currentRange.from !== nextRange.from) {
          this._loadActivities(date);
        }
      });
  };

  private _moveActivityPeriod = (direction: number): void => {
      const current = this.state.activityDate;
      let nextDate: string;
      if (this.state.activityView === 'day') {
        nextDate = addDateDays(current, direction);
      } else {
        const [year, month, day] = current.split('-').map(Number);
        const shiftedMonth = new Date(Date.UTC(year, month - 1 + direction, 1));
        const lastDay = new Date(Date.UTC(
          shiftedMonth.getUTCFullYear(),
          shiftedMonth.getUTCMonth() + 1,
          0
        )).getUTCDate();
        nextDate = dateOnly(
          shiftedMonth.getUTCFullYear(),
          shiftedMonth.getUTCMonth() + 1,
          Math.min(day, lastDay)
        );
      }

      this._changeActivityDate(nextDate > getLimaDateOnly() ? getLimaDateOnly() : nextDate);
  };

  private _openActivityDialog = (): void => {
    const initialDate = this.state.currentPage === 'activities'
      ? this.state.activityDate
      : getLimaDateOnly();
    this.setState({
      activityDialogOpen: true,
      activityDialogMode: 'create',
      activityDate: initialDate,
      activityInitialDraft: undefined,
      editingActivityId: undefined,
      activitySaveError: '',
      activityNotice: ''
    });
  };

  private _openActivityEditor = (activity: IActivityRecord, mode: 'edit' | 'duplicate'): void => {
    this.setState({
      activityDialogOpen: true,
      activityDialogMode: mode,
      editingActivityId: mode === 'edit' ? activity.id : undefined,
      activityDate: activity.date,
      activityInitialDraft: {
        date: activity.date,
        responsibleUser: activity.responsibleUser,
        activity: activity.activity,
        process: activity.process,
        project: activity.project,
        module: activity.module,
        hu: activity.hu,
        hours: activity.hours
      },
      activitySaveError: '',
      activityNotice: ''
    });
  };

  private _closeActivityDialog = (): void => {
    this.setState({
      activityDialogOpen: false,
      activityInitialDraft: undefined,
      editingActivityId: undefined,
      activitySaveError: ''
    });
  };

  private _handleActivitySave = (activity: IActivityDraft): void => {
    if (this._activitySaveInProgress) {
      return;
    }

    this._activitySaveInProgress = true;
    this.setState({ activitySaving: true, activitySaveError: '' });
    const save = this.state.activityDialogMode === 'edit' && this.state.editingActivityId
      ? this.props.activityService.updateActivity(this.state.editingActivityId, activity)
      : this.props.activityService.createActivity(activity);
    save
      .then(
        () => {
          this._activitySaveInProgress = false;
          if (this._isMounted) {
            const formattedDate = formatActivityDate(activity.date);
            this.setState({
              activityDialogOpen: false,
              activityInitialDraft: undefined,
              editingActivityId: undefined,
              activityDate: activity.date,
              activityNotice: `La actividad del ${formattedDate} se guardó correctamente.`,
              activitySaveError: '',
              activitySaving: false
            }, () => this._loadActivities(activity.date));
            this._loadDailyHours();
          }
        },
        error => {
          this._activitySaveInProgress = false;
          console.error('No se pudo guardar la actividad en SharePoint.', error);
          if (this._isMounted) {
            this.setState({
              activitySaveError: error instanceof Error
                ? `No se pudo guardar la actividad. ${error.message}`
                : 'No se pudo guardar la actividad. Ocurrió un error inesperado.',
              activitySaving: false
            });
          }
        }
      );
  };

  private _requestActivityDeletion = (activity: IActivityRecord): void => {
    this.setState({ deleteActivity: activity, deleteActivityError: '' });
  };

  private _dismissActivityDeletion = (): void => {
    if (!this.state.deletingActivity) {
      this.setState({ deleteActivity: undefined, deleteActivityError: '' });
    }
  };

  private _deleteActivity = (): void => {
    const activity = this.state.deleteActivity;
    if (!activity || this.state.deletingActivity) {
      return;
    }

    this.setState({ deletingActivity: true, deleteActivityError: '' });
    this.props.activityService.deleteActivity(activity.id, this.props.userDisplayName)
      .then(() => {
        if (this._isMounted) {
          this.setState({
            deleteActivity: undefined,
            deletingActivity: false,
            activityNotice: 'La actividad se eliminó correctamente.'
          }, () => this._loadActivities(this.state.activityDate));
          this._loadDailyHours();
        }
      })
      .catch(error => {
        console.error('No se pudo eliminar la actividad de SharePoint.', error);
        if (this._isMounted) {
          this.setState({
            deletingActivity: false,
            deleteActivityError: error instanceof Error
              ? `No se pudo eliminar la actividad. ${error.message}`
              : 'No se pudo eliminar la actividad. Ocurrió un error inesperado.'
          });
        }
      });
  };

  private _renderActivitiesPage = (): React.ReactElement => {
    const selectedDayActivities = this.state.activities.filter(activity => activity.date === this.state.activityDate);
    const selectedDayHours = selectedDayActivities.reduce((total, activity) => total + activity.hours, 0);
    const today = getLimaDateOnly();
    const isSelectedDayWorkday = isWorkDay(this.state.activityDate);
    const progress = Math.min(selectedDayHours / DAILY_HOURS_TARGET, 1);
    const monthActivities = this.state.activities;
    const monthHours = monthActivities.reduce((total, activity) => total + activity.hours, 0);
    const hoursByDate = new Map<string, number>();
    monthActivities.forEach(activity => {
      hoursByDate.set(activity.date, (hoursByDate.get(activity.date) || 0) + activity.hours);
    });
    const expectedDays = getCalendarDays(this.state.activityDate)
      .filter((date): date is string => !!date && date <= today && isWorkDay(date));
    const completedDays = expectedDays.filter(date =>
      (hoursByDate.get(date) || 0) >= DAILY_HOURS_TARGET
    ).length;
    const overdueDays = expectedDays.filter(date =>
      date < today && (hoursByDate.get(date) || 0) < DAILY_HOURS_TARGET
    ).length;
    const calendarDays = getCalendarDays(this.state.activityDate);
    const selectedDayStatus = getActivityDayStatus(selectedDayHours, isSelectedDayWorkday);
    const [year, month] = this.state.activityDate.split('-').map(Number);
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
            onClick={this._openActivityDialog}
          />
        </header>

        {this.state.activityNotice && (
          <MessageBar
            messageBarType={MessageBarType.success}
            dismissButtonAriaLabel="Cerrar aviso"
            onDismiss={() => this.setState({ activityNotice: '' })}
          >
            {this.state.activityNotice}
          </MessageBar>
        )}

        <div className={styles.activityToolbar}>
          <div className={styles.activityDateControls}>
            <IconButton
              iconProps={{ iconName: 'ChevronLeft' }}
              ariaLabel={this.state.activityView === 'day' ? 'Día anterior' : 'Mes anterior'}
              onClick={() => this._moveActivityPeriod(-1)}
            />
            <label className={styles.activityDateField}>
              <span className={styles.visuallyHidden}>Fecha de actividades</span>
              <input
                type="date"
                value={this.state.activityDate}
                max={today}
                onChange={event => this._changeActivityDate(event.currentTarget.value)}
              />
            </label>
            <IconButton
              iconProps={{ iconName: 'ChevronRight' }}
              ariaLabel={this.state.activityView === 'day' ? 'Día siguiente' : 'Mes siguiente'}
              disabled={this.state.activityDate >= today}
              onClick={() => this._moveActivityPeriod(1)}
            />
            <DefaultButton
              text="Hoy"
              onClick={() => this._changeActivityDate(today)}
              disabled={this.state.activityDate === today}
            />
          </div>
          <div className={styles.activityViewSwitch} role="group" aria-label="Tipo de vista">
            <DefaultButton
              text="Día"
              aria-pressed={this.state.activityView === 'day'}
              className={`${styles.viewButton} ${this.state.activityView === 'day' ? styles.selectedViewButton : ''}`}
              onClick={() => this.setState({ activityView: 'day' })}
            />
            <DefaultButton
              text="Mes"
              aria-pressed={this.state.activityView === 'month'}
              className={`${styles.viewButton} ${this.state.activityView === 'month' ? styles.selectedViewButton : ''}`}
              onClick={() => this.setState({ activityView: 'month' })}
            />
          </div>
        </div>

        {this.state.activitiesStatus === 'loading' && (
          <LoadingState label="Cargando tus actividades..." />
        )}
        {this.state.activitiesStatus === 'error' && (
          <MessageBar messageBarType={MessageBarType.error} isMultiline>
            No se pudieron cargar tus actividades. {this.state.activitiesError}
            <DefaultButton
              text="Reintentar"
              onClick={() => this._loadActivities(this.state.activityDate)}
            />
          </MessageBar>
        )}

        {this.state.activitiesStatus === 'ready' && this.state.activityView === 'day' && (
          <>
            <section className={styles.workdaySummary} aria-label="Progreso de la jornada">
              <div className={styles.workdaySummaryHeading}>
                <div>
                  <h2>{formatLongDate(this.state.activityDate)}</h2>
                  <StatusBadge variant={selectedDayStatus.badgeVariant}>
                    {selectedDayStatus.label}
                  </StatusBadge>
                </div>
                <strong>{formatHours(selectedDayHours)} <span>de {DAILY_HOURS_TARGET} h</span></strong>
              </div>
              <ProgressIndicator
                percentComplete={progress}
                ariaLabel={`Jornada: ${formatHours(selectedDayHours)} de ${DAILY_HOURS_TARGET} horas`}
              />
              <p className={styles.supportingText}>
                {!isSelectedDayWorkday
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
                    onClick={this._openActivityDialog}
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
                          onClick={() => this._openActivityEditor(activity, 'edit')}
                        />
                        <IconButton
                          iconProps={{ iconName: 'Copy' }}
                          ariaLabel={`Duplicar ${activity.activity}`}
                          title="Duplicar"
                          onClick={() => this._openActivityEditor(activity, 'duplicate')}
                        />
                        <IconButton
                          iconProps={{ iconName: 'Delete' }}
                          ariaLabel={`Eliminar ${activity.activity}`}
                          title="Eliminar"
                          onClick={() => this._requestActivityDeletion(activity)}
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

        {this.state.activitiesStatus === 'ready' && this.state.activityView === 'month' && (
          <>
            <section className={styles.monthSummary} aria-label={`Resumen de ${formatMonth(this.state.activityDate)}`}>
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
              <h2 id="monthCalendarHeading">{formatMonth(this.state.activityDate)}</h2>
              <div className={styles.activityCalendar} role="group" aria-label={`Calendario de ${formatMonth(this.state.activityDate)}`}>
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
                  const dayStatus = getActivityDayStatus(hours, isWorkDay(date));
                  const label = isFuture
                    ? `${formatLongDate(date)}, fecha futura`
                    : `${formatLongDate(date)}, ${dayStatus.ariaLabel}, ${formatHours(hours)} horas`;
                  return (
                    <button
                      className={`${styles.calendarDay} ${CALENDAR_STATUS_CLASSES[dayStatus.key]} ${isToday ? styles.calendarToday : ''} ${date === this.state.activityDate ? styles.calendarSelected : ''}`}
                      key={date}
                      type="button"
                      aria-label={label}
                      aria-current={isToday ? 'date' : undefined}
                      disabled={isFuture}
                      onClick={() => this._changeActivityDate(date, 'day')}
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
  };

  public render(): React.ReactElement<ITppSinchiProps> {
    const resourceGroups = groupResources(this.state.resources);
    const displayName = this.props.userDisplayName.trim();
    const currentDate = new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date());
    const formattedDate = currentDate.charAt(0).toLocaleUpperCase('es-PE') + currentDate.slice(1);
    const dailyHoursProgress = Math.min(this.state.dailyHours / DAILY_HOURS_TARGET, 1);
    const remainingHours = Math.max(DAILY_HOURS_TARGET - this.state.dailyHours, 0);
    const extraHours = Math.max(this.state.dailyHours - DAILY_HOURS_TARGET, 0);

    return (
      <ThemeProvider theme={sinchiTheme}>
        <AddActivityDialog
          isOpen={this.state.activityDialogOpen}
          mode={this.state.activityDialogMode}
          initialActivity={this.state.activityInitialDraft}
          initialDate={this.state.activityDate}
          userDisplayName={displayName}
          processOptions={this.state.activityProcessOptions}
          projectOptions={this.state.activityProjectOptions}
          catalogsStatus={this.state.activityCatalogsStatus}
          catalogsError={this.state.activityCatalogsError}
          isSaving={this.state.activitySaving}
          saveError={this.state.activitySaveError}
          onDismiss={this._closeActivityDialog}
          onRetryCatalogs={this._loadActivityCatalogs}
          onSave={this._handleActivitySave}
        />
        <Dialog
          hidden={!this.state.deleteActivity}
          onDismiss={this._dismissActivityDeletion}
          dialogContentProps={{
            type: DialogType.normal,
            title: 'Eliminar actividad',
            subText: this.state.deleteActivity
              ? `Se eliminará “${this.state.deleteActivity.activity}” (${formatHours(this.state.deleteActivity.hours)} h) del ${formatActivityDate(this.state.deleteActivity.date)}.`
              : ''
          }}
          modalProps={{ isBlocking: this.state.deletingActivity }}
        >
          {this.state.deleteActivityError && (
            <MessageBar messageBarType={MessageBarType.error}>
              {this.state.deleteActivityError}
            </MessageBar>
          )}
          <DialogFooter>
            <DefaultButton
              text="Cancelar"
              onClick={this._dismissActivityDeletion}
              disabled={this.state.deletingActivity}
            />
            <PrimaryButton
              text={this.state.deletingActivity ? 'Eliminando...' : 'Eliminar'}
              onClick={this._deleteActivity}
              disabled={this.state.deletingActivity}
            />
          </DialogFooter>
        </Dialog>
        <section className={styles.dashboard} aria-label="Portal de Sinchi">
          <nav className={styles.navigation} aria-label="Navegación del portal">
            <Link
              className={`${styles.navigationLink} ${this.state.currentPage === 'home' ? styles.activeNavigationLink : ''}`}
              href="#"
              aria-current={this.state.currentPage === 'home' ? 'page' : undefined}
              onClick={this._showHome}
            >
              Inicio
            </Link>
            <Link
              className={`${styles.navigationLink} ${this.state.currentPage === 'activities' ? styles.activeNavigationLink : ''}`}
              href="#"
              aria-current={this.state.currentPage === 'activities' ? 'page' : undefined}
              onClick={this._showActivities}
            >
              Actividades
            </Link>
            <Link className={styles.navigationLink} href="#" onClick={preventNavigation}>Solicitudes</Link>
            <Link className={styles.navigationLink} href="#" onClick={preventNavigation}>Calendario</Link>
          </nav>

          <main className={styles.content}>
            {this.state.currentPage === 'activities' ? this._renderActivitiesPage() : (
              <>
            <header className={styles.welcome}>
              <h1>{displayName ? `Hola, ${displayName}` : 'Hola'}</h1>
              <p>{formattedDate}</p>
            </header>

            {this.state.activityNotice && (
              <MessageBar
                messageBarType={MessageBarType.success}
                dismissButtonAriaLabel="Cerrar aviso"
                onDismiss={() => this.setState({ activityNotice: '' })}
              >
                {this.state.activityNotice}
              </MessageBar>
            )}

            <section className={styles.summaryGrid} aria-label="Resumen personal">
              <article className={`${styles.card} ${styles.summaryCard} ${styles.workdayCard}`}>
                <div className={styles.summaryHeading}>
                  <IconBadge iconName="Clock" variant="primary" />
                  <span className={styles.summaryLabel}>Mi jornada de hoy</span>
                </div>
                {this.state.dailyHoursStatus === 'loading' && (
                  <Spinner label="Cargando las horas registradas de hoy" />
                )}
                {this.state.dailyHoursStatus === 'error' && (
                  <MessageBar messageBarType={MessageBarType.error} isMultiline>
                    No se pudo consultar tu jornada. {this.state.dailyHoursError}
                    <DefaultButton
                      text="Reintentar"
                      onClick={this._loadDailyHours}
                    />
                  </MessageBar>
                )}
                {this.state.dailyHoursStatus === 'ready' && (
                  <>
                    <p className={styles.primaryValue}>
                      {formatHours(this.state.dailyHours)} de {DAILY_HOURS_TARGET} h
                    </p>
                    <ProgressIndicator
                      className={styles.progress}
                      percentComplete={dailyHoursProgress}
                      ariaLabel={`Jornada completada: ${formatHours(this.state.dailyHours)} de ${DAILY_HOURS_TARGET} horas`}
                    />
                    <p className={styles.supportingText}>
                      {this.state.dailyHours === 0
                        ? 'Aún no registras horas para hoy'
                        : remainingHours > 0
                          ? `Te faltan ${formatHours(remainingHours)} h para completar tu jornada`
                          : extraHours > 0
                            ? `Registraste ${formatHours(extraHours)} h por encima de tu jornada`
                            : 'Completaste tu jornada de hoy'}
                    </p>
                  </>
                )}
                <PrimaryButton
                  className={styles.addButton}
                  iconProps={{ iconName: 'Add' }}
                  text="Agregar"
                  onClick={this._openActivityDialog}
                />
              </article>

              <div className={styles.summaryPair}>
                <div className={styles.developmentCardWrapper}>
                  <article className={`${styles.card} ${styles.summaryCard} ${styles.inDevelopment}`} aria-disabled="true">
                    <div className={styles.summaryHeading}>
                      <IconBadge iconName="Shield" variant="default" />
                      <span className={styles.summaryLabel}>Guardia de soporte</span>
                    </div>
                    <p className={styles.primaryValue}>Semana del 26 oct al 1 nov</p>
                    <StatusBadge variant="default">Turno secundario</StatusBadge>
                    <p className={styles.supportingText}>Próxima guardia: 23 nov</p>
                  </article>
                  <span className={styles.developmentBadge}>En desarrollo</span>
                </div>

                <div className={styles.developmentCardWrapper}>
                  <article className={`${styles.card} ${styles.summaryCard} ${styles.inDevelopment}`} aria-disabled="true">
                    <div className={styles.summaryHeading}>
                      <IconBadge iconName="Airplane" variant="default" />
                      <span className={styles.summaryLabel}>Mis vacaciones</span>
                    </div>
                    <p className={styles.primaryValue}>27 días disponibles</p>
                    <StatusBadge variant="warning">3 en revisión</StatusBadge>
                    <p className={styles.supportingText}>0 usados&nbsp; · &nbsp;30 asignados</p>
                  </article>
                  <span className={styles.developmentBadge}>En desarrollo</span>
                </div>
              </div>
            </section>

            <section className={styles.detailsGrid} aria-label="Eventos y recursos">
              <div className={styles.developmentCardWrapper}>
                <article className={`${styles.card} ${styles.eventsCard} ${styles.inDevelopment}`} aria-disabled="true">
                  <div className={styles.cardHeader}>
                    <h2>Próximos eventos</h2>
                    <Link
                      className={styles.viewAllLink}
                      href="#"
                      onClick={preventNavigation}
                      aria-disabled="true"
                      tabIndex={-1}
                    >
                      Ver todo <Icon iconName="ChevronRight" aria-hidden="true" />
                    </Link>
                  </div>
                  <ul className={styles.eventList}>
                    {events.map((event, index) => (
                      <li
                        className={`${styles.eventRow} ${index === events.length - 1 ? styles.lastEventRow : ''}`}
                        key={event.initials}
                      >
                        <Persona
                          className={styles.persona}
                          text={event.name}
                          hidePersonaDetails
                          size={PersonaSize.size40}
                          aria-label={event.name}
                        />
                        <div className={styles.eventDetails}>
                          <span className={styles.eventName}>{event.name}</span>
                          <span className={styles.eventPeriod}>{event.period}</span>
                        </div>
                        <StatusBadge
                          className={styles.eventBadge}
                          variant={event.type === 'Soporte' ? 'info' : 'success'}
                        >
                          {event.type}
                        </StatusBadge>
                      </li>
                    ))}
                  </ul>
                </article>
                <span className={styles.developmentBadge}>En desarrollo</span>
              </div>

              <article className={`${styles.card} ${styles.resourcesCard}`}>
                <div className={styles.cardHeader}>
                  <h2>Recursos</h2>
                </div>
                {this.state.resourcesStatus === 'loading' && (
                  <LoadingState
                    className={styles.resourceMessage}
                    label="Cargando recursos..."
                  />
                )}
                {this.state.resourcesStatus === 'error' && (
                  <MessageBar messageBarType={MessageBarType.error} isMultiline>
                    No se pudieron cargar los recursos. Verifica que la lista exista y que tengas permisos de lectura.
                    <p>{this.state.resourcesError}</p>
                    <DefaultButton
                      className={styles.resourceRetryButton}
                      text="Reintentar"
                      onClick={this._loadResources}
                    />
                  </MessageBar>
                )}
                {this.state.resourcesStatus === 'ready' && this.state.resources.length === 0 && (
                  <p className={styles.resourceMessage} role="status">
                    Aún no hay recursos disponibles.
                  </p>
                )}
                {this.state.resourcesStatus === 'ready' && this.state.resources.length > 0 && (
                  <div className={styles.resourceGroups}>
                    {resourceGroups.map(group => (
                      <div className={styles.resourceGroup} key={group.title}>
                        <h3>{group.title}</h3>
                        <ul className={styles.resourceList}>
                          {group.resources.map(resource => (
                            <li key={resource.id}>
                              <ResourceItem
                                name={resource.name}
                                url={resource.url}
                                description={resource.description}
                                iconName="Link"
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </section>
              </>
            )}
          </main>
        </section>
      </ThemeProvider>
    );
  }
}
