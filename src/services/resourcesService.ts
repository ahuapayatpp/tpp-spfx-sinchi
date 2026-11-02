import type { SPFI } from '@pnp/sp';
import { getServerRelativeListUrl } from './sharePointUrl';

const RESOURCES_LIST_RELATIVE_URL: string = 'Lists/tppsinchi_recursos';
const RESOURCE_NAME_FIELD: string = 'Title';
const RESOURCE_URL_FIELD: string = 'url';
const RESOURCE_DESCRIPTION_FIELD: string = 'descripcion';
const RESOURCE_CATEGORY_FIELD: string = 'categoria';

export interface IResource {
  id: number;
  name: string;
  url: string;
  description?: string;
  category: string;
}

export interface IResourcesService {
  getResources(): Promise<IResource[]>;
}

export function getResourcesListServerRelativeUrl(siteUrl: string): string {
  return getServerRelativeListUrl(siteUrl, RESOURCES_LIST_RELATIVE_URL);
}

type IRecord = Record<string, unknown>;

function isRecord(value: unknown): value is IRecord {
  return typeof value === 'object' && value !== null;
}

function getRequiredText(value: unknown, fieldName: string, itemId: number): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`El elemento ${itemId} no tiene un valor válido en el campo "${fieldName}".`);
  }

  return value.trim();
}

function getOptionalText(value: unknown, fieldName: string, itemId: number): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new Error(`El elemento ${itemId} tiene un valor no válido en el campo "${fieldName}".`);
  }

  const text = value.trim();
  return text.length > 0 ? text : undefined;
}

function getResourceUrl(value: unknown, itemId: number): string {
  let urlValue: unknown = value;

  if (isRecord(value) && 'Url' in value) {
    urlValue = value.Url;
  }

  if (typeof urlValue !== 'string' || urlValue.trim().length === 0) {
    throw new Error(`El elemento ${itemId} no tiene un vínculo válido en el campo "URL".`);
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlValue.trim());
  } catch {
    throw new Error(`El elemento ${itemId} tiene un vínculo inválido en el campo "URL".`);
  }

  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    throw new Error(`El elemento ${itemId} tiene un protocolo no permitido en el campo "URL".`);
  }

  return parsedUrl.toString();
}

function mapResource(value: unknown): IResource {
  if (!isRecord(value)) {
    throw new Error('SharePoint devolvió un recurso con un formato inesperado.');
  }

  const itemId = value.Id;
  if (typeof itemId !== 'number') {
    throw new Error('SharePoint devolvió un recurso sin un identificador válido.');
  }

  return {
    id: itemId,
    name: getRequiredText(value[RESOURCE_NAME_FIELD], 'Título', itemId),
    url: getResourceUrl(value[RESOURCE_URL_FIELD], itemId),
    description: getOptionalText(value[RESOURCE_DESCRIPTION_FIELD], 'descripcion', itemId),
    category: getRequiredText(value[RESOURCE_CATEGORY_FIELD], 'categoria', itemId)
  };
}

export class ResourcesService implements IResourcesService {
  public constructor(private readonly _sp: SPFI, private readonly _listServerRelativeUrl: string) {}

  public async getResources(): Promise<IResource[]> {
    const list = this._sp.web.getList(this._listServerRelativeUrl);
    const items: unknown = await list.items
      .select(
        'Id',
        RESOURCE_NAME_FIELD,
        RESOURCE_URL_FIELD,
        RESOURCE_DESCRIPTION_FIELD,
        RESOURCE_CATEGORY_FIELD
      )
      .orderBy(RESOURCE_NAME_FIELD, true)
      .top(5000)();

    if (!Array.isArray(items)) {
      throw new Error('La lista de recursos devolvió una respuesta inesperada.');
    }

    return items.map(mapResource);
  }
}
