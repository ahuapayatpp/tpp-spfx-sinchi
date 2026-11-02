import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
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
});
