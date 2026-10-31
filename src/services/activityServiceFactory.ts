import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { createSharePointClient } from './sharePointClient';
import {
  ActivityService,
  type IActivityService
} from './activityService';

export function createActivityService(context: WebPartContext, siteUrl: string): IActivityService {
  let service: ActivityService | undefined;

  const getService = (): ActivityService => {
    if (!service) {
      service = new ActivityService(createSharePointClient(context, siteUrl), siteUrl);
    }

    return service;
  };

  return {
    getCatalogs: () => getService().getCatalogs(),
    getDailyHours: (resource, date) => getService().getDailyHours(resource, date),
    createActivity: activity => getService().createActivity(activity)
  };
}
