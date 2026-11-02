/* eslint-disable @rushstack/pair-react-dom-render-unmount */
jest.mock('./AddActivityDialog', () => {
  const React = jest.requireActual('react') as typeof import('react');

  return {
    __esModule: true,
    default: (props: {
      isOpen: boolean;
      onSave: (activity: {
        date: string;
        responsibleUser: string;
        activity: string;
        process: string;
        project: string;
        hu: string;
        hours: number;
      }) => void;
    }) => (
      props.isOpen
        ? React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => props.onSave({
              date: '2025-01-15',
              responsibleUser: 'Alex User',
              activity: 'Actividad de prueba',
              process: 'Proyecto',
              project: 'Portal TI',
              hu: 'S/HU',
              hours: 1
            })
          },
          'Guardar actividad de prueba'
        )
        : null
    )
  };
});

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import type { IResourcesService, IResource } from '../../../services/resourcesService';
import type { IActivityRecord, IActivityService } from '../../../services/activityService';
import type { ITppSinchiProps } from './ITppSinchiProps';
import TppSinchi from './TppSinchi';

function createActivityService(): IActivityService {
  return {
    getCatalogs: () => Promise.resolve({ processes: [], projects: [] }),
    getActivities: () => Promise.resolve([]),
    getDailyHours: () => Promise.resolve(0),
    createActivity: () => Promise.resolve(),
    updateActivity: () => Promise.resolve(),
    deleteActivity: () => Promise.resolve()
  };
}

function createResource(name: string): IResource {
  return {
    id: 1,
    name,
    url: 'https://contoso.sharepoint.com',
    category: 'General'
  };
}

describe('TppSinchi resource loading', () => {
  it('ignores a resource response from a service that has been replaced', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    let resolveOldRequest: (resources: IResource[]) => void = () => undefined;
    const oldResourcesService: IResourcesService = {
      getResources: () => new Promise(resolve => {
        resolveOldRequest = resolve;
      })
    };
    const currentResourcesService: IResourcesService = {
      getResources: () => Promise.resolve([createResource('Recurso vigente')])
    };
    const baseProps: ITppSinchiProps = {
      description: '',
      isDarkTheme: false,
      environmentMessage: '',
      userDisplayName: 'Alex User',
      resourcesService: oldResourcesService,
      activityService: createActivityService()
    };

    try {
      await act(async () => {
        ReactDOM.render(<TppSinchi {...baseProps} />, container);
      });
      await act(async () => {
        ReactDOM.render(
          <TppSinchi {...baseProps} resourcesService={currentResourcesService} />,
          container
        );
      });
      await act(async () => {
        resolveOldRequest([createResource('Respuesta obsoleta')]);
        await Promise.resolve();
      });

      expect(container.textContent).toContain('Recurso vigente');
      expect(container.textContent).not.toContain('Respuesta obsoleta');
    } finally {
      act(() => {
        ReactDOM.unmountComponentAtNode(container);
      });
      container.remove();
    }
  });
});

describe('TppSinchi navigation', () => {
  it('hides unavailable menu options', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const props: ITppSinchiProps = {
      description: '',
      isDarkTheme: false,
      environmentMessage: '',
      userDisplayName: 'Alex User',
      resourcesService: { getResources: () => Promise.resolve([]) },
      activityService: createActivityService()
    };

    try {
      await act(async () => {
        ReactDOM.render(<TppSinchi {...props} />, container);
        await Promise.resolve();
      });

      const navigation = container.querySelector('nav[aria-label="Navegación del portal"]');
      expect(navigation?.textContent).toContain('Inicio');
      expect(navigation?.textContent).toContain('Actividades');
      expect(navigation?.textContent).not.toContain('Solicitudes');
      expect(navigation?.textContent).not.toContain('Calendario');
    } finally {
      act(() => {
        ReactDOM.unmountComponentAtNode(container);
      });
      container.remove();
    }
  });

  it('opens the saved activity date after registering from home', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const savedActivity: IActivityRecord = {
      id: 42,
      date: '2025-01-15',
      responsibleUser: 'Alex User',
      activity: 'Actividad de prueba',
      process: 'Proyecto',
      project: 'Portal TI',
      hu: 'S/HU',
      hours: 1
    };
    const activityService = createActivityService();
    activityService.getCatalogs = () => Promise.resolve({ processes: [], projects: [] });
    activityService.getActivities = jest.fn(() => Promise.resolve([savedActivity]));
    activityService.createActivity = jest.fn(() => Promise.resolve());
    const props: ITppSinchiProps = {
      description: '',
      isDarkTheme: false,
      environmentMessage: '',
      userDisplayName: 'Alex User',
      resourcesService: { getResources: () => Promise.resolve([]) },
      activityService
    };

    try {
      await act(async () => {
        ReactDOM.render(<TppSinchi {...props} />, container);
        await Promise.resolve();
      });

      const addButton = Array.from(container.querySelectorAll('button'))
        .find(button => button.textContent?.includes('Agregar'));
      expect(addButton).toBeDefined();
      act(() => {
        addButton?.click();
      });

      const saveButton = Array.from(container.querySelectorAll('button'))
        .find(button => button.textContent?.trim() === 'Guardar actividad de prueba');
      expect(saveButton).toBeDefined();
      await act(async () => {
        saveButton?.click();
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(activityService.createActivity).toHaveBeenCalledWith({
        date: savedActivity.date,
        responsibleUser: savedActivity.responsibleUser,
        activity: savedActivity.activity,
        process: savedActivity.process,
        project: savedActivity.project,
        hu: savedActivity.hu,
        hours: savedActivity.hours
      });
      expect(activityService.getActivities).toHaveBeenCalledWith(
        'Alex User',
        '2025-01-01',
        '2025-01-31'
      );
      expect(container.querySelector('#activitiesTitle')?.textContent).toBe('Mis actividades');
      expect(container.querySelector<HTMLInputElement>('input[type="date"]')?.value).toBe('2025-01-15');
      expect(container.textContent).toContain('Actividad de prueba');
    } finally {
      act(() => {
        ReactDOM.unmountComponentAtNode(container);
      });
      container.remove();
    }
  });
});
