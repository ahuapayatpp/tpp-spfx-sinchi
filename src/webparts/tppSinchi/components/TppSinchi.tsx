import * as React from 'react';
import {
  createTheme,
  Icon,
  initializeIcons,
  Link,
  Persona,
  PersonaSize,
  PrimaryButton,
  ProgressIndicator,
  ThemeProvider
} from '@fluentui/react';
import styles from './TppSinchi.module.scss';
import type { ITppSinchiProps } from './ITppSinchiProps';
import IconBadge from './IconBadge';
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

const resourceGroups = [
  {
    title: 'FRONT',
    resources: [
      { name: 'portal-ti-web', iconName: 'TVMonitor' },
      { name: 'design-system-aurum', iconName: 'Code' },
      { name: 'Figma', iconName: 'Design' },
      { name: 'Storybook', iconName: 'ReadingMode' }
    ]
  },
  {
    title: 'BACK',
    resources: [
      { name: 'portal-ti-api', iconName: 'TVMonitor' },
      { name: 'infra-terraform', iconName: 'Settings' },
      { name: 'Postman', iconName: 'CompassNW' },
      { name: 'iTop', iconName: 'Server' }
    ]
  }
];

const preventNavigation = (event: React.MouseEvent<HTMLElement>): void => {
  event.preventDefault();
};

export default class TppSinchi extends React.Component<ITppSinchiProps> {
  public render(): React.ReactElement<ITppSinchiProps> {
    const displayName = this.props.userDisplayName.trim();
    const currentDate = new Intl.DateTimeFormat('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date());
    const formattedDate = currentDate.charAt(0).toLocaleUpperCase('es-PE') + currentDate.slice(1);

    return (
      <ThemeProvider theme={sinchiTheme}>
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

            <section className={styles.summaryGrid} aria-label="Resumen personal">
              <article className={`${styles.card} ${styles.summaryCard} ${styles.workdayCard}`}>
                <div className={styles.summaryHeading}>
                  <IconBadge iconName="Clock" variant="primary" />
                  <span className={styles.summaryLabel}>Mi jornada de hoy</span>
                </div>
                <p className={styles.primaryValue}>5 de 8 h</p>
                <ProgressIndicator
                  className={styles.progress}
                  percentComplete={0.625}
                  ariaLabel="Jornada completada: 5 de 8 horas"
                />
                <p className={styles.supportingText}>Te faltan 3 h para completar tu jornada</p>
                <PrimaryButton
                  className={styles.addButton}
                  iconProps={{ iconName: 'Add' }}
                  text="Agregar"
                />
              </article>

              <div className={styles.summaryPair}>
                <article className={`${styles.card} ${styles.summaryCard}`}>
                  <div className={styles.summaryHeading}>
                    <IconBadge iconName="Shield" variant="default" />
                    <span className={styles.summaryLabel}>Guardia de soporte</span>
                  </div>
                  <p className={styles.primaryValue}>Semana del 26 oct al 1 nov</p>
                  <StatusBadge variant="default">Turno secundario</StatusBadge>
                  <p className={styles.supportingText}>Próxima guardia: 23 nov</p>
                </article>

                <article className={`${styles.card} ${styles.summaryCard}`}>
                  <div className={styles.summaryHeading}>
                    <IconBadge iconName="Airplane" variant="default" />
                    <span className={styles.summaryLabel}>Mis vacaciones</span>
                  </div>
                  <p className={styles.primaryValue}>27 días disponibles</p>
                  <StatusBadge variant="warning">3 en revisión</StatusBadge>
                  <p className={styles.supportingText}>0 usados&nbsp; · &nbsp;30 asignados</p>
                </article>
              </div>
            </section>

            <aside className={`${styles.card} ${styles.ticketCard}`} aria-label="Resumen de tickets">
              <div className={styles.ticketTitle}>
                <IconBadge iconName="LifeSaver" variant="default" size="compact" />
                <h2>Tickets iTop abiertos</h2>
                <strong>7</strong>
              </div>
              <div className={styles.ticketActions}>
                <span className={styles.ticketStatus}>2 vencen hoy&nbsp; · &nbsp;3 sin primera respuesta</span>
                <Link className={styles.viewAllLink} href="#" onClick={preventNavigation}>
                  Ver en iTop <Icon iconName="OpenInNewWindow" aria-hidden="true" />
                </Link>
              </div>
            </aside>

            <section className={styles.detailsGrid} aria-label="Eventos y recursos">
              <article className={`${styles.card} ${styles.eventsCard}`}>
                <div className={styles.cardHeader}>
                  <h2>Próximos eventos</h2>
                  <Link className={styles.viewAllLink} href="#" onClick={preventNavigation}>
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

              <article className={`${styles.card} ${styles.resourcesCard}`}>
                <div className={styles.cardHeader}>
                  <h2>Recursos</h2>
                </div>
                <div className={styles.resourceGroups}>
                  {resourceGroups.map(group => (
                    <div className={styles.resourceGroup} key={group.title}>
                      <h3>{group.title}</h3>
                      <ul className={styles.resourceList}>
                        {group.resources.map(resource => (
                          <li key={resource.name}>
                            <ResourceItem name={resource.name} iconName={resource.iconName} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </article>
            </section>

          </main>
        </section>
      </ThemeProvider>
    );
  }
}
