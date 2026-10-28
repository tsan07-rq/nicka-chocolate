// Resuelve las fotos que el CMS guarda en src/assets/uploads/ para que Astro las optimice.
//
// Decap escribe en el contenido una ruta como "/src/assets/uploads/foto.jpg".
// Aquí se busca el archivo solo por su NOMBRE, así funciona sin importar el prefijo
// de la ruta. Si la ruta es una URL externa (https://...), se devuelve tal cual.

const archivos = import.meta.glob('../assets/uploads/*.{png,jpg,jpeg,webp,avif,gif,svg}', {
  eager: true,
  import: 'default',
});

const porNombre = new Map(
  Object.entries(archivos).map(([ruta, metadatos]) => [
    ruta.split('/').pop().toLowerCase(),
    metadatos,
  ])
);

const avisadas = new Set();

/**
 * @param {string} ruta Valor guardado en el contenido (puede estar vacío).
 * @returns {object|string|null} Metadatos de imagen de Astro, una URL externa o null.
 */
export function resolverImagen(ruta) {
  if (typeof ruta !== 'string' || !ruta.trim()) return null;
  const limpia = ruta.trim();

  if (/^https?:\/\//i.test(limpia)) return limpia;

  const nombre = limpia.split('/').pop().toLowerCase();
  const encontrada = porNombre.get(nombre);

  if (!encontrada && !avisadas.has(nombre)) {
    avisadas.add(nombre);
    console.warn(
      `[imagenes] No se encontró "${nombre}" en src/assets/uploads/. Se muestra la sección sin esa foto.`
    );
  }
  return encontrada ?? null;
}
