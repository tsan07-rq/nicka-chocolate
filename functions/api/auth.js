// Inicio de sesión con GitHub para el CMS (Decap). Cloudflare Pages Functions: GET /api/auth
//
// Decap abre esta dirección en una ventana emergente. Aquí se guarda un "state" aleatorio
// en una cookie y se manda a la persona a GitHub para que autorice. GitHub la devuelve a
// /api/callback, que comprueba ese mismo state (protección contra peticiones falsificadas).
//
// Variables de entorno (Cloudflare Pages > Settings > Variables and Secrets):
//   GITHUB_CLIENT_ID       Client ID de la OAuth App de GitHub
//   GITHUB_CLIENT_SECRET   Client Secret (guardar como Secret)
//   GITHUB_SCOPE           Opcional. Por defecto "repo,user" (repositorios privados).
//                          Para un repositorio público basta "public_repo,user".

function paginaError(mensaje, estado) {
  const html = `<!doctype html><html lang="es"><meta charset="utf-8"><title>No se pudo iniciar sesión</title>
<body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem">
<h1>No se pudo iniciar sesión</h1><p>${mensaje}</p></body></html>`;
  return new Response(html, {
    status: estado,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export async function onRequestGet({ request, env }) {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return paginaError(
      'Falta configurar GITHUB_CLIENT_ID y GITHUB_CLIENT_SECRET en Cloudflare Pages.',
      500
    );
  }

  const url = new URL(request.url);

  const aleatorio = crypto.getRandomValues(new Uint8Array(16));
  const state = [...aleatorio].map((byte) => byte.toString(16).padStart(2, '0')).join('');

  // El permiso se decide aquí, no con lo que pida el navegador.
  const scope = env.GITHUB_SCOPE || 'repo,user';

  const destino = new URL('https://github.com/login/oauth/authorize');
  destino.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  destino.searchParams.set('redirect_uri', `${url.origin}/api/callback`);
  destino.searchParams.set('scope', scope);
  destino.searchParams.set('state', state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: destino.href,
      'Set-Cookie': `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=600`,
      'Cache-Control': 'no-store',
    },
  });
}
