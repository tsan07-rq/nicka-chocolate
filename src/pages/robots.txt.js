// robots.txt con la dirección real del sitio (la que está en `site` de astro.config.mjs).
export function GET({ site }) {
  const base = (site ?? new URL('https://ejemplo.com')).origin;
  const cuerpo = `User-agent: *
Allow: /
Disallow: /admin/

Sitemap: ${base}/sitemap.xml
`;
  return new Response(cuerpo, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
