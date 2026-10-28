# Manual de marca: cómo adaptar la plantilla a un cliente

Toda la identidad visual vive en un solo archivo: `perfiles/<tipo>/marca.css`. No hay que tocar componentes para cambiar de marca.

## Qué pedir al cliente

| Dato | Formato | Para qué se usa |
|---|---|---|
| Logo | SVG o PNG transparente, mínimo 400 px de ancho, **versión clara** | Barra de navegación (se ve sobre el color principal) |
| Color principal | `#rrggbb` | Barra de navegación, títulos, fondo del hero sin foto y pie de página |
| Color de acento | `#rrggbb` | Botones destacados, botón flotante de WhatsApp, anillo de foco |
| Color de fondo | `#rrggbb`, claro | Fondo general de la página |
| Color de texto | `#rrggbb`, oscuro | Texto principal |
| Tipografías | Nombre de la fuente de títulos y de textos | Ver "Tipografías" |
| Estilo de esquinas | Rectas, sobrias, suaves o píldora | Botones y tarjetas |

Si el cliente no tiene manual de marca, arma uno mínimo a partir de su logo: toma el color más característico como principal y uno secundario del logo como acento.

## Los valores en `marca.css`

```css
--marca-principal: #2f3a33;
--marca-secundario: #7a6a53;  /* reservado: hoy ningún componente lo usa */
--marca-acento: #c0933a;
--marca-fondo: #f6f4ef;
--marca-texto: #1f2420;

--fuente-titulos: Georgia, 'Times New Roman', serif;
--fuente-texto: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;

--radio-boton: 2px;
--radio-tarjeta: 4px;
```

Los **tonos derivados** (hover, bordes, fondos alternos, texto de apoyo, acento legible como texto) se calculan solos a partir de estos cinco colores. No los edites, salvo `--marca-acento-texto` si hace falta ajustar el contraste (ver abajo).

Estilos de esquina de referencia para `--radio-boton` y `--radio-tarjeta`:

| Estilo | Botón | Tarjeta |
|---|---|---|
| Recto | `0` | `0` |
| Sobrio (actual) | `2px` | `4px` |
| Suave | `8px` | `12px` |
| Píldora | `999px` | `16px` |

## Comprobar que se lee bien

```
npm run contraste
```

Revisa 12 combinaciones reales (texto sobre fondo, texto claro sobre la barra, texto de los botones, enlaces, bordes de formulario) con el criterio WCAG AA. Si alguna falla, el script dice cuál y con qué colores:

- **Falla el texto claro sobre la barra o el hero:** el color principal es demasiado claro. Oscurécelo.
- **Falla el texto de los botones de acento:** el acento es demasiado oscuro para texto oscuro. Aclara el acento o cambia el color de texto.
- **Fallan los enlaces:** sube el porcentaje de color de texto en `--marca-acento-texto` (por ejemplo, de `60%` a `50%`) para oscurecerlo.

Los colores de marca muy claros o muy saturados suelen fallar. Es mejor ajustarlos un poco que entregar un sitio difícil de leer.

## Tipografías (autoalojadas)

No se usa Google Fonts por CDN: las fuentes se guardan dentro del proyecto para que la página cargue rápido y no dependa de terceros.

1. Consigue los archivos **`.woff2`** de la fuente (regular y, si la usa, negrita). Revisa que la licencia permita uso web. Las fuentes de Google Fonts se pueden descargar y alojar.
2. Colócalos en `public/fuentes/`.
3. En `marca.css`, antes de `:root`, declara cada archivo:

```css
@font-face {
  font-family: 'Nombre de la fuente';
  src: url('/fuentes/nombre-regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

4. Úsala en las variables, dejando una fuente de respaldo:

```css
--fuente-titulos: 'Nombre de la fuente', Georgia, serif;
```

Usa como máximo dos familias y pocos pesos: cada archivo es una descarga más.

## Logo

- Se sube desde el CMS (**Información del negocio → Logo**) o se coloca en `src/assets/uploads/` y se escribe su nombre en `negocio.json`.
- Si el cliente solo tiene logo oscuro, prepara una versión clara (blanca o crema), porque se muestra sobre el color principal.
- Sin logo, la barra muestra el nombre del negocio con la tipografía de títulos.

## Foto de portada y foto para compartir

- **Portada** (`hero.imagen`): foto horizontal y de buena calidad. Sin foto, el hero usa un tono oscuro del color principal.
- **Foto para compartir** (`imagenCompartir`): es la vista previa en WhatsApp y redes. Se recorta sola a 1200 × 630 px, así que el sujeto debe quedar en el centro. Sin ella se usa una imagen de ejemplo: cámbiala siempre (`public/og-default.png`, 1200 × 630).
