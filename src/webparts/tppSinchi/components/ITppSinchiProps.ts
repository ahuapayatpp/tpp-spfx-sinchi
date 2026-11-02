import type { IResourcesService } from '../../../services/resources/resourcesService';
import type { IActivityService } from '../../../services/activities/activityService';

export interface ITppSinchiProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  userDisplayName: string;
  resourcesService: IResourcesService;
  activityService: IActivityService;
}
