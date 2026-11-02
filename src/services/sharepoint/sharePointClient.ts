import { SPFx, spfi, type SPFI } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/lists/web';
import '@pnp/sp/items';
import type { WebPartContext } from '@microsoft/sp-webpart-base';

export function createSharePointClient(context: WebPartContext, webUrl: string): SPFI {
  const parsedWebUrl = new URL(webUrl.trim());
  const currentTenantUrl = new URL(context.pageContext.web.absoluteUrl);

  if (
    parsedWebUrl.protocol !== 'https:' ||
    parsedWebUrl.origin !== currentTenantUrl.origin ||
    parsedWebUrl.search.length > 0 ||
    parsedWebUrl.hash.length > 0
  ) {
    throw new Error('El sitio SharePoint debe usar HTTPS y pertenecer al mismo tenant.');
  }

  const siteWebUrl = `${parsedWebUrl.origin}${parsedWebUrl.pathname.replace(/\/+$/, '')}`;
  return spfi(siteWebUrl).using(SPFx(context));
}
