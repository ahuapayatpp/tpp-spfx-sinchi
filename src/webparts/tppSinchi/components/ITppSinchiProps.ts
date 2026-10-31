import type { IResourcesService } from '../../../services/resourcesService';
import type { IActivityService } from '../../../services/activityService';

export interface ITppSinchiProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  userDisplayName: string;
  resourcesService: IResourcesService;
  activityService: IActivityService;
}
