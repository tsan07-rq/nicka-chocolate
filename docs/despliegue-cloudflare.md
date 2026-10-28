# Publicar un sitio en Cloudflare Pages

Guía para el desarrollador. Los nombres exactos de los menús de Cloudflare y GitHub pueden cambiar con el tiempo; los pasos y valores son los importantes.

> **Estado:** el build y el login del CMS contra GitHub real aún no se han probado de punta a punta. En el primer despliegue real, sigue la lista de la sección 8 y anota cualquier diferencia aquí.

## 1. Antes de empezar

- Repositorio del cliente en GitHub, creado desde esta plantilla (ver `nuevo-cliente.md`).
- Cuenta de Cloudflare (plan gratuito).
- Haber corrido en tu computador: `npm run validar`, `npm run contraste` y `npm run build` sin errores.

## 2. Conectar el repositorio

En Cloudflare: **Workers & Pages → Create → Pages → Connect to Git** y elige el repositorio del cliente.

| Campo | Valor |
|---|---|
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | (vacío) |

**Versión de Node.** Astro 7 pide Node 22.22.0 o superior. Según la documentación actual de Cloudflare, su versión por defecto (22.16.0) es menor, pero Pages lee el archivo `.nvmrc`, que en esta plantilla dice `22.22.0`. Cloudflare **no** lee el campo `engines` del `package.json`. Si algún día cambias la versión, cámbiala en `.nvmrc`. Alternativa: la variable de entorno `NODE_VERSION`.

La carpeta `functions/` (login del CMS) se despliega sola junto con el sitio.

Al terminar el primer build tendrás una dirección `nombre-del-proyecto.pages.dev`.

## 3. Dominio y HTTPS

1. En el proyecto de Pages: **Custom domains → Set up a domain**.
2. Si el dominio está en Cloudflare, el DNS se configura solo. Si está en otro registrador, Cloudflare te indica el registro CNAME que debes crear allí.
3. El certificado HTTPS se emite automáticamente.
4. El dominio debe estar **registrado a nombre del cliente**.

Elige **una sola dirección oficial** (con o sin `www`) y haz que la otra redirija a ella. El login del CMS solo funciona en la dirección registrada en GitHub (paso 5).

## 4. Datos del sitio en los archivos

Cambia estas líneas con la dirección oficial del cliente (sin barra final en `site`):

| Archivo | Campo |
|---|---|
| `astro.config.mjs` | `site` |
| `public/admin/config.yml` | `repo`, `base_url`, `site_url`, `display_url` |

Las líneas que debes cambiar en `config.yml` están marcadas con `REEMPLAZAR`. `site` alimenta el `robots.txt`, el `sitemap.xml`, la dirección canónica y la foto de vista previa.

## 5. Login del CMS (OAuth App de GitHub)

El CMS guarda los cambios como commits en el repositorio, por eso el cliente inicia sesión con GitHub. Necesitas **una OAuth App por sitio**, porque GitHub admite una sola dirección de retorno por aplicación.

1. En GitHub, con tu cuenta: **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Completa:
   - Application name: por ejemplo, `CMS - Café Ejemplo`.
   - Homepage URL: `https://dominio-oficial.com`
   - Authorization callback URL: `https://dominio-oficial.com/api/callback`
3. Crea la aplicación y genera un **Client secret**. Guarda el Client ID y el secret.
4. En Cloudflare, **Settings → Variables and Secrets** del proyecto de Pages, agrega:

| Variable | Valor | Notas |
|---|---|---|
| `GITHUB_CLIENT_ID` | el Client ID | |
| `GITHUB_CLIENT_SECRET` | el Client secret | Guárdala como *Secret* |
| `GITHUB_SCOPE` | `repo,user` (por defecto) o `public_repo,user` | Ver abajo |
| `ALLOWED_ORIGINS` | opcional | Solo si el CMS corre en más de una dirección, separadas por coma |

5. **Vuelve a desplegar** (Deployments → Retry deployment, o un commit nuevo): las variables se aplican al siguiente despliegue.

**Qué permiso elegir (decisión tuya).** El permiso de un token de GitHub abarca toda la cuenta de quien inicia sesión, no solo un repositorio:

- Repositorio **privado** → `repo,user`. El token del cliente podría actuar sobre cualquier repositorio privado al que su cuenta tenga acceso.
- Repositorio **público** → `public_repo,user`. Es más limitado y suficiente, porque el contenido del sitio ya es público y los secretos viven en Cloudflare, no en el repositorio.

Si el cliente creó su cuenta de GitHub solo para esto, la diferencia es pequeña.

## 6. Dar acceso al cliente

1. En el repositorio: **Settings → Collaborators → Add people**, con su usuario de GitHub y permiso de **escritura**.
2. El cliente acepta la invitación (le llega por correo).
3. Entra a `https://dominio-oficial.com/admin` y autoriza la aplicación la primera vez.

## 7. Formulario de contacto (Web3Forms)

1. En web3forms.com, crea una *access key* con el correo donde el cliente quiere recibir los mensajes.
2. Pégala en `src/content/contacto.json`, en `claveWeb3forms`.
3. El cliente no ve ni edita ese campo en el CMS (está oculto a propósito).
4. Si `claveWeb3forms` y los demás medios de contacto (WhatsApp, teléfono, correo) están vacíos, la sección Contacto desaparece sola.

## 8. Lista de verificación después de publicar

- [ ] El sitio carga por HTTPS en la dirección oficial, en computador y en celular.
- [ ] `/admin` abre el CMS, el login con GitHub funciona y se ven las 8 colecciones: Información del negocio, Menú, Promociones, Galería, Horarios, Testimonios, Datos de contacto y Redes sociales.
- [ ] Cambia un texto desde el CMS y publícalo: aparece un commit nuevo en GitHub y, tras el build, el cambio se ve en el sitio.
- [ ] Sube una foto desde el CMS: queda en `src/assets/uploads/` y se muestra en el sitio.
- [ ] El formulario envía un mensaje de prueba y llega al correo.
- [ ] El botón de WhatsApp abre el chat correcto, con el mensaje escrito.
- [ ] Al compartir el enlace por WhatsApp se ve la vista previa con foto y título.
- [ ] `/robots.txt` y `/sitemap.xml` muestran la dirección oficial, no `ejemplo.com`.
- [ ] El mapa carga y el botón "Abrir en Google Maps" lleva al lugar correcto.

## 9. Si algo falla

- **El build falla.** El sitio publicado no cambia: Cloudflare conserva la última versión que funcionó. Abre el registro del build en Cloudflare. Los errores de contenido empiezan con `[contenido]` e indican archivo y campo. En tu computador, `npm run validar` los detecta antes.
- **El login del CMS falla.** Revisa que la *callback URL* de la OAuth App sea exactamente `https://dominio-oficial.com/api/callback`, que las variables estén guardadas y que hayas vuelto a desplegar después. Si la ventana dice "Falta configurar GITHUB_CLIENT_ID...", la variable no llegó al despliegue.
- **El cliente no puede guardar.** Probablemente no aceptó la invitación al repositorio o no tiene permiso de escritura.
- **El mapa no carga.** El mapa usa la dirección escrita en `contacto.json` sin clave de API. Si Google cambiara ese método, se reemplaza por el código de *Compartir → Insertar un mapa* de Google Maps.
