import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as strings from 'TppSinchiWebPartStrings';
import TppSinchi from './components/TppSinchi';
import { ITppSinchiProps } from './components/ITppSinchiProps';
import type { IResourcesService } from '../../services/resourcesService';
import { createResourcesService } from '../../services/resourcesServiceFactory';
import type { IActivityService } from '../../services/activityService';
import { createActivityService } from '../../services/activityServiceFactory';

const DEFAULT_RESOURCES_SITE_URL: string = 'https://tpperuanos.sharepoint.com/sites/SDC-Aplicaciones';

export interface ITppSinchiWebPartProps {
  description: string;
  resourcesSiteUrl: string;
}

export default class TppSinchiWebPart extends BaseClientSideWebPart<ITppSinchiWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';
  private _resourcesService: IResourcesService | undefined;
  private _resourcesServiceSiteUrl: string = '';
  private _activityService: IActivityService | undefined;
  private _activityServiceSiteUrl: string = '';

  public render(): void {
    const element: React.ReactElement<ITppSinchiProps> = React.createElement(
      TppSinchi,
      {
        description: this.properties.description,
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        userDisplayName: this.context.pageContext.user.displayName,
        resourcesService: this._getResourcesService(),
        activityService: this._getActivityService()
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    return this._getEnvironmentMessage().then(message => {
      this._environmentMessage = message;
    });
  }

  private _getResourcesService(): IResourcesService {
    const siteUrl = (this.properties.resourcesSiteUrl || DEFAULT_RESOURCES_SITE_URL).trim();

    if (!this._resourcesService || this._resourcesServiceSiteUrl !== siteUrl) {
      this._resourcesService = createResourcesService(this.context, siteUrl);
      this._resourcesServiceSiteUrl = siteUrl;
    }

    return this._resourcesService;
  }

  private _getActivityService(): IActivityService {
    const siteUrl = (this.properties.resourcesSiteUrl || DEFAULT_RESOURCES_SITE_URL).trim();

    if (!this._activityService || this._activityServiceSiteUrl !== siteUrl) {
      this._activityService = createActivityService(this.context, siteUrl);
      this._activityServiceSiteUrl = siteUrl;
    }

    return this._activityService;
  }



  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) { // running in Teams, office.com or Outlook
      return this.context.sdks.microsoftTeams.teamsJs.app.getContext()
        .then(context => {
          let environmentMessage: string = '';
          switch (context.app.host.name) {
            case 'Office': // running in Office
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOffice : strings.AppOfficeEnvironment;
              break;
            case 'Outlook': // running in Outlook
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOutlook : strings.AppOutlookEnvironment;
              break;
            case 'Teams': // running in Teams
            case 'TeamsModern':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentTeams : strings.AppTeamsTabEnvironment;
              break;
            default:
              environmentMessage = strings.UnknownEnvironment;
          }

          return environmentMessage;
        });
    }

    return Promise.resolve(this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentSharePoint : strings.AppSharePointEnvironment);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                }),
                PropertyPaneTextField('resourcesSiteUrl', {
                  label: strings.ResourcesSiteUrlFieldLabel,
                  description: strings.ResourcesSiteUrlFieldDescription
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
