import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { createSharePointClient } from '../sharepoint/sharePointClient';
import { CollaboratorService } from './collaboratorService';
import type { ICollaboratorService } from './collaboratorTypes';

export function createCollaboratorService(
  context: WebPartContext,
  siteUrl: string
): ICollaboratorService {
  let service: CollaboratorService | undefined;

  const getService = (): CollaboratorService => {
    if (!service) {
      service = new CollaboratorService(
        createSharePointClient(context, siteUrl),
        () => context.msGraphClientFactory.getClient('3')
      );
    }
    return service;
  };

  return { getTeamMembers: () => getService().getTeamMembers() };
}
