export function getServerRelativeListUrl(siteUrl: string, listPath: string): string {
  const sitePath = new URL(siteUrl.trim()).pathname.replace(/\/+$/, '');
  const normalizedListPath = listPath.replace(/^\/+/, '');
  return `${sitePath}/${normalizedListPath}`;
}

export function escapeODataString(value: string): string {
  return value.replace(/'/g, "''");
}
