import { defineConfig } from 'astro/config';

// Sitio 100 % estático. Cambiar `site` por el dominio real de cada cliente.
export default defineConfig({
  site: 'https://plantilla-maestra.pages.dev',
  output: 'static',
});
