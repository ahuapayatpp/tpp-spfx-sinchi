import type { SPFI } from '@pnp/sp';
import {
  ActivityService,
  getActivityListPath
} from './activityService';
import type { IActivityDraft } from './activityTypes';

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

function createPagedQuery(pages: unknown[][]): {
  query: {
    select: jest.Mock;
    expand: jest.Mock;
    filter: jest.Mock;
    orderBy: jest.Mock;
    top: jest.Mock;
    [Symbol.asyncIterator]: () => { next: () => Promise<{ done: boolean; value: unknown }> };
  };
} {
  let index = 0;
  const query = {
    select: jest.fn().mockReturnThis(),
    expand: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    top: jest.fn().mockReturnThis(),
    [Symbol.asyncIterator]() {
      return {
        next: () => Promise.resolve(index < pages.length
          ? { done: false, value: pages[index++] }
          : { done: true, value: undefined })
      };
    }
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

  it('loads the selected user activities for a Lima date range', async () => {
    const query = createCatalogQuery([{
      Id: 42,
      field_1: 'Proyecto',
      field_2: 'TPP UI CORE',
      field_4: 'tpp-web',
      field_5: 'HU-12345',
      field_7: 'Validar el formulario',
      field_8: '2026-10-30T12:00:00.000Z',
      field_9: 'Alex User',
      field_10: 0.25
    }]).query;
    const getList = jest.fn().mockReturnValue({ items: query });
    const service = new ActivityService({ web: { getList } } as unknown as SPFI, 'https://tpperuanos.sharepoint.com/sites/SDC-Aplicaciones');

    await expect(service.getActivities('Alex User', '2026-10-01', '2026-10-31')).resolves.toEqual([{
      id: 42,
      date: '2026-10-30',
      responsibleUser: 'Alex User',
      activity: 'Validar el formulario',
      process: 'Proyecto',
      project: 'TPP UI CORE',
      module: 'tpp-web',
      hu: 'HU-12345',
      hours: 0.25
    }]);
    expect(query.select).toHaveBeenCalledWith(
      'Id', 'field_1', 'field_2', 'field_4', 'field_5', 'field_7', 'field_8', 'field_9', 'field_10'
    );
    expect(query.filter).toHaveBeenCalledWith(
      "field_9 eq 'Alex User' and field_8 ge datetime'2026-10-01T05:00:00.000Z' and field_8 lt datetime'2026-11-01T05:00:00.000Z'"
    );
    expect(query.orderBy).toHaveBeenCalledWith('field_8', true);
  });

  it('loads team activities with their SharePoint authors and paged collection query', async () => {
    const query = createPagedQuery([[{
      Id: 84,
      field_1: 'Proyecto',
      field_2: 'TPP UI CORE',
      field_4: 'tpp-web',
      field_5: 'HU-88',
      field_7: 'Revisar integración',
      field_8: '2026-10-30T05:00:00.000Z',
      field_9: 'Alex User',
      field_10: 2.5,
      Author: { Id: 17, Title: 'Alex User', EMail: 'alex.user@tpperuanos.pe' }
    }], [{
      Id: 85,
      field_1: 'Proyecto',
      field_2: 'TPP UI CORE',
      field_4: 'tpp-web',
      field_5: 'HU-89',
      field_7: 'Validar paginación',
      field_8: '2026-10-31T05:00:00.000Z',
      field_9: 'Alex User',
      field_10: 1,
      Author: { Id: 17, Title: 'Alex User', EMail: 'alex.user@tpperuanos.pe' }
    }]]).query;
    const service = new ActivityService(
      { web: { getList: jest.fn().mockReturnValue({ items: query }) } } as unknown as SPFI,
      'https://tpperuanos.sharepoint.com/sites/SDC-Aplicaciones'
    );

    await expect(service.getTeamActivities('2026-10-01', '2026-10-31')).resolves.toEqual([{
      id: 84,
      date: '2026-10-30',
      responsibleUser: 'Alex User',
      activity: 'Revisar integración',
      process: 'Proyecto',
      project: 'TPP UI CORE',
      module: 'tpp-web',
      hu: 'HU-88',
      hours: 2.5,
      authorId: 17,
      authorName: 'Alex User',
      authorEmail: 'alex.user@tpperuanos.pe'
    }, {
      id: 85,
      date: '2026-10-31',
      responsibleUser: 'Alex User',
      activity: 'Validar paginación',
      process: 'Proyecto',
      project: 'TPP UI CORE',
      module: 'tpp-web',
      hu: 'HU-89',
      hours: 1,
      authorId: 17,
      authorName: 'Alex User',
      authorEmail: 'alex.user@tpperuanos.pe'
    }]);
    expect(query.select).toHaveBeenCalledWith(
      'Id', 'field_1', 'field_2', 'field_4', 'field_5', 'field_7', 'field_8',
      'field_9', 'field_10', 'Author/Id', 'Author/Title', 'Author/EMail'
    );
    expect(query.expand).toHaveBeenCalledWith('Author');
    expect(query.filter).toHaveBeenCalledWith(
      "field_8 ge datetime'2026-10-01T05:00:00.000Z' and field_8 lt datetime'2026-11-01T05:00:00.000Z'"
    );
    expect(query.top).toHaveBeenCalledWith(5000);
  });

  it('identifies the SharePoint item and field for invalid team activities', async () => {
    const query = createPagedQuery([[{
      ID: '84',
      field_1: 'Proyecto',
      field_2: 'TPP UI CORE',
      field_4: 'tpp-web',
      field_5: 'HU-88',
      field_7: 'Revisar integración',
      field_8: '2026-10-30T05:00:00.000Z',
      field_9: 'Alex User',
      field_10: '2.5',
      Author: { Id: 17, Title: 'Alex User', EMail: 'alex.user@tpperuanos.pe' }
    }]]).query;
    const service = new ActivityService(
      { web: { getList: jest.fn().mockReturnValue({ items: query }) } } as unknown as SPFI,
      'https://tpperuanos.sharepoint.com/sites/SDC-Aplicaciones'
    );

    await expect(service.getTeamActivities('2026-10-01', '2026-10-31'))
      .rejects.toThrow(/ID 84 tiene datos inválidos en el campo "field_10" \(Horas\)/);
  });

  it('rejects team activities without a valid SharePoint item ID', async () => {
    const query = createPagedQuery([[{
      field_1: 'Proyecto',
      field_2: 'TPP UI CORE',
      field_4: 'tpp-web',
      field_5: 'HU-88',
      field_7: 'Revisar integración',
      field_8: '2026-10-30T05:00:00.000Z',
      field_9: 'Alex User',
      field_10: 2.5,
      Author: { Id: 17, Title: 'Alex User', EMail: 'alex.user@tpperuanos.pe' }
    }]]).query;
    const service = new ActivityService(
      { web: { getList: jest.fn().mockReturnValue({ items: query }) } } as unknown as SPFI,
      'https://tpperuanos.sharepoint.com/sites/SDC-Aplicaciones'
    );

    await expect(service.getTeamActivities('2026-10-01', '2026-10-31'))
      .rejects.toThrow(/actividad en la posición 1 tiene datos inválidos en el campo "ID" \(ID de SharePoint\)\. Valores recibidos: ID \(ausente\), Id \(ausente\), id \(ausente\)\. Claves del elemento: Author, field_1/);
  });

  it('rejects team activities without a SharePoint author', async () => {
    const query = createPagedQuery([[{
      Id: 84,
      field_1: 'Proyecto', field_2: 'TPP UI CORE', field_4: '', field_5: 'HU-88',
      field_7: 'Revisar integración', field_8: '2026-10-30T05:00:00.000Z',
      field_9: 'Alex User', field_10: 1
    }]]).query;
    const service = new ActivityService(
      { web: { getList: jest.fn().mockReturnValue({ items: query }) } } as unknown as SPFI,
      'https://tpperuanos.sharepoint.com/sites/SDC-Aplicaciones'
    );

    await expect(service.getTeamActivities('2026-10-01', '2026-10-31'))
      .rejects.toThrow('identificar al autor');
  });

  it('preserves the no-HU marker when reading activities', async () => {
    const query = createCatalogQuery([{
      Id: 42,
      field_1: 'Proyecto',
      field_2: 'TPP UI CORE',
      field_4: '',
      field_5: 'S/HU',
      field_7: 'Actividad sin HU',
      field_8: '2026-10-30T05:00:00.000Z',
      field_9: 'Alex User',
      field_10: 1
    }]).query;
    const service = new ActivityService(
      { web: { getList: jest.fn().mockReturnValue({ items: query }) } } as unknown as SPFI,
      'https://tpperuanos.sharepoint.com/sites/SDC-Aplicaciones'
    );

    const activities = await service.getActivities('Alex User', '2026-10-01', '2026-10-31');

    expect(activities[0].hu).toBe('S/HU');
  });

  it('rejects invalid activity query ranges and invalid returned activities', async () => {
    const query = createCatalogQuery([{ Id: 42, field_10: 1 }]).query;
    const service = new ActivityService(
      { web: { getList: jest.fn().mockReturnValue({ items: query }) } } as unknown as SPFI,
      'https://tpperuanos.sharepoint.com/sites/SDC-Aplicaciones'
    );

    await expect(service.getActivities('Alex User', '2026-02-30', '2026-03-01'))
      .rejects.toThrow('rango de fechas');
    await expect(service.getActivities('Alex User', '2026-10-01', '2026-10-31'))
      .rejects.toThrow('datos inválidos');
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
      field_8: '2026-10-30T12:00:00.000Z',
      field_9: 'Alex User',
      field_10: 1.5,
      field_4: 'tpp-web'
    });
  });

  it('stores the no-HU marker as text in the existing HU field', async () => {
    const add = jest.fn().mockResolvedValue({ data: { Id: 42 } });
    const service = new ActivityService(
      { web: { getList: jest.fn().mockReturnValue({ items: { add } }) } } as unknown as SPFI,
      'https://tpperuanos.sharepoint.com/sites/SDC-Aplicaciones'
    );

    await expect(service.createActivity({ ...ACTIVITY, hu: 'S/HU' })).resolves.toBeUndefined();
    expect(add).toHaveBeenCalledWith(expect.objectContaining({ field_5: 'S/HU' }));
  });

  it('accepts quarter-hour values without an explicit upper limit', async () => {
    const add = jest.fn().mockResolvedValue({ data: { Id: 42 } });
    const service = new ActivityService(
      { web: { getList: jest.fn().mockReturnValue({ items: { add } }) } } as unknown as SPFI,
      'https://tpperuanos.sharepoint.com/sites/SDC-Aplicaciones'
    );

    await expect(service.createActivity({ ...ACTIVITY, hours: 0.25 })).resolves.toBeUndefined();
    await expect(service.createActivity({ ...ACTIVITY, hours: 12.25 })).resolves.toBeUndefined();
    await expect(service.createActivity({ ...ACTIVITY, hours: 0.3 }))
      .rejects.toThrow('múltiplos de 0,25');
    expect(add).toHaveBeenCalledTimes(2);
  });

  it('updates and deletes only an activity owned by the current user', async () => {
    const update = jest.fn().mockResolvedValue({});
    const remove = jest.fn().mockResolvedValue({});
    const getById = jest.fn((id: number) => ({
      select: jest.fn().mockReturnValue(() => Promise.resolve({
        Id: id,
        field_9: id === 43 ? 'Other User' : 'Alex User'
      })),
      update,
      delete: remove
    }));
    const service = new ActivityService(
      { web: { getList: jest.fn().mockReturnValue({ items: { getById } }) } } as unknown as SPFI,
      'https://tpperuanos.sharepoint.com/sites/SDC-Aplicaciones'
    );

    await expect(service.updateActivity(42, ACTIVITY)).resolves.toBeUndefined();
    await expect(service.deleteActivity(42, 'Alex User')).resolves.toBeUndefined();
    await expect(service.updateActivity(43, ACTIVITY)).rejects.toThrow('No se encontró la actividad');
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ field_10: 1.5 }));
    expect(remove).toHaveBeenCalledTimes(1);
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
