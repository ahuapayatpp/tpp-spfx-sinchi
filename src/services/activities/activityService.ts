import type { SPFI } from '@pnp/sp';
import { getLimaDateOnly, getLimaDateStartUtc } from './activityDate';
import { escapeODataString, getServerRelativeListUrl } from '../sharepoint/sharePointUrl';
import type {
  IActivityCatalogs,
  IActivityDraft,
  IActivityOption,
  IActivityRecord,
  ITeamActivityRecord
} from './activityTypes';

const ACTIVITIES_LIST: string = 'Lists/tpp_actividades';
const PROCESSES_LIST: string = 'tpp_procesos';
const PROJECTS_LIST: string = 'tpp_proyectos';

const PROCESS_FIELD: string = 'field_1';
const PROJECT_FIELD: string = 'field_2';
const MODULE_FIELD: string = 'field_4';
const HU_FIELD: string = 'field_5';
const ACTIVITY_FIELD: string = 'field_7';
const DATE_FIELD: string = 'field_8';
const RESOURCE_FIELD: string = 'field_9';
const HOURS_FIELD: string = 'field_10';
const ID_FIELD: string = 'ID';
const ID_SELECT_FIELD: string = 'Id';

export interface IActivityService {
  getCatalogs(): Promise<IActivityCatalogs>;
  getActivities(resource: string, from: string, to: string): Promise<IActivityRecord[]>;
  getTeamActivities(from: string, to: string): Promise<ITeamActivityRecord[]>;
  getDailyHours(resource: string, date: string): Promise<number>;
  createActivity(activity: IActivityDraft): Promise<void>;
  updateActivity(id: number, activity: IActivityDraft): Promise<void>;
  deleteActivity(id: number, resource: string): Promise<void>;
}

type IRecord = Record<string, unknown>;

function isRecord(value: unknown): value is IRecord {
  return typeof value === 'object' && value !== null;
}

function getActivityListServerRelativeUrl(siteUrl: string): string {
  return getServerRelativeListUrl(siteUrl, ACTIVITIES_LIST);
}

function getCatalogListServerRelativeUrl(siteUrl: string, listName: string): string {
  return getServerRelativeListUrl(siteUrl, `Lists/${listName}`);
}

function mapCatalogItems(value: unknown, listName: string): IActivityOption[] {
  if (!Array.isArray(value)) {
    throw new Error(`La lista "${listName}" devolvió una respuesta inesperada.`);
  }

  const options: IActivityOption[] = [];

  value.forEach((item: unknown, index: number) => {
    if (!isRecord(item)) {
      throw new Error(`La lista "${listName}" devolvió un elemento inválido en la posición ${index + 1}.`);
    }

    if (item.Estado !== 'Activo') {
      return;
    }

    if (typeof item.Id !== 'number' || typeof item.Title !== 'string' || item.Title.trim().length === 0) {
      throw new Error(`La lista "${listName}" tiene un elemento activo sin ID o nombre válido.`);
    }

    const title = item.Title.trim();
    options.push({ key: title, text: title });
  });

  return options;
}

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function validateActivity(activity: IActivityDraft): void {
  if (!isValidDateOnly(activity.date)) {
    throw new Error('La fecha de la actividad no tiene un formato válido.');
  }
  if (activity.date > getLimaDateOnly()) {
    throw new Error('La fecha de la actividad no puede ser futura.');
  }

  if (!activity.responsibleUser.trim()) {
    throw new Error('No se pudo identificar al usuario que registra la actividad.');
  }

  if (!activity.process.trim() || !activity.project.trim()) {
    throw new Error('Selecciona un proceso y un proyecto antes de guardar.');
  }

  if (!activity.hu.trim() || !activity.activity.trim()) {
    throw new Error('Completa el código HU y la descripción de la actividad.');
  }

  if (!Number.isFinite(activity.hours) || activity.hours < 0.25 ||
      Math.abs(activity.hours * 4 - Math.round(activity.hours * 4)) > 1e-8) {
    throw new Error('Las horas deben ser múltiplos de 0,25 y no pueden ser menores que 0,25.');
  }
}

