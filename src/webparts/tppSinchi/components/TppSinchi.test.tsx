/* eslint-disable @rushstack/pair-react-dom-render-unmount */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import type { IResourcesService, IResource } from '../../../services/resourcesService';
import type { IActivityService } from '../../../services/activityService';
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
