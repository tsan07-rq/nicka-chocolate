// Regreso de GitHub tras autorizar. Cloudflare Pages Functions: GET /api/callback
//
// Comprueba el "state", cambia el código por un token de acceso y se lo entrega a Decap
// por la ventana emergente (el protocolo "authorizing:github" que Decap espera).
//
// Variables de entorno:
//   GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET   (ver auth.js)
//   ALLOWED_ORIGINS   Opcional. Sitios autorizados a recibir el token, separados por comas
//                     (por ejemplo "https://micafeteria.com,https://www.micafeteria.com").
//                     Por defecto, solo el propio sitio donde corre esta función.

function paginaError(mensaje, estado) {
  const html = `<!doctype html><html lang="es"><meta charset="utf-8"><title>No se pudo iniciar sesión</title>
<body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem">
<h1>No se pudo iniciar sesión</h1><p>${mensaje}</p><p>Cierra esta ventana e inténtalo de nuevo.</p></body></html>`;
  return new Response(html, {
    status: estado,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Set-Cookie': 'oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=0',
    },
  });
}

function leerCookie(cabecera, nombre) {
  for (const parte of (cabecera || '').split(';')) {
    const [clave, ...resto] = parte.trim().split('=');
    if (clave === nombre) return resto.join('=');
  }
  return '';
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const codigo = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const guardado = leerCookie(request.headers.get('Cookie'), 'oauth_state');

  if (!codigo || !state || !guardado || state !== guardado) {
    return paginaError('La sesión no es válida o ya caducó.', 400);
  }
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return paginaError('Falta configurar GITHUB_CLIENT_ID y GITHUB_CLIENT_SECRET en Cloudflare Pages.', 500);
  }

  let token;
  try {
    const respuesta = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'decap-cms-oauth',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code: codigo,
        redirect_uri: `${url.origin}/api/callback`,
      }),
    });
    const datos = await respuesta.json();
    token = datos.access_token;
  } catch {
    return paginaError('No se pudo hablar con GitHub.', 502);
  }

  if (!token) {
    return paginaError('GitHub no aceptó el inicio de sesión.', 401);
  }

  const permitidos = (env.ALLOWED_ORIGINS || url.origin)
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean);

  const mensaje = `authorization:github:success:${JSON.stringify({ token, provider: 'github' })}`;

  // Se escapa "<" para que nada pueda cerrar el <script>.
  const seguro = (valor) => JSON.stringify(valor).replace(/</g, '\\u003c');

  const html = `<!doctype html><html lang="es"><meta charset="utf-8"><title>Iniciando sesión…</title>
<body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem">
<p>Iniciando sesión…</p>
<script>
(function () {
  var permitidos = ${seguro(permitidos)};
  var mensaje = ${seguro(mensaje)};
  function recibir(evento) {
    // Solo se entrega el token a un sitio autorizado.
    if (permitidos.indexOf(evento.origin) === -1) return;
    window.opener.postMessage(mensaje, evento.origin);
    window.removeEventListener('message', recibir, false);
  }
  if (!window.opener) { document.body.textContent = 'Cierra esta ventana e inténtalo de nuevo.'; return; }
  window.addEventListener('message', recibir, false);
  window.opener.postMessage('authorizing:github', '*');
})();
</script></body></html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'",
      'Set-Cookie': 'oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=0',
    },
  });
}
