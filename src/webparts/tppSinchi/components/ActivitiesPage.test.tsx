import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { act, Simulate } from 'react-dom/test-utils';
import { getLimaDateOnly } from '../../../services/activityDate';
import ActivitiesPage, { type IActivitiesPageProps } from './ActivitiesPage';

function createProps(overrides: Partial<IActivitiesPageProps> = {}): IActivitiesPageProps {
  return {
    activityDate: '2026-10-30',
    activityView: 'day',
    activityNotice: '',
    activities: [],
    activitiesStatus: 'ready',
    activitiesError: '',
    onDismissNotice: jest.fn(),
    onOpenActivityDialog: jest.fn(),
    onMovePeriod: jest.fn(),
    onChangeDate: jest.fn(),
    onChangeView: jest.fn(),
    onRetryActivities: jest.fn(),
    onOpenEditor: jest.fn(),
    onRequestDeletion: jest.fn(),
    ...overrides
  };
}

describe('ActivitiesPage', () => {
  it('opens the activity form from the empty-day action', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const props = createProps();

    try {
      act(() => {
        ReactDOM.render(<ActivitiesPage {...props} />, container);
      });

      const registerButton = Array.from(container.querySelectorAll('button'))
        .find(button => button.textContent?.includes('Registrar actividad'));
      expect(registerButton).toBeDefined();

      act(() => {
        registerButton?.click();
      });

      expect(props.onOpenActivityDialog).toHaveBeenCalledTimes(1);
    } finally {
      act(() => {
        ReactDOM.unmountComponentAtNode(container);
      });
      container.remove();
    }
  });

  it('switches to the month view through the view control', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const props = createProps();

    try {
      act(() => {
        ReactDOM.render(<ActivitiesPage {...props} />, container);
      });

      const monthButton = Array.from(container.querySelectorAll('button'))
        .find(button => button.textContent?.trim() === 'Mes');
      expect(monthButton).toBeDefined();

      act(() => {
        monthButton?.click();
      });

      expect(props.onChangeView).toHaveBeenCalledWith('month');
    } finally {
      act(() => {
        ReactDOM.unmountComponentAtNode(container);
      });
      container.remove();
    }
  });

  it('shows month and year selectors instead of the daily date field in month view', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    try {
      act(() => {
        ReactDOM.render(<ActivitiesPage {...createProps({ activityView: 'month' })} />, container);
      });

      expect(container.querySelector('input[type="date"]')).toBeNull();
      expect(container.querySelector('select[aria-label="Mes"]')).not.toBeNull();
      expect(container.querySelector('select[aria-label="Año"]')).not.toBeNull();
    } finally {
      act(() => {
        ReactDOM.unmountComponentAtNode(container);
      });
      container.remove();
    }
  });

  it('clamps the selected day to the last day of the chosen month', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const year = Number(getLimaDateOnly().slice(0, 4)) - 1;
    const props = createProps({ activityDate: `${year}-03-31`, activityView: 'month' });

    try {
      act(() => {
        ReactDOM.render(<ActivitiesPage {...props} />, container);
      });

      const monthSelect = container.querySelector<HTMLSelectElement>('select[aria-label="Mes"]');
      expect(monthSelect).not.toBeNull();
      if (!monthSelect) {
        throw new Error('Month selector was not rendered.');
      }

      act(() => {
        monthSelect.value = '2';
        Simulate.change(monthSelect);
      });

      const lastDayOfFebruary = new Date(Date.UTC(year, 2, 0)).getUTCDate();
      const expectedDay = lastDayOfFebruary < 10
        ? `0${lastDayOfFebruary}`
        : `${lastDayOfFebruary}`;
      expect(props.onChangeDate).toHaveBeenCalledWith(
        `${year}-02-${expectedDay}`
      );
    } finally {
      act(() => {
        ReactDOM.unmountComponentAtNode(container);
      });
      container.remove();
    }
  });

  it('caps a month selection at today when the preserved day would be in the future', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const today = getLimaDateOnly();
    const year = Number(today.slice(0, 4));
    const props = createProps({
      activityDate: `${year - 1}-12-31`,
      activityView: 'month'
    });

    try {
      act(() => {
        ReactDOM.render(<ActivitiesPage {...props} />, container);
      });

      const yearSelect = container.querySelector<HTMLSelectElement>('select[aria-label="Año"]');
      expect(yearSelect).not.toBeNull();
      if (!yearSelect) {
        throw new Error('Year selector was not rendered.');
      }

      act(() => {
        yearSelect.value = year.toString();
        Simulate.change(yearSelect);
      });

      expect(props.onChangeDate).toHaveBeenCalledWith(today);
    } finally {
      act(() => {
        ReactDOM.unmountComponentAtNode(container);
      });
      container.remove();
    }
  });
});
