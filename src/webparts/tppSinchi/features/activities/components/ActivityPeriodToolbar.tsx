import * as React from 'react';
import { DefaultButton, IconButton } from '@fluentui/react';
import { getLimaDateOnly } from '../../../../../services/activities/activityDate';
import { getDateInMonth } from '../utils/activityDateRange';
import styles from '../../../styles/TppSinchi.module.scss';

export type ActivityView = 'day' | 'month';

export interface IActivityPeriodToolbarProps {
  date: string;
  view: ActivityView;
  onMovePeriod: (direction: number) => void;
  onChangeDate: (date: string, view?: ActivityView) => void;
  onChangeView: (view: ActivityView) => void;
}

const monthFormatter = new Intl.DateTimeFormat('es-PE', { month: 'long', timeZone: 'UTC' });
const monthOptions = Array.from({ length: 12 }, (_, index) => {
  const name = monthFormatter.format(new Date(Date.UTC(2026, index, 1)));
  return `${name.charAt(0).toLocaleUpperCase('es-PE')}${name.slice(1)}`;
});

export default function ActivityPeriodToolbar(props: IActivityPeriodToolbarProps): React.ReactElement {
  const today = getLimaDateOnly();
  const [year, month] = props.date.split('-').map(Number);
  const currentYear = Number(today.slice(0, 4));
  const firstYear = Math.min(currentYear - 2, year);
  const yearOptions = Array.from({ length: currentYear - firstYear + 1 }, (_, index) => currentYear - index);

  return (
    <div className={styles.activityToolbar}>
      <div className={styles.activityDateControls}>
        <IconButton
          iconProps={{ iconName: 'ChevronLeft' }}
          ariaLabel={props.view === 'day' ? 'Día anterior' : 'Mes anterior'}
          onClick={() => props.onMovePeriod(-1)}
        />
        {props.view === 'day' ? (
          <label className={styles.activityDateField}>
            <span className={styles.visuallyHidden}>Fecha de actividades</span>
            <input
              type="date"
              value={props.date}
              max={today}
              onChange={event => props.onChangeDate(event.currentTarget.value)}
            />
          </label>
        ) : (
          <div className={styles.activityDateField}>
            <label>
              <span className={styles.visuallyHidden}>Mes de actividades</span>
              <select
                aria-label="Mes"
                value={month}
                onChange={event => props.onChangeDate(
                  getDateInMonth(props.date, year, Number(event.currentTarget.value))
                )}
              >
                {monthOptions.map((name, index) => (
                  <option key={name} value={index + 1}>{name}</option>
                ))}
              </select>
            </label>
            <label>
              <span className={styles.visuallyHidden}>Año de actividades</span>
              <select
                aria-label="Año"
                value={year}
                onChange={event => props.onChangeDate(
                  getDateInMonth(props.date, Number(event.currentTarget.value), month)
                )}
              >
                {yearOptions.map(optionYear => (
                  <option key={optionYear} value={optionYear}>{optionYear}</option>
                ))}
              </select>
            </label>
          </div>
        )}
        <IconButton
          iconProps={{ iconName: 'ChevronRight' }}
          ariaLabel={props.view === 'day' ? 'Día siguiente' : 'Mes siguiente'}
          disabled={props.date >= today}
          onClick={() => props.onMovePeriod(1)}
        />
        <DefaultButton
          text="Hoy"
          onClick={() => props.onChangeDate(today)}
          disabled={props.date === today}
        />
      </div>
      <div className={styles.activityViewSwitch} role="group" aria-label="Tipo de vista">
        <DefaultButton
          text="Día"
          aria-pressed={props.view === 'day'}
          className={`${styles.viewButton} ${props.view === 'day' ? styles.selectedViewButton : ''}`}
          onClick={() => props.onChangeView('day')}
        />
        <DefaultButton
          text="Mes"
          aria-pressed={props.view === 'month'}
          className={`${styles.viewButton} ${props.view === 'month' ? styles.selectedViewButton : ''}`}
          onClick={() => props.onChangeView('month')}
        />
      </div>
    </div>
  );
}
