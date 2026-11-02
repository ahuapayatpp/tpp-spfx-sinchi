import type { SPFI } from '@pnp/sp';
import { AccessService, DEFAULT_ADMIN_GROUP } from './accessService';

const USER = {
  Id: 7,
  Title: 'Alex User',
  LoginName: 'i:0#.f|membership|alex.user@tpperuanos.pe'
};

const ADMIN_GROUP = { Id: 21, Title: DEFAULT_ADMIN_GROUP };

function createService(
  groups: Array<{ Id: number; Title: string }>,
  adminGroupTitle: string = DEFAULT_ADMIN_GROUP
): { service: AccessService; userSelect: jest.Mock; groupsSelect: jest.Mock } {
  const userSelect = jest.fn().mockReturnValue(() => Promise.resolve(USER));
  const groupsSelect = jest.fn().mockReturnValue(() => Promise.resolve(groups));
  const sp = {
    web: {
      currentUser: {
        select: userSelect,
        groups: { select: groupsSelect }
      }
    }
  } as unknown as SPFI;

  return {
    service: new AccessService(sp, adminGroupTitle),
    userSelect,
    groupsSelect
  };
}

describe('AccessService', () => {
  it('marks a member of the admin group as administrator', async () => {
    const { service, userSelect, groupsSelect } = createService([ADMIN_GROUP]);

    await expect(service.getUserAccess()).resolves.toEqual({
      userId: 7,
      displayName: 'Alex User',
      loginName: 'i:0#.f|membership|alex.user@tpperuanos.pe',
      isAdmin: true,
      role: 'admin'
    });
    expect(userSelect).toHaveBeenCalledWith('Id', 'Title', 'LoginName');
    expect(groupsSelect).toHaveBeenCalledWith('Id', 'Title');
  });

  it('marks a user outside the admin group as a common user', async () => {
    const { service } = createService([{ Id: 22, Title: 'TPP Sinchi Lectores' }]);

    await expect(service.getUserAccess()).resolves.toEqual(expect.objectContaining({
      isAdmin: false,
      role: 'user'
    }));
  });

  it('ignores case and surrounding spaces when comparing the group name', async () => {
    const { service } = createService(
      [{ Id: 21, Title: '  tpp sinchi administradores  ' }],
      ' TPP SINCHI ADMINISTRADORES '
    );

    await expect(service.getUserAccess()).resolves.toEqual(expect.objectContaining({
      isAdmin: true,
      role: 'admin'
    }));
  });

  it('rejects when the admin group is not configured', async () => {
    const { service } = createService([ADMIN_GROUP], '   ');

    await expect(service.getUserAccess()).rejects.toThrow('grupo de administradores');
  });

  it('propagates SharePoint query failures', async () => {
    const userSelect = jest.fn().mockReturnValue(() => Promise.resolve(USER));
    const groupsSelect = jest.fn().mockReturnValue(() => Promise.reject(new Error('Acceso denegado')));
    const sp = {
      web: {
        currentUser: {
          select: userSelect,
          groups: { select: groupsSelect }
        }
      }
    } as unknown as SPFI;
    const service = new AccessService(sp, DEFAULT_ADMIN_GROUP);

    await expect(service.getUserAccess()).rejects.toThrow('Acceso denegado');
  });
});
