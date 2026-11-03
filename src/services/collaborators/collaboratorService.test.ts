import type { SPFI } from '@pnp/sp';
import { CollaboratorService } from './collaboratorService';

const GROUP_ID = 'e56c0f35-367a-4f4d-8a11-26e14ab46681';

function createService(
  siteResponse: unknown,
  responses: unknown[],
  graphError?: Error
): { service: CollaboratorService; graphApi: jest.Mock } {
  const siteQuery = jest.fn().mockResolvedValue(siteResponse);
  const graphApi = jest.fn((_path: string) => ({
    get: jest.fn().mockImplementation(() => {
      if (graphError) {
        return Promise.reject(graphError);
      }
      const responseIndex = graphApi.mock.calls.length - 1;
      return Promise.resolve(responses[responseIndex]);
    })
  }));
  const service = new CollaboratorService({
    site: { select: jest.fn().mockReturnValue(siteQuery) }
  } as unknown as SPFI, async () => ({ api: graphApi }));

  return { service, graphApi };
}

describe('CollaboratorService', () => {
  it('reads and maps Microsoft 365 members, following Graph pagination', async () => {
    const nextLink = `https://graph.microsoft.com/v1.0/groups/${GROUP_ID}/members?$skiptoken=page2`;
    const { service, graphApi } = createService({ GroupId: GROUP_ID }, [
      {
        value: [{
          id: 'a1f2e965-75d1-4385-9d51-e8015d90f321',
          displayName: 'Ana Quispe',
          mail: 'ana.quispe@tpperuanos.pe',
          userPrincipalName: 'ana.quispe@tpperuanos.pe'
        }],
        '@odata.nextLink': nextLink
      },
      {
        value: [{
          id: 'bca7f7bb-8d55-4778-8efe-4507a7b49b18',
          displayName: 'Luis Paredes',
          mail: null,
          userPrincipalName: 'luis.paredes@tpperuanos.pe'
        }]
      }
    ]);

    await expect(service.getTeamMembers()).resolves.toEqual([
      {
        id: 'a1f2e965-75d1-4385-9d51-e8015d90f321',
        displayName: 'Ana Quispe',
        email: 'ana.quispe@tpperuanos.pe',
        loginName: 'ana.quispe@tpperuanos.pe'
      },
      {
        id: 'bca7f7bb-8d55-4778-8efe-4507a7b49b18',
        displayName: 'Luis Paredes',
        email: 'luis.paredes@tpperuanos.pe',
        loginName: 'luis.paredes@tpperuanos.pe'
      }
    ]);
    expect(graphApi).toHaveBeenNthCalledWith(
      1,
      `/groups/${GROUP_ID}/members/microsoft.graph.user?$select=id,displayName,mail,userPrincipalName`
    );
    expect(graphApi).toHaveBeenNthCalledWith(2, nextLink);
  });

  it('rejects a site without a valid Microsoft 365 group ID and malformed Graph data', async () => {
    const missingGroupService = createService({ GroupId: '' }, []);
    await expect(missingGroupService.service.getTeamMembers())
      .rejects.toThrow('no tiene un grupo de Microsoft 365 asociado');

    const invalidMembersService = createService({ GroupId: GROUP_ID }, [{ value: [{ id: 1 }] }]);
    await expect(invalidMembersService.service.getTeamMembers())
      .rejects.toThrow('contiene un miembro inválido');
  });

  it('rejects empty membership and propagates Graph errors', async () => {
    const emptyService = createService({ GroupId: GROUP_ID }, [{ value: [] }]);
    await expect(emptyService.service.getTeamMembers())
      .rejects.toThrow('no tiene miembros para revisar');

    const deniedService = createService({ GroupId: GROUP_ID }, [], new Error('Consentimiento requerido'));
    await expect(deniedService.service.getTeamMembers()).rejects.toThrow('Consentimiento requerido');
  });
});
