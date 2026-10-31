import type { SPFI } from '@pnp/sp';
import { ActivityService, getActivityListPath, type IActivityDraft } from './activityService';

const ACTIVITY: IActivityDraft = {
  date: '2026-10-30',
  responsibleUser: 'Alex User',
  activity: 'Validar el formulario de actividades',
  process: 'Proyecto',
  project: 'TPP UI CORE',
  module: 'tpp-web',
  hu: 'HU-12345',
  hours: 1.5
};

function createCatalogQuery(items: unknown[]): {
  query: {
    select: jest.Mock;
    filter: jest.Mock;
    orderBy: jest.Mock;
    top: jest.Mock;
  };
} {
  const query = {
    select: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    top: jest.fn().mockReturnValue(() => Promise.resolve(items))
  };
  return { query };
}

describe('ActivityService', () => {
  it('builds the activity list path from the site URL', () => {
    expect(getActivityListPath('https://tpperuanos.sharepoint.com/sites/SDC-Aplicaciones/'))
      .toBe('/sites/SDC-Aplicaciones/Lists/tpp_actividades');
  });

  it('loads active process and project options from their catalogs', async () => {
    const processQuery = createCatalogQuery([
      { Id: 2, Title: 'Proyecto', Estado: 'Activo' },
      { Id: 3, Title: 'Inactivo', Estado: 'Inactivo' }
    ]).query;
    const projectQuery = createCatalogQuery([
      { Id: 7, Title: 'TPP UI CORE', Estado: 'Activo' }
    ]).query;
    const getList = jest.fn()
      .mockReturnValueOnce({ items: processQuery })
      .mockReturnValueOnce({ items: projectQuery });
    const sp = { web: { getList } } as unknown as SPFI;
    const service = new ActivityService(sp, 'https://tpperuanos.sharepoint.com/sites/SDC-Aplicaciones');

    await expect(service.getCatalogs()).resolves.toEqual({
      processes: [{ key: 'Proyecto', text: 'Proyecto' }],
      projects: [{ key: 'TPP UI CORE', text: 'TPP UI CORE' }]
    });
    expect(processQuery.select).toHaveBeenCalledWith('Id', 'Title', 'Estado');
    expect(processQuery.filter).toHaveBeenCalledWith("Estado eq 'Activo'");
    expect(projectQuery.orderBy).toHaveBeenCalledWith('Title', true);
  });

  it('sums the user hours for the requested SharePoint date range', async () => {
    const query = createCatalogQuery([
      { field_10: 1.5 },
      { field_10: 2 },
      { field_10: 0.5 }
    ]).query;
    const getList = jest.fn().mockReturnValue({ items: query });
    const sp = { web: { getList } } as unknown as SPFI;
    const service = new ActivityService(sp, 'https://tpperuanos.sharepoint.com/sites/SDC-Aplicaciones');

    await expect(service.getDailyHours('O\'Connor', '2026-10-30')).resolves.toBe(4);
    expect(getList).toHaveBeenCalledWith('/sites/SDC-Aplicaciones/Lists/tpp_actividades');
    expect(query.select).toHaveBeenCalledWith('field_10');
    expect(query.filter).toHaveBeenCalledWith(
      "field_9 eq 'O''Connor' and field_8 ge datetime'2026-10-30T05:00:00.000Z' and field_8 lt datetime'2026-10-31T05:00:00.000Z'"
    );
    expect(query.top).toHaveBeenCalledWith(5000);
  });

  it('returns zero when no activities were registered for the day', async () => {
    const query = createCatalogQuery([]).query;
    const sp = { web: { getList: jest.fn().mockReturnValue({ items: query }) } } as unknown as SPFI;
    const service = new ActivityService(sp, 'https://tpperuanos.sharepoint.com/sites/SDC-Aplicaciones');

    await expect(service.getDailyHours('Alex User', '2026-10-30')).resolves.toBe(0);
  });

  it('rejects invalid hour values and propagates SharePoint query errors', async () => {
    const invalidQuery = createCatalogQuery([{ field_10: '1.5' }]).query;
    const invalidService = new ActivityService(
      { web: { getList: jest.fn().mockReturnValue({ items: invalidQuery }) } } as unknown as SPFI,
      'https://tpperuanos.sharepoint.com/sites/SDC-Aplicaciones'
    );
    await expect(invalidService.getDailyHours('Alex User', '2026-10-30'))
      .rejects.toThrow('valor de horas inválido');

    const failedQuery = {
      select: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      top: jest.fn().mockReturnValue(() => Promise.reject(new Error('Acceso denegado')))
    };
    const failedService = new ActivityService(
      { web: { getList: jest.fn().mockReturnValue({ items: failedQuery }) } } as unknown as SPFI,
      'https://tpperuanos.sharepoint.com/sites/SDC-Aplicaciones'
    );
    await expect(failedService.getDailyHours('Alex User', '2026-10-30'))
      .rejects.toThrow('Acceso denegado');
  });

  it('creates an activity using the existing SharePoint internal field names', async () => {
    const add = jest.fn().mockResolvedValue({ data: { Id: 42 } });
    const getList = jest.fn().mockReturnValue({ items: { add } });
    const sp = { web: { getList } } as unknown as SPFI;
    const service = new ActivityService(sp, 'https://tpperuanos.sharepoint.com/sites/SDC-Aplicaciones');

    await expect(service.createActivity(ACTIVITY)).resolves.toBeUndefined();
    expect(getList).toHaveBeenCalledWith('/sites/SDC-Aplicaciones/Lists/tpp_actividades');
    expect(add).toHaveBeenCalledWith({
      field_1: 'Proyecto',
      field_2: 'TPP UI CORE',
      field_5: 'HU-12345',
      field_7: 'Validar el formulario de actividades',
      field_8: '2026-10-30T05:00:00.000Z',
      field_9: 'Alex User',
      field_10: 1.5,
      field_4: 'tpp-web'
    });
  });

  it('rejects invalid form data without writing to SharePoint', async () => {
    const add = jest.fn();
    const getList = jest.fn().mockReturnValue({ items: { add } });
    const sp = { web: { getList } } as unknown as SPFI;
    const service = new ActivityService(sp, 'https://tpperuanos.sharepoint.com/sites/SDC-Aplicaciones');

    await expect(service.createActivity({ ...ACTIVITY, date: '2026-02-30' }))
      .rejects.toThrow('fecha');
    expect(add).not.toHaveBeenCalled();
  });

  it('propagates SharePoint write failures', async () => {
    const add = jest.fn().mockRejectedValue(new Error('Acceso denegado'));
    const getList = jest.fn().mockReturnValue({ items: { add } });
    const sp = { web: { getList } } as unknown as SPFI;
    const service = new ActivityService(sp, 'https://tpperuanos.sharepoint.com/sites/SDC-Aplicaciones');

    await expect(service.createActivity(ACTIVITY)).rejects.toThrow('Acceso denegado');
  });
});
