// Mapa del sitio para buscadores. Hay una sola página; si se agregan más, se listan aquí.
export function GET({ site }) {
  const base = (site ?? new URL('https://ejemplo.com')).href;
  const cuerpo = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}</loc></url>
</urlset>
`;
  return new Response(cuerpo, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
