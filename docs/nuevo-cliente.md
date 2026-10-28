# Preparar un cliente nuevo

Lista de pasos desde que el cliente acepta hasta que entregas el sitio. Sigue el flujo de trabajo del proyecto (recopilar, personalizar, configurar el CMS, probar, publicar, capacitar, entregar).

## 0. Recopilar del cliente

- Logo: SVG o PNG con fondo transparente, **en versión clara** (se muestra sobre el color principal de la marca).
- Colores de la marca en formato `#rrggbb` y nombres de sus tipografías (ver `manual-de-marca.md`).
- Fotos reales del local, de los productos y del equipo. Una foto propia vale más que cualquier diseño.
- Textos: su historia con sus palabras, descripción del negocio, menú con precios, promociones.
- Horarios, dirección completa, referencia para llegar, WhatsApp, teléfono, correo, Instagram, Facebook, TikTok.
- El correo donde quiere recibir los mensajes del formulario.

## 1. Crear el repositorio

1. Una sola vez, en `plantilla-maestra`: **Settings → marcar "Template repository"**.
2. Para cada cliente: botón **Use this template → Create a new repository**, con un nombre como `cafeteria-nombre-del-negocio`.
3. Visibilidad pública o privada: ver la nota de permisos en `despliegue-cloudflare.md`, sección 5.
4. Clónalo en tu computador y ejecuta `npm install`.

## 2. Marca

Edita `perfiles/cafeteria/marca.css` (guía en `manual-de-marca.md`) y comprueba la legibilidad:

```
npm run contraste
```

## 3. Contenido

Para la carga inicial es más rápido editar los archivos de `src/content/` a mano que usar el CMS. Reemplaza todos los datos de ejemplo.

- Borra las fotos de relleno de `src/assets/uploads/` y agrega las del cliente. Los nombres de archivo van sin espacios ni acentos.
- `negocio.json` también tiene `moneda` y `localePrecios`. Para precios como `$2,50` usa `"es-EC"`; con `"en-US"` salen como `$2.50`.
- Lo que no tenga contenido, se oculta solo: sin promociones activas no hay sección de promociones.

## 4. Secciones según el plan

En `src/config/secciones.js`, pon `activa: false` en las secciones que el cliente no contrató. La portada (Inicio) siempre está. Una **sugerencia** de reparto, que puedes ajustar:

| Plan | Secciones activas además de Inicio |
|---|---|
| Presencia (1 a 3) | Menú, Visítanos (incluye horarios y mapa), Contacto |
| Esencial (4 a 5) | Las anteriores + Galería + Promociones |
| Profesional (6 a 8) | Todas: + Nosotros y Testimonios |

El botón flotante de WhatsApp, los enlaces a redes y el mapa están en todos los planes. Si el cliente pagó el servicio en inglés, aún no existe (ver README, "Pendiente").

## 5. Datos técnicos

- `astro.config.mjs`: `site` con la dirección oficial.
- `public/admin/config.yml`: las 4 líneas marcadas `REEMPLAZAR`.
- `src/content/contacto.json`: la clave de Web3Forms del cliente.

## 6. Comprobar antes de publicar

```
npm run validar     # el contenido está completo y el CMS puede editar cada dato
npm run contraste   # los colores se leen bien
npm run build       # el sitio compila
npm run dev         # míralo en computador y en celular
```

El validador debe quedar **sin avisos**: los avisos que ves en la plantilla (clave de ejemplo, datos de ejemplo) son justo lo que debe desaparecer.

Revisa con el cliente en las **2 rondas de revisión** del acuerdo antes de publicar.

## 7. Publicar y entregar

1. Sube los cambios a `main`.
2. Sigue `despliegue-cloudflare.md`: Cloudflare Pages, dominio a nombre del cliente, OAuth App del CMS e invitación al repositorio.
3. Capacitación: usa `guia-cliente.md`. La guía describe las acciones sin citar el texto exacto de los botones del CMS, porque no se verificaron. En tu primera sesión real, anota cómo se llaman (iniciar sesión, publicar, agregar, subir imagen) y escríbelos en la guía para ese cliente.
4. Entrega accesos y respaldos: el repositorio de GitHub es el respaldo de todo el contenido. Entrega también la guía del cliente y confirma que el dominio, el logo, las fotos y los textos son del cliente.
5. La web se publica únicamente después de recibir el pago total.
