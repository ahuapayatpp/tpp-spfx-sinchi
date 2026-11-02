import type { SPFI } from '@pnp/sp';
import { getResourcesListServerRelativeUrl, ResourcesService } from './resourcesService';

function createSharePointMock(items: unknown[]): {
  sp: SPFI;
  getList: jest.Mock;
  query: {
    select: jest.Mock;
    orderBy: jest.Mock;
    top: jest.Mock;
  };
} {
  const query = {
    select: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    top: jest.fn().mockReturnValue(() => Promise.resolve(items))
  };
  const getList = jest.fn().mockReturnValue({ items: query });
  const sp = { web: { getList } } as unknown as SPFI;

  return { sp, getList, query };
}

describe('ResourcesService', () => {
  it('builds the list path from the configured SharePoint web URL', () => {
    expect(getResourcesListServerRelativeUrl(
      'https://tpperuanos.sharepoint.com/sites/SDC-Aplicaciones/'
    )).toBe('/sites/SDC-Aplicaciones/Lists/tppsinchi_recursos');
  });

  it('loads and maps resources from the SharePoint list', async () => {
    const { sp, getList, query } = createSharePointMock([
      {
        Id: 11,
        Title: 'Portal TI',
        url: { Url: 'https://contoso.sharepoint.com/portal', Description: 'Portal' },
        descripcion: 'Portal de soporte para el equipo de TI.',
        categoria: 'FRONT'
      }
    ]);

    await expect(new ResourcesService(
      sp,
      '/sites/SDC-Aplicaciones/Lists/tppsinchi_recursos'
    ).getResources()).resolves.toEqual([
      {
        id: 11,
        name: 'Portal TI',
        url: 'https://contoso.sharepoint.com/portal',
        description: 'Portal de soporte para el equipo de TI.',
        category: 'FRONT'
      }
    ]);
    expect(getList).toHaveBeenCalledWith('/sites/SDC-Aplicaciones/Lists/tppsinchi_recursos');
    expect(query.select).toHaveBeenCalledWith(
      'Id',
      'Title',
      'url',
      'descripcion',
      'categoria'
    );
    expect(query.orderBy).toHaveBeenCalledWith('Title', true);
  });

  it('rejects resource links that do not use HTTP or HTTPS', async () => {
    const { sp } = createSharePointMock([
      {
        Id: 12,
        Title: 'Recurso inválido',
        url: { Url: 'ftp://example.com/resource' },
        descripcion: 'Descripción',
        categoria: 'FRONT'
      }
    ]);

    await expect(new ResourcesService(
      sp,
      '/sites/SDC-Aplicaciones/Lists/tppsinchi_recursos'
    ).getResources()).rejects.toThrow(
      'protocolo no permitido'
    );
  });

  it('omits empty descriptions so the UI can hide the tooltip', async () => {
    const { sp } = createSharePointMock([
      {
        Id: 13,
        Title: 'Portal TI',
        url: { Url: 'https://contoso.sharepoint.com/portal' },
        descripcion: '  ',
        categoria: 'FRONT'
      }
    ]);

    await expect(new ResourcesService(
      sp,
      '/sites/SDC-Aplicaciones/Lists/tppsinchi_recursos'
    ).getResources()).resolves.toEqual([
      {
        id: 13,
        name: 'Portal TI',
        url: 'https://contoso.sharepoint.com/portal',
        description: undefined,
        category: 'FRONT'
      }
    ]);
  });
});
