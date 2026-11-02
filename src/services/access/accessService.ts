import type { SPFI } from '@pnp/sp';
import type { IAccessService, IUserAccess } from './accessTypes';

export const DEFAULT_ADMIN_GROUP = 'TPP Sinchi Administradores';

export class AccessService implements IAccessService {
  public constructor(
    private readonly _sp: SPFI,
    private readonly _adminGroupTitle: string
  ) {}

  public async getUserAccess(): Promise<IUserAccess> {
    const groupTitle = (this._adminGroupTitle || '').trim();

    if (!groupTitle) {
      throw new Error('No se configuró el grupo de administradores de Sinchi.');
    }

    const [user, groups] = await Promise.all([
      this._sp.web.currentUser.select('Id', 'Title', 'LoginName')(),
      this._sp.web.currentUser.groups.select('Id', 'Title')()
    ]);

    const expectedTitle = groupTitle.toLowerCase();
    const isAdmin = groups.some(group => (group.Title || '').trim().toLowerCase() === expectedTitle);

    return {
      userId: user.Id,
      displayName: user.Title,
      loginName: user.LoginName,
      isAdmin,
      role: isAdmin ? 'admin' : 'user'
    };
  }
}
