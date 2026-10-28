# Plantilla maestra para cafeterías

Página web informativa, estática y rápida (Astro) con un panel para que el dueño edite su contenido (Decap CMS), publicada en Cloudflare Pages. Pensada para adaptarse en poco tiempo a la marca de cada negocio.

## Cómo está organizado

```
perfiles/cafeteria/marca.css   Identidad de marca: colores, tipografías, esquinas. Lo primero que se cambia por cliente.
src/config/secciones.js        Qué secciones tiene la página, en qué orden y cuáles salen en el menú.
src/content/                   Lo único que edita el cliente desde el CMS (textos, menú, horarios, fotos...).
src/assets/uploads/            Fotos del cliente. Astro las optimiza al publicar.
src/components/ y src/styles/  Componentes y estilos, compartidos por todos los perfiles.
public/admin/                  El panel del cliente (Decap CMS) y su configuración.
functions/api/                 Login del CMS con GitHub (Cloudflare Pages Functions).
scripts/                       Herramientas de verificación (ver abajo).
docs/                          Guías: despliegue, cliente nuevo, manual de marca y guía para el cliente.
```

Hoy `perfiles/cafeteria/` solo guarda la marca. Cuando exista un segundo perfil (restaurante o panadería), las secciones y el contenido de ejemplo se moverán ahí.

## Requisitos

- Node.js **22.22 o superior** (solo versiones pares: 22, 24...). Es el requisito de Astro 7. El archivo `.nvmrc` fija `22.22.0`, que es el que lee Cloudflare Pages.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm install` | Instala las dependencias |
| `npm run dev` | Vista local en `http://localhost:4321` |
| `npm run build` | Genera el sitio en `dist/` |
| `npm run validar` | Revisa que el contenido esté completo y que el CMS pueda editar cada dato |
| `npm run contraste` | Revisa que los colores de la marca se lean bien (WCAG AA) |
| `node scripts/verificar-rama.mjs [rama]` | Descarga una rama, instala, compila y guarda un registro en `verificacion.log` |

## Documentación

- [`docs/nuevo-cliente.md`](docs/nuevo-cliente.md): pasos desde que el cliente acepta hasta la entrega.
- [`docs/manual-de-marca.md`](docs/manual-de-marca.md): qué pedir al cliente y cómo aplicarlo en `marca.css`.
- [`docs/despliegue-cloudflare.md`](docs/despliegue-cloudflare.md): Cloudflare Pages, dominio, login del CMS y lista de verificación.
- [`docs/guia-cliente.md`](docs/guia-cliente.md): guía sencilla para el dueño del negocio.

## Flujo de trabajo con Git

- `main` siempre debe compilar: Cloudflare Pages publica lo que haya ahí.
- Los cambios se hacen en ramas y se fusionan a `main` solo cuando `npm run build` funciona en un computador real.
- Cada cliente nuevo se crea como un repositorio independiente a partir de esta plantilla (*Template repository*). Las mejoras de la plantilla no cambian los sitios ya entregados.

## Estado y pendientes

- El contenido y la página se probaron en un navegador sin interfaz con el CSS y JavaScript reales. El **build de Astro** y el **login real del CMS contra GitHub** deben comprobarse en el primer despliegue.
- No incluido todavía: perfiles de restaurante y panadería, segunda lengua (inglés), boletín de correo y el script para crear un cliente nuevo con un comando (se escribirá cuando exista el segundo perfil).
- La vista previa dentro del CMS está desactivada a propósito, para mantener el panel simple.