function getDateRangeFilter(date: string): string {
  return getDateRangeFilterForRange(date, date);
}

function getActivitiesDateRangeFilter(from: string, to: string): string {
  if (!isValidDateOnly(from) || !isValidDateOnly(to) || from > to) {
    throw new Error('El rango de fechas para consultar actividades no es válido.');
  }

  return getDateRangeFilterForRange(from, to);
}

function getDateRangeFilterForRange(from: string, to: string): string {
  const startOfDay = getLimaDateStartUtc(from);
  const startOfNextDay = getLimaDateStartUtc(to, 1);
  return `${DATE_FIELD} ge datetime'${startOfDay}' and ${DATE_FIELD} lt datetime'${startOfNextDay}'`;
}

function getActivityIdentifier(item: unknown, index: number): string {
  const id = getActivityId(item);
  if (id !== undefined) {
    return `con ID ${id}`;
  }
  return `en la posición ${index + 1}`;
}

function getActivityId(item: unknown): number | undefined {
  if (!isRecord(item)) {
    return undefined;
  }

  for (const value of [item[ID_FIELD], item[ID_SELECT_FIELD], item.id]) {
    if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) {
      return value;
    }

    if (typeof value === 'string' && /^[1-9]\d*$/.test(value.trim())) {
      const parsed = Number(value.trim());
      if (Number.isSafeInteger(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function getActivityIdDiagnostic(item: IRecord): string {
  const typeOf = (key: string): string => {
    if (!Object.prototype.hasOwnProperty.call(item, key)) {
      return 'ausente';
    }
    const value = item[key];
    return value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
  };
  const keys = Object.keys(item).sort().join(', ') || 'ninguna';
  return ` Valores recibidos: ID (${typeOf(ID_FIELD)}), Id (${typeOf(ID_SELECT_FIELD)}), id (${typeOf('id')}). Claves del elemento: ${keys}.`;
}

function getActivityFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    [ID_FIELD]: 'ID de SharePoint',
    [PROCESS_FIELD]: 'Proceso',
    [PROJECT_FIELD]: 'Proyecto',
    [MODULE_FIELD]: 'Módulo',
    [HU_FIELD]: 'HU',
    [ACTIVITY_FIELD]: 'Actividad',
    [DATE_FIELD]: 'Fecha',
    [RESOURCE_FIELD]: 'Responsable',
    [HOURS_FIELD]: 'Horas'
  };
  return labels[field] ? `"${field}" (${labels[field]})` : `"${field}"`;
}

function getInvalidActivityError(item: unknown, index: number, field?: string): Error {
  const identifier = getActivityIdentifier(item, index);
  const detail = field ? ` en el campo ${getActivityFieldLabel(field)}` : '';
  const diagnostic = field === ID_FIELD && isRecord(item) ? getActivityIdDiagnostic(item) : '';
  return new Error(`La actividad ${identifier} tiene datos inválidos${detail}.${diagnostic}`);
}

function getRequiredActivityString(item: IRecord, field: string, index: number): string {
  const value = item[field];
  if (typeof value !== 'string') {
    throw getInvalidActivityError(item, index, field);
  }
  return value;
}

function mapActivityItems(value: unknown, indexOffset: number = 0): IActivityRecord[] {
  if (!Array.isArray(value)) {
    throw new Error('La lista de actividades devolvió una respuesta inesperada.');
  }

  return value.map((item: unknown, index: number) => {
    const itemIndex = index + indexOffset;
    if (!isRecord(item)) {
      throw getInvalidActivityError(item, itemIndex);
    }

    const id = getActivityId(item);
    if (id === undefined) {
      throw getInvalidActivityError(item, itemIndex, ID_FIELD);
    }

    const responsibleUser = getRequiredActivityString(item, RESOURCE_FIELD, itemIndex);
    const activity = getRequiredActivityString(item, ACTIVITY_FIELD, itemIndex);
    const process = getRequiredActivityString(item, PROCESS_FIELD, itemIndex);
    const project = getRequiredActivityString(item, PROJECT_FIELD, itemIndex);
    const hu = getRequiredActivityString(item, HU_FIELD, itemIndex);
    const dateValue = getRequiredActivityString(item, DATE_FIELD, itemIndex);
    const hours = item[HOURS_FIELD];
    if (typeof hours !== 'number' ||
        !Number.isFinite(hours) ||
        hours < 0.25 ||
        Math.abs(hours * 4 - Math.round(hours * 4)) > 1e-8) {
      throw getInvalidActivityError(item, itemIndex, HOURS_FIELD);
    }

    const activityDate = new Date(dateValue);
    if (Number.isNaN(activityDate.getTime())) {
      throw getInvalidActivityError(item, itemIndex, DATE_FIELD);
    }

    const moduleValue = item[MODULE_FIELD];
    return {
      id,
      date: getLimaDateOnly(activityDate),
      responsibleUser,
      activity,
      process,
      project,
      module: typeof moduleValue === 'string' ? moduleValue : '',
      hu,
      hours
    };
  });
}

function mapTeamActivityItem(value: unknown, index: number): ITeamActivityRecord {
  const activity = mapActivityItems([value], index)[0];
  if (!isRecord(value) || !isRecord(value.Author) || typeof value.Author.Id !== 'number' ||
      typeof value.Author.Title !== 'string' || !value.Author.Title.trim()) {
    throw new Error(`No se pudo identificar al autor de la actividad ${getActivityIdentifier(value, index)}.`);
  }

  return {
    ...activity,
    authorId: value.Author.Id,
    authorName: value.Author.Title.trim(),
    authorEmail: typeof value.Author.EMail === 'string' ? value.Author.EMail : undefined
  };
}

function createActivityPayload(activity: IActivityDraft): Record<string, string | number> {
  const payload: Record<string, string | number> = {
    [PROCESS_FIELD]: activity.process.trim(),
    [PROJECT_FIELD]: activity.project.trim(),
    [MODULE_FIELD]: activity.module ? activity.module.trim() : '',
    [HU_FIELD]: activity.hu.trim(),
    [ACTIVITY_FIELD]: activity.activity.trim(),
    [DATE_FIELD]: getLimaDateStartUtc(activity.date),
    [RESOURCE_FIELD]: activity.responsibleUser.trim(),
    [HOURS_FIELD]: activity.hours
  };

  return payload;
}

export function getActivityListPath(siteUrl: string): string {
  return getActivityListServerRelativeUrl(siteUrl);
}

export class ActivityService implements IActivityService {
  public constructor(private readonly _sp: SPFI, private readonly _siteUrl: string) {}

  public async getCatalogs(): Promise<IActivityCatalogs> {
    const processList = this._sp.web.getList(getCatalogListServerRelativeUrl(this._siteUrl, PROCESSES_LIST));
    const projectList = this._sp.web.getList(getCatalogListServerRelativeUrl(this._siteUrl, PROJECTS_LIST));

    const [processItems, projectItems]: [unknown, unknown] = await Promise.all([
      processList.items.select('Id', 'Title', 'Estado').filter("Estado eq 'Activo'").orderBy('Title', true).top(5000)(),
      projectList.items.select('Id', 'Title', 'Estado').filter("Estado eq 'Activo'").orderBy('Title', true).top(5000)()
    ]);

    return {
      processes: mapCatalogItems(processItems, PROCESSES_LIST),
      projects: mapCatalogItems(projectItems, PROJECTS_LIST)
    };
  }

  public async getActivities(resource: string, from: string, to: string): Promise<IActivityRecord[]> {
    const normalizedResource = resource.trim();
    if (!normalizedResource) {
      throw new Error('No se pudo identificar al usuario para consultar sus actividades.');
    }

    const escapedResource = escapeODataString(normalizedResource);
    const filter = `${RESOURCE_FIELD} eq '${escapedResource}' and ${getActivitiesDateRangeFilter(from, to)}`;
    const list = this._sp.web.getList(getActivityListServerRelativeUrl(this._siteUrl));
    const items: unknown = await list.items
      .select(ID_SELECT_FIELD, PROCESS_FIELD, PROJECT_FIELD, MODULE_FIELD, HU_FIELD, ACTIVITY_FIELD, DATE_FIELD, RESOURCE_FIELD, HOURS_FIELD)
      .filter(filter)
      .orderBy(DATE_FIELD, true)
      .top(5000)();

    return mapActivityItems(items);
  }

  public async getTeamActivities(from: string, to: string): Promise<ITeamActivityRecord[]> {
    const filter = getActivitiesDateRangeFilter(from, to);
    const list = this._sp.web.getList(getActivityListServerRelativeUrl(this._siteUrl));
    const query = list.items
      .select(ID_SELECT_FIELD, PROCESS_FIELD, PROJECT_FIELD, MODULE_FIELD, HU_FIELD, ACTIVITY_FIELD, DATE_FIELD,
        RESOURCE_FIELD, HOURS_FIELD, 'Author/Id', 'Author/Title', 'Author/EMail')
      .expand('Author')
      .filter(filter)
      .orderBy(DATE_FIELD, true)
      .top(5000);
    const records: ITeamActivityRecord[] = [];

    for await (const page of query) {
      if (!Array.isArray(page)) {
        throw new Error('La lista de actividades devolvió una página con formato inesperado.');
      }

      page.forEach((item: unknown) => {
        records.push(mapTeamActivityItem(item, records.length));
      });
    }

    return records;
  }

  public async getDailyHours(resource: string, date: string): Promise<number> {
    const normalizedResource = resource.trim();
    if (!normalizedResource) {
      throw new Error('No se pudo identificar al usuario para consultar su jornada.');
    }

    const escapedResource = escapeODataString(normalizedResource);
    const dateFilter = getDateRangeFilter(date);
    const filter = `${RESOURCE_FIELD} eq '${escapedResource}' and ${dateFilter}`;
    const list = this._sp.web.getList(getActivityListServerRelativeUrl(this._siteUrl));
    const items: unknown = await list.items.select(HOURS_FIELD).filter(filter).top(5000)();

    if (!Array.isArray(items)) {
      throw new Error('La lista de actividades devolvió una respuesta inesperada al consultar las horas.');
    }

    return items.reduce((total: number, item: unknown, index: number) => {
      if (!isRecord(item) || typeof item[HOURS_FIELD] !== 'number' ||
          !Number.isFinite(item[HOURS_FIELD]) || item[HOURS_FIELD] < 0) {
        throw new Error(`La actividad ${index + 1} tiene un valor de horas inválido.`);
      }

      return total + item[HOURS_FIELD];
    }, 0);
  }

  public async createActivity(activity: IActivityDraft): Promise<void> {
    validateActivity(activity);
    const list = this._sp.web.getList(getActivityListServerRelativeUrl(this._siteUrl));
    await list.items.add(createActivityPayload(activity));
  }

  public async updateActivity(id: number, activity: IActivityDraft): Promise<void> {
    validateActivity(activity);
    const list = this._sp.web.getList(getActivityListServerRelativeUrl(this._siteUrl));
    await this._assertActivityOwner(list, id, activity.responsibleUser);
    await list.items.getById(id).update(createActivityPayload(activity));
  }

  public async deleteActivity(id: number, resource: string): Promise<void> {
    const list = this._sp.web.getList(getActivityListServerRelativeUrl(this._siteUrl));
    await this._assertActivityOwner(list, id, resource);
    await list.items.getById(id).delete();
  }

  private async _assertActivityOwner(list: ReturnType<SPFI['web']['getList']>, id: number, resource: string): Promise<void> {
    if (!Number.isInteger(id) || id < 1 || !resource.trim()) {
      throw new Error('No se pudo validar la actividad seleccionada.');
    }

    const item: unknown = await list.items.getById(id).select(RESOURCE_FIELD)();
    if (!isRecord(item) || item[RESOURCE_FIELD] !== resource.trim()) {
      throw new Error('No se encontró la actividad o no tienes permiso para modificarla.');
    }
  }
}
