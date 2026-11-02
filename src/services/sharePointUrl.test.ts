import { escapeODataString, getServerRelativeListUrl } from './sharePointUrl';

describe('SharePoint URL helpers', () => {
  it('normalizes the web URL and list path', () => {
    expect(getServerRelativeListUrl(
      'https://tpperuanos.sharepoint.com/sites/SDC-Aplicaciones/',
      '/Lists/tppsinchi_recursos'
    )).toBe('/sites/SDC-Aplicaciones/Lists/tppsinchi_recursos');
  });

  it('escapes apostrophes in OData string values', () => {
    expect(escapeODataString("O'Connor")).toBe("O''Connor");
  });
});
