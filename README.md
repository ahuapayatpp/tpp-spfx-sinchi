# tpp-spfx-sinchi

## Summary

Short summary on functionality and used technologies.

[picture of the solution in action, if possible]

## Used SharePoint Framework Version

![version](https://img.shields.io/badge/version-1.23.2-green.svg)

## Recursos de SharePoint

La sección **Recursos** consulta mediante PnPjs la lista en `/sites/SDC-Aplicaciones/Lists/tppsinchi_recursos`. El URL del web que contiene la lista se configura en las propiedades de la web part y tiene como valor inicial `https://tpperuanos.sharepoint.com/sites/SDC-Aplicaciones`. La lista debe incluir estas columnas:

| Columna en SharePoint | Nombre usado por la consulta | Tipo | Uso |
| --- | --- | --- | --- |
| `Título` | `Title` | Una línea de texto | Nombre mostrado |
| `url` | `url` | Hipervínculo | Destino del enlace |
| `descripcion` | `descripcion` | Varias líneas de texto | Tooltip al pasar el cursor o enfocar el recurso |
| `categoria` | `categoria` | Opción | Grupo bajo el que se muestra el recurso |

La consulta selecciona estos campos y ordena por `Title`. La descripción completa aparece en un tooltip Fluent UI al pasar el cursor o enfocar el vínculo con teclado; si está vacía, no se muestra tooltip.

La web part muestra estados de carga, error con opción de reintento y lista vacía. El indicador está encapsulado en el componente reutilizable `LoadingState` (etiqueta accesible, tamaño opcional y clase CSS personalizable). La persona que la usa necesita permisos de lectura en la lista.

## Applies to

- [SharePoint Framework](https://aka.ms/spfx)
- [Microsoft 365 tenant](https://docs.microsoft.com/sharepoint/dev/spfx/set-up-your-developer-tenant)

> Get your own free development tenant by subscribing to [Microsoft 365 developer program](http://aka.ms/o365devprogram)

## Prerequisites

> Any special pre-requisites?

## Solution

| Solution    | Author(s)                                               |
| ----------- | ------------------------------------------------------- |
| folder name | Author details (name, company, twitter alias with link) |

## Version history

| Version | Date             | Comments        |
| ------- | ---------------- | --------------- |
| 1.1     | March 10, 2021   | Update comment  |
| 1.0     | January 29, 2021 | Initial release |

## Disclaimer

**THIS CODE IS PROVIDED _AS IS_ WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABILITY, OR NON-INFRINGEMENT.**

---

## Minimal Path to Awesome

- Clone this repository
- Ensure that you are at the solution folder
- in the command-line run:
  - `npm install -g @rushstack/heft`
  - `npm install`
  - `heft start`

> Include any additional steps as needed.

Other build commands can be listed using `heft --help`.

## Features

Description of the extension that expands upon high-level summary above.

This extension illustrates the following concepts:

- topic 1
- topic 2
- topic 3

> Notice that better pictures and documentation will increase the sample usage and the value you are providing for others. Thanks for your submissions advance.

> Share your web part with others through Microsoft 365 Patterns and Practices program to get visibility and exposure. More details on the community, open-source projects and other activities from http://aka.ms/m365pnp.

## References

- [Getting started with SharePoint Framework](https://docs.microsoft.com/sharepoint/dev/spfx/set-up-your-developer-tenant)
- [Building for Microsoft teams](https://docs.microsoft.com/sharepoint/dev/spfx/build-for-teams-overview)
- [Use Microsoft Graph in your solution](https://docs.microsoft.com/sharepoint/dev/spfx/web-parts/get-started/using-microsoft-graph-apis)
- [Publish SharePoint Framework applications to the Marketplace](https://docs.microsoft.com/sharepoint/dev/spfx/publish-to-marketplace-overview)
- [Microsoft 365 Patterns and Practices](https://aka.ms/m365pnp) - Guidance, tooling, samples and open-source controls for your Microsoft 365 development
- [Heft Documentation](https://heft.rushstack.io/)