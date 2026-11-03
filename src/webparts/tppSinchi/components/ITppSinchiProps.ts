import type { IResourcesService } from '../../../services/resources/resourcesService';
import type { IActivityService } from '../../../services/activities/activityService';
import type { IAccessService } from '../../../services/access/accessTypes';
import type { ICollaboratorService } from '../../../services/collaborators/collaboratorTypes';

export interface ITppSinchiProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  userDisplayName: string;
  resourcesService: IResourcesService;
  activityService: IActivityService;
  accessService: IAccessService;
  collaboratorService: ICollaboratorService;
}
