import type { IResourcesService } from '../../../services/resourcesService';

export interface ITppSinchiProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  userDisplayName: string;
  resourcesService: IResourcesService;
}
