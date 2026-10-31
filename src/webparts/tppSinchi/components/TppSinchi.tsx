import * as React from 'react';
import {
  createTheme,
  DefaultButton,
  Icon,
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
import type { IActivityCatalogs, IActivityDraft, IActivityOption } from '../../../services/activityService';
import AddActivityDialog from './AddActivityDialog';
import IconBadge from './IconBadge';
import LoadingState from './LoadingState';
import ResourceItem from './ResourceItem';
import StatusBadge from './StatusBadge';
import sinchiColors from '../styles/SinchiColors.module.scss';

initializeIcons();

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

const DAILY_HOURS_TARGET: number = 8;

interface IResourceGroup {
  title: string;
  resources: IResource[];
}

interface ITppSinchiState {
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
      activitySaveError: ''
    };
  }

  private _isMounted: boolean = false;
  private _activityCatalogRequestId: number = 0;
  private _dailyHoursRequestId: number = 0;
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
    } else if (previousProps.userDisplayName !== this.props.userDisplayName) {
      this._loadDailyHours();
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

  private _openActivityDialog = (): void => {
    this.setState({ activityDialogOpen: true, activityNotice: '' });
  };

  private _closeActivityDialog = (): void => {
    this.setState({ activityDialogOpen: false });
  };

  private _handleActivitySave = (activity: IActivityDraft): void => {
    if (this._activitySaveInProgress) {
      return;
    }

    this._activitySaveInProgress = true;
    this.setState({ activitySaving: true, activitySaveError: '' });
    this.props.activityService.createActivity(activity)
      .then(
        () => {
          this._activitySaveInProgress = false;
          if (this._isMounted) {
            const formattedDate = formatActivityDate(activity.date);
            this.setState({
              activityDialogOpen: false,
              activityNotice: `La actividad del ${formattedDate} se guardó correctamente.`,
              activitySaveError: '',
              activitySaving: false
            });
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
        <section className={styles.dashboard} aria-label="Inicio de Sinchi">
          <nav className={styles.navigation} aria-label="Navegación del portal">
            <Link className={`${styles.navigationLink} ${styles.activeNavigationLink}`} href="#" aria-current="page" onClick={preventNavigation}>Inicio</Link>
            <Link className={styles.navigationLink} href="#" onClick={preventNavigation}>Actividades</Link>
            <Link className={styles.navigationLink} href="#" onClick={preventNavigation}>Solicitudes</Link>
            <Link className={styles.navigationLink} href="#" onClick={preventNavigation}>Calendario</Link>
          </nav>

          <main className={styles.content}>
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

          </main>
        </section>
      </ThemeProvider>
    );
  }
}
