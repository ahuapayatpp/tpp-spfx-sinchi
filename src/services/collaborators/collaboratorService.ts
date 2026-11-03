import type { SPFI } from '@pnp/sp';
import type { ICollaboratorService, ITeamMember } from './collaboratorTypes';

type IRecord = Record<string, unknown>;

export interface IGraphRequest {
  get(): Promise<unknown>;
}

export interface IGraphClient {
  api(path: string): IGraphRequest;
}

function isRecord(value: unknown): value is IRecord {
  return typeof value === 'object' && value !== null;
}

export class CollaboratorService implements ICollaboratorService {
  public constructor(
    private readonly _sp: SPFI,
    private readonly _getGraphClient: () => Promise<IGraphClient>
  ) {}

  public async getTeamMembers(): Promise<ITeamMember[]> {
    const site: unknown = await this._sp.site.select('GroupId')();
    if (!isRecord(site) || typeof site.GroupId !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(site.GroupId)) {
      throw new Error('El sitio SharePoint no tiene un grupo de Microsoft 365 asociado.');
    }

    const graphClient = await this._getGraphClient();
    const groupId = site.GroupId;
    const members: ITeamMember[] = [];
    let nextLink: string | undefined =
      `/groups/${groupId}/members/microsoft.graph.user?$select=id,displayName,mail,userPrincipalName`;

    while (nextLink) {
      const pageUrl = nextLink;
      if (/^https?:/i.test(pageUrl)) {
        const parsedNextLink = new URL(pageUrl);
        if (parsedNextLink.protocol !== 'https:' || parsedNextLink.hostname !== 'graph.microsoft.com') {
          throw new Error('Microsoft Graph devolvió un enlace de paginación no válido.');
        }
      }

      const response: unknown = await graphClient.api(pageUrl).get();
      if (!isRecord(response) || !Array.isArray(response.value)) {
        throw new Error('Microsoft Graph devolvió una respuesta inesperada al consultar miembros del sitio.');
      }

      response.value.forEach((value: unknown, index: number) => {
        if (!isRecord(value) || typeof value.id !== 'string' || !value.id.trim() ||
            typeof value.displayName !== 'string' || !value.displayName.trim()) {
          throw new Error(`El grupo Microsoft 365 del sitio contiene un miembro inválido en la posición ${members.length + index + 1}.`);
        }

        const email = typeof value.mail === 'string' && value.mail.trim()
          ? value.mail.trim()
          : typeof value.userPrincipalName === 'string' && value.userPrincipalName.trim()
            ? value.userPrincipalName.trim()
            : undefined;
        members.push({
          id: value.id,
          displayName: value.displayName.trim(),
          email,
          loginName: typeof value.userPrincipalName === 'string' ? value.userPrincipalName : undefined
        });
      });

      if (response['@odata.nextLink'] === undefined) {
        nextLink = undefined;
      } else if (typeof response['@odata.nextLink'] === 'string' && response['@odata.nextLink'].trim()) {
        nextLink = response['@odata.nextLink'];
      } else {
        throw new Error('Microsoft Graph devolvió un enlace de paginación inválido.');
      }
    }

    if (members.length === 0) {
      throw new Error('El grupo Microsoft 365 asociado al sitio no tiene miembros para revisar.');
    }

    return members;
  }
}
