import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { createSharePointClient } from './sharePointClient';
import {
  getResourcesListServerRelativeUrl,
  type IResourcesService,
  ResourcesService
} from './resourcesService';

export function createResourcesService(context: WebPartContext, siteUrl: string): IResourcesService {
  let service: ResourcesService | undefined;

  return {
    getResources: async () => {
      if (!service) {
        service = new ResourcesService(
          createSharePointClient(context, siteUrl),
          getResourcesListServerRelativeUrl(siteUrl)
        );
      }

      return service.getResources();
    }
  };
}
