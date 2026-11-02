import type { IResourcesService } from '../../../services/resources/resourcesService';
import type { IActivityService } from '../../../services/activities/activityService';
import type { IAccessService } from '../../../services/access/accessTypes';

export interface ITppSinchiProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  userDisplayName: string;
  resourcesService: IResourcesService;
  activityService: IActivityService;
  accessService: IAccessService;
}
