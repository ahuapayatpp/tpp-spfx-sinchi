# tpp-spfx-sinchi

## Summary

Short summary on functionality and used technologies.

[picture of the solution in action, if possible]

## Organización del código

- `src/services/sharepoint`: cliente y utilidades comunes para SharePoint.
- `src/services/activities`, `src/services/resources`, `src/services/access` y `src/services/collaborators`: acceso a datos y fábricas de servicios por dominio.
- `src/webparts/tppSinchi/components`: shell de la aplicación y propiedades de la web part.
- `src/webparts/tppSinchi/features`: páginas, componentes, modelos y utilidades específicos de cada funcionalidad.
- `src/webparts/tppSinchi/shared`: componentes y tipos reutilizables entre funcionalidades.
- `src/webparts/tppSinchi/styles` y `loc`: estilos y localización de la web part.

Las pruebas se mantienen junto a la unidad que validan.

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

## Roles y revisión de actividades

La web part distingue **usuarios comunes** y **administradores** usando la pertenencia al grupo de SharePoint configurado en `adminGroupName` (inicialmente `TPP Sinchi Administradores`). Los administradores conservan la pestaña **Administración** y, además, al abrir **Actividades** ven la revisión del equipo. Los usuarios comunes continúan viendo **Mis actividades**.

La lista de personas que se revisa se obtiene de los miembros del grupo de Microsoft 365 asociado al sitio SharePoint, que corresponde a los **Miembros** del sitio. Los indicadores incluyen sus miembros aunque no hayan registrado actividades. Las actividades se asocian a esas personas por correo electrónico/UPN; el GUID de Graph no se confunde con el ID numérico del usuario en SharePoint. Si hay registros de personas que no pertenecen al grupo, se muestran identificadas como externas. Si no se puede consultar el grupo, se avisa que los indicadores son parciales y se omiten los conteos de ausencias.

La solución solicita el permiso delegado de Microsoft Graph `GroupMember.ReadBasic.All` para listar los miembros básicos del grupo. Después de publicar el paquete, un administrador debe aprobar esta solicitud en el Centro de administración de SharePoint, en **Más características > API access**. Hasta que se conceda el consentimiento, la lista de personas no estará disponible y la revisión mostrará el aviso de información parcial.

La revisión del equipo es de solo lectura y ofrece vistas de día y mes, búsqueda, filtros, detalle por persona y exportación CSV compatible con Excel. En esta fase solo sábados y domingos se consideran no laborables; no se aplica un calendario de feriados.

> **Importante:** el rol de la app controla qué interfaz se muestra, pero no sustituye los permisos de SharePoint. La privacidad de “cada usuario ve solo sus actividades” requiere permisos por elemento y se implementará en una fase posterior.

## Probar la app en Microsoft Teams

La app Teams se genera desde `teams/manifest.json` y los íconos de `teams/`. Para probarla:

1. Ejecuta `npm run build`. El paquete SPFx se genera en `sharepoint/solution/tpp-spfx-sinchi.sppkg`.
2. Despliega el `.sppkg` en el catálogo de aplicaciones de SharePoint y habilítalo para toda la organización. El web part y sus recursos deben estar desplegados en SharePoint antes de abrir la app en Teams.
3. Carga `teams/TeamsSPFxApp.zip` en Teams mediante **Aplicaciones > Administrar tus aplicaciones > Cargar una aplicación personalizada** (o la opción de carga disponible en tu organización). La carga de aplicaciones personalizadas debe estar habilitada por la política del tenant.

El paquete Teams es una app personal de Teams, no un sitio autónomo: Teams carga el web part SPFx alojado en SharePoint. Para la prueba, la revisión del equipo puede mostrar información parcial hasta que un administrador apruebe `GroupMember.ReadBasic.All` en **Centro de administración de SharePoint > Más características > API access**. Los datos de SharePoint también requieren que quien prueba tenga acceso a las listas utilizadas.

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
