/* eslint-disable @rushstack/pair-react-dom-render-unmount */
jest.mock('../features/activities/components/AddActivityDialog', () => {
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
import type { IResourcesService, IResource } from '../../../services/resources/resourcesService';
import type { IActivityRecord } from '../../../services/activities/activityTypes';
import type { IActivityService } from '../../../services/activities/activityService';
import type { IAccessService } from '../../../services/access/accessTypes';
import type { ITeamActivityRecord } from '../../../services/activities/activityTypes';
import type { ITeamMember } from '../../../services/collaborators/collaboratorTypes';
import { getLimaDateOnly } from '../../../services/activities/activityDate';
import type { ITppSinchiProps } from './ITppSinchiProps';
import App from './App';

function createActivityService(): IActivityService {
  return {
    getCatalogs: () => Promise.resolve({ processes: [], projects: [] }),
    getActivities: jest.fn(() => Promise.resolve([])),
    getTeamActivities: () => Promise.resolve([] as ITeamActivityRecord[]),
    getDailyHours: () => Promise.resolve(0),
    createActivity: () => Promise.resolve(),
    updateActivity: () => Promise.resolve(),
    deleteActivity: () => Promise.resolve()
  };
}

function createCollaboratorService(members: ITeamMember[] = []): ITppSinchiProps['collaboratorService'] {
  return { getTeamMembers: () => Promise.resolve(members) };
}

function createAccessService(isAdmin: boolean = false): IAccessService {
  return {
    getUserAccess: () => Promise.resolve({
      userId: 7,
      displayName: 'Alex User',
      loginName: 'i:0#.f|membership|alex.user@tpperuanos.pe',
      isAdmin,
      role: isAdmin ? 'admin' : 'user'
    })
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
      activityService: createActivityService(),
      accessService: createAccessService(),
      collaboratorService: createCollaboratorService()
    };

    try {
      await act(async () => {
        ReactDOM.render(<App {...baseProps} />, container);
      });
      await act(async () => {
        ReactDOM.render(
          <App {...baseProps} resourcesService={currentResourcesService} />,
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
      activityService: createActivityService(),
      accessService: createAccessService(),
      collaboratorService: createCollaboratorService()
    };

    try {
      await act(async () => {
        ReactDOM.render(<App {...props} />, container);
        await Promise.resolve();
      });

      const navigation = container.querySelector('nav[aria-label="Navegación del portal"]');
      expect(navigation?.textContent).toContain('Inicio');
      expect(navigation?.textContent).toContain('Mis actividades');
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
      activityService,
      accessService: createAccessService(),
      collaboratorService: createCollaboratorService()
    };

    try {
      await act(async () => {
        ReactDOM.render(<App {...props} />, container);
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
        date: '2025-01-15',
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

describe('TppSinchi role access', () => {
  async function renderApp(props: ITppSinchiProps, container: HTMLElement): Promise<void> {
    await act(async () => {
      ReactDOM.render(<App {...props} />, container);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  it('shows the administration menu and page to administrators', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const props: ITppSinchiProps = {
      description: '',
      isDarkTheme: false,
      environmentMessage: '',
      userDisplayName: 'Alex User',
      resourcesService: { getResources: () => Promise.resolve([]) },
      activityService: createActivityService(),
      accessService: createAccessService(true),
      collaboratorService: createCollaboratorService()
    };

    try {
      await renderApp(props, container);

      const navigation = container.querySelector('nav[aria-label="Navegación del portal"]');
      expect(navigation?.textContent).toContain('Administración');
      expect(container.querySelector('#adminContent')).toBeNull();

      const adminLink = Array.from(container.querySelectorAll('a'))
        .find(link => link.textContent?.trim() === 'Administración');
      expect(adminLink).toBeDefined();

      act(() => {
        adminLink?.click();
      });

      expect(container.querySelector('#adminContent')?.textContent).toBe('admin');
      expect(container.querySelector('a[aria-current="page"]')?.textContent?.trim()).toBe('Administración');
    } finally {
      act(() => {
        ReactDOM.unmountComponentAtNode(container);
      });
      container.remove();
    }
  });

  it('lets administrators register and review their own activities', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const savedActivity: IActivityRecord = {
      id: 42,
      date: getLimaDateOnly(),
      responsibleUser: 'Alex User',
      activity: 'Actividad de prueba',
      process: 'Proyecto',
      project: 'Portal TI',
      hu: 'S/HU',
      hours: 1
    };
    const activityService = createActivityService();
    activityService.getActivities = jest.fn(() => Promise.resolve([savedActivity]));
    activityService.createActivity = jest.fn(() => Promise.resolve());
    const props: ITppSinchiProps = {
      description: '',
      isDarkTheme: false,
      environmentMessage: '',
      userDisplayName: 'Alex User',
      resourcesService: { getResources: () => Promise.resolve([]) },
      activityService,
      accessService: createAccessService(true),
      collaboratorService: createCollaboratorService()
    };

    try {
      await renderApp(props, container);
      const activitiesLink = Array.from(container.querySelectorAll('a'))
        .find(link => link.textContent?.trim() === 'Mis actividades');
      expect(activitiesLink).toBeDefined();
      expect(container.querySelector('nav')?.textContent).toContain('Revisión de actividades');
      expect(container.querySelector('nav')?.textContent).toContain('Administración');

      await act(async () => {
        activitiesLink?.click();
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(container.querySelector('#activitiesTitle')?.textContent).toBe('Mis actividades');
      expect(container.textContent).toContain('Actividad de prueba');
      expect(activityService.getActivities).toHaveBeenCalledWith(
        'Alex User',
        expect.any(String),
        expect.any(String)
      );
      expect(container.textContent).toContain('Registrar actividad');

      const homeLink = Array.from(container.querySelectorAll('a'))
        .find(link => link.textContent?.trim() === 'Inicio');
      act(() => { homeLink?.click(); });
      const registerButton = Array.from(container.querySelectorAll('button'))
        .find(button => button.textContent?.includes('Agregar'));
      expect(registerButton).toBeDefined();
      await act(async () => {
        registerButton?.click();
        await Promise.resolve();
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
        date: '2025-01-15',
        responsibleUser: savedActivity.responsibleUser,
        activity: savedActivity.activity,
        process: savedActivity.process,
        project: savedActivity.project,
        hu: savedActivity.hu,
        hours: savedActivity.hours
      });
      expect(container.querySelector('#activitiesTitle')?.textContent).toBe('Mis actividades');
    } finally {
      act(() => { ReactDOM.unmountComponentAtNode(container); });
      container.remove();
    }
  });

  it('shows a separate team review page to administrators', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const activityService = createActivityService();
    activityService.getTeamActivities = jest.fn(() => Promise.resolve([]));
    const props: ITppSinchiProps = {
      description: '',
      isDarkTheme: false,
      environmentMessage: '',
      userDisplayName: 'Admin User',
      resourcesService: { getResources: () => Promise.resolve([]) },
      activityService,
      accessService: createAccessService(true),
      collaboratorService: createCollaboratorService([{ id: 12, displayName: 'Team User' }])
    };

    try {
      await renderApp(props, container);
      const reviewLink = Array.from(container.querySelectorAll('a'))
        .find(link => link.textContent?.trim() === 'Revisión de actividades');
      act(() => { reviewLink?.click(); });
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(container.querySelector('#adminActivitiesTitle')?.textContent).toBe('Revisión de actividades');
      expect(container.textContent).toContain('Team User');
      expect(container.textContent).not.toContain('Registrar actividad');
      expect(container.querySelector('nav')?.textContent).toContain('Administración');
      expect(activityService.getTeamActivities).toHaveBeenCalled();
      expect(activityService.getActivities).not.toHaveBeenCalled();
      expect(container.querySelector('a[aria-current="page"]')?.textContent?.trim()).toBe('Revisión de actividades');
    } finally {
      act(() => { ReactDOM.unmountComponentAtNode(container); });
      container.remove();
    }
  });

  it('does not show the administration menu to common users', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const props: ITppSinchiProps = {
      description: '',
      isDarkTheme: false,
      environmentMessage: '',
      userDisplayName: 'Alex User',
      resourcesService: { getResources: () => Promise.resolve([]) },
      activityService: createActivityService(),
      accessService: createAccessService(),
      collaboratorService: createCollaboratorService()
    };

    try {
      await renderApp(props, container);

      const navigation = container.querySelector('nav[aria-label="Navegación del portal"]');
      expect(navigation?.textContent).not.toContain('Administración');
      expect(navigation?.textContent).not.toContain('Revisión de actividades');
      expect(container.querySelector('#adminContent')).toBeNull();
    } finally {
      act(() => {
        ReactDOM.unmountComponentAtNode(container);
      });
      container.remove();
    }
  });

  it('returns to home when the user stops being an administrator', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const props: ITppSinchiProps = {
      description: '',
      isDarkTheme: false,
      environmentMessage: '',
      userDisplayName: 'Alex User',
      resourcesService: { getResources: () => Promise.resolve([]) },
      activityService: createActivityService(),
      accessService: createAccessService(true),
      collaboratorService: createCollaboratorService()
    };

    try {
      await renderApp(props, container);

      const adminLink = Array.from(container.querySelectorAll('a'))
        .find(link => link.textContent?.trim() === 'Revisión de actividades');
      act(() => { adminLink?.click(); });
      expect(container.querySelector('#adminActivitiesTitle')?.textContent).toBe('Revisión de actividades');

      await act(async () => {
        ReactDOM.render(<App {...props} accessService={createAccessService()} />, container);
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });

      const navigation = container.querySelector('nav[aria-label="Navegación del portal"]');
      expect(navigation?.textContent).not.toContain('Administración');
      expect(navigation?.textContent).not.toContain('Revisión de actividades');
      expect(container.querySelector('#adminContent')).toBeNull();
      expect(container.textContent).toContain('Hola, Alex User');
    } finally {
      act(() => {
        ReactDOM.unmountComponentAtNode(container);
      });
      container.remove();
    }
  });

  it('falls back to a common user when the role cannot be resolved', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const props: ITppSinchiProps = {
      description: '',
      isDarkTheme: false,
      environmentMessage: '',
      userDisplayName: 'Alex User',
      resourcesService: { getResources: () => Promise.resolve([]) },
      activityService: createActivityService(),
      accessService: { getUserAccess: () => Promise.reject(new Error('Sin acceso')) },
      collaboratorService: createCollaboratorService()
    };

    try {
      await renderApp(props, container);

      const navigation = container.querySelector('nav[aria-label="Navegación del portal"]');
      expect(navigation?.textContent).not.toContain('Administración');
      expect(container.querySelector('#adminContent')).toBeNull();
      expect(container.textContent).toContain('Hola, Alex User');
      expect(consoleError).toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
      act(() => {
        ReactDOM.unmountComponentAtNode(container);
      });
      container.remove();
    }
  });
});
