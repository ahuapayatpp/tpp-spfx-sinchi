import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { createSharePointClient } from '../sharepoint/sharePointClient';
import { AccessService, DEFAULT_ADMIN_GROUP } from './accessService';
import type { IAccessService } from './accessTypes';

export function createAccessService(
  context: WebPartContext,
  siteUrl: string,
  adminGroupTitle: string = DEFAULT_ADMIN_GROUP
): IAccessService {
  let service: AccessService | undefined;

  const getService = (): AccessService => {
    if (!service) {
      service = new AccessService(createSharePointClient(context, siteUrl), adminGroupTitle);
    }

    return service;
  };

  return {
    getUserAccess: () => getService().getUserAccess()
  };
}
