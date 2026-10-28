// Lectura y validación del contenido editable (src/content/).
//
// El cliente edita estos archivos desde el CMS. Aquí se leen, se rellenan los valores
// que falten y se detienen el build con un mensaje claro si algo esencial está mal.
// Un build fallido NO afecta al sitio publicado: Cloudflare conserva la versión anterior.

import { secciones } from '../config/secciones.js';
import negocioCrudo from '../content/negocio.json';
import contactoCrudo from '../content/contacto.json';
import redesCrudo from '../content/redes.json';
import horariosCrudo from '../content/horarios.json';
import galeriaCrudo from '../content/galeria.json';

const archivosMenu = import.meta.glob('../content/menu/*.json', { eager: true, import: 'default' });
const archivosPromociones = import.meta.glob('../content/promociones/*.json', {
  eager: true,
  import: 'default',
});
const archivosTestimonios = import.meta.glob('../content/testimonios/*.json', {
  eager: true,
  import: 'default',
});

/* ---------- utilidades ---------- */

function fallo(archivo, mensaje) {
  throw new Error(`[contenido] ${archivo}: ${mensaje}`);
}

const texto = (valor) => (typeof valor === 'string' ? valor.trim() : '');
const lista = (valor) => (Array.isArray(valor) ? valor : []);
const objeto = (valor) => (valor && typeof valor === 'object' && !Array.isArray(valor) ? valor : {});
const numeroOpcional = (valor) => {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
};
const nombreArchivo = (ruta) => ruta.split('/').pop();

function boton(crudo) {
  const b = objeto(crudo);
  const textoBoton = texto(b.texto);
  const enlace = texto(b.enlace);
  return textoBoton && enlace ? { texto: textoBoton, enlace } : null;
}

/* ---------- negocio ---------- */

const n = objeto(negocioCrudo);
const textos = objeto(n.textos);

export const negocio = {
  nombre: texto(n.nombre) || fallo('negocio.json', 'falta el nombre del negocio ("nombre")'),
  descripcion: texto(n.descripcion),
  logo: texto(n.logo),
  imagenCompartir: texto(n.imagenCompartir),
  moneda: texto(n.moneda) || 'USD',
  localePrecios: texto(n.localePrecios) || 'en-US',
  hero: {
    titulo: texto(objeto(n.hero).titulo) || fallo('negocio.json', 'falta el título principal ("hero.titulo")'),
    subtitulo: texto(objeto(n.hero).subtitulo),
    imagen: texto(objeto(n.hero).imagen),
    botonPrincipal: boton(objeto(n.hero).botonPrincipal),
    botonSecundario: boton(objeto(n.hero).botonSecundario),
  },
  historia: {
    titulo: texto(objeto(n.historia).titulo) || 'Nuestra historia',
    texto: texto(objeto(n.historia).texto),
    imagen: texto(objeto(n.historia).imagen),
  },
  textos: {
    menu: {
      titulo: texto(objeto(textos.menu).titulo) || 'Nuestro menú',
      intro: texto(objeto(textos.menu).intro),
    },
    promociones: { titulo: texto(objeto(textos.promociones).titulo) || 'Promociones' },
    testimonios: { titulo: texto(objeto(textos.testimonios).titulo) || 'Lo que dicen nuestros clientes' },
    ubicacion: { titulo: texto(objeto(textos.ubicacion).titulo) || 'Visítanos' },
    contacto: {
      titulo: texto(objeto(textos.contacto).titulo) || 'Escríbenos',
      texto: texto(objeto(textos.contacto).texto),
    },
  },
};

/* ---------- contacto, redes, horarios, galería ---------- */

const c = objeto(contactoCrudo);

export const contacto = {
  whatsapp: texto(c.whatsapp).replace(/\D/g, ''), // solo dígitos, con código de país
  mensajeWhatsapp: texto(c.mensajeWhatsapp) || 'Hola, quisiera hacer una consulta.',
  telefono: texto(c.telefono),
  correo: texto(c.correo),
  direccion: texto(c.direccion),
  referencia: texto(c.referencia),
  mapa: texto(c.mapa),
  claveWeb3forms: texto(c.claveWeb3forms),
};

export function enlaceWhatsApp(mensaje = contacto.mensajeWhatsapp) {
  if (!contacto.whatsapp) return '';
  return `https://wa.me/${contacto.whatsapp}?text=${encodeURIComponent(mensaje)}`;
}

export function enlaceTelefono() {
  const digitos = contacto.telefono.replace(/[^\d+]/g, '');
  return digitos ? `tel:${digitos}` : '';
}

export function enlaceMapa() {
  if (contacto.mapa) return contacto.mapa;
  if (!contacto.direccion) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contacto.direccion)}`;
}

export function mapaIncrustado() {
  if (!contacto.direccion) return '';
  return `https://www.google.com/maps?q=${encodeURIComponent(contacto.direccion)}&output=embed`;
}

const r = objeto(redesCrudo);

// Acepta una URL completa o solo el usuario (con o sin @).
function urlRed(valor, base) {
  const v = texto(valor);
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  return base + v.replace(/^@/, '');
}

export const redes = [
  { nombre: 'Instagram', url: urlRed(r.instagram, 'https://www.instagram.com/') },
  { nombre: 'Facebook', url: urlRed(r.facebook, 'https://www.facebook.com/') },
  { nombre: 'TikTok', url: urlRed(r.tiktok, 'https://www.tiktok.com/@') },
].filter((red) => red.url);

const h = objeto(horariosCrudo);

export const horarios = {
  titulo: texto(h.titulo) || 'Horarios',
  filas: lista(h.filas)
    .map((fila) => ({ dias: texto(objeto(fila).dias), horas: texto(objeto(fila).horas) }))
    .filter((fila) => fila.dias && fila.horas),
  nota: texto(h.nota),
};

const g = objeto(galeriaCrudo);

export const galeria = {
  titulo: texto(g.titulo) || 'Galería',
  intro: texto(g.intro),
  fotos: lista(g.fotos)
    .map((foto) => ({ imagen: texto(objeto(foto).imagen), descripcion: texto(objeto(foto).descripcion) }))
    .filter((foto) => foto.imagen),
};

/* ---------- colecciones (una carpeta, un archivo por elemento) ---------- */

const porOrden = (a, b) => a.orden - b.orden || a.titulo.localeCompare(b.titulo, 'es');

export function getMenu() {
  return Object.entries(archivosMenu)
    .map(([ruta, crudo]) => {
      const archivo = `menu/${nombreArchivo(ruta)}`;
      const categoria = objeto(crudo);
      const nombre = texto(categoria.nombre) || fallo(archivo, 'falta el nombre de la categoría ("nombre")');
      const productos = lista(categoria.productos)
        .map((p, i) => {
          const producto = objeto(p);
          const precio = numeroOpcional(producto.precio);
          if (precio !== null && precio < 0) fallo(archivo, `el precio del producto #${i + 1} es negativo`);
          return {
            nombre: texto(producto.nombre),
            descripcion: texto(producto.descripcion),
            precio,
            imagen: texto(producto.imagen),
            etiqueta: texto(producto.etiqueta),
            visible: producto.visible !== false,
          };
        })
        .filter((p) => p.nombre && p.visible);
      return { titulo: nombre, nombre, orden: numeroOpcional(categoria.orden) ?? 0, productos };
    })
    .filter((categoria) => categoria.productos.length > 0)
    .sort(porOrden);
}

export function getPromociones() {
  return Object.entries(archivosPromociones)
    .map(([, crudo]) => {
      const p = objeto(crudo);
      return {
        titulo: texto(p.titulo),
        descripcion: texto(p.descripcion),
        imagen: texto(p.imagen),
        vigencia: texto(p.vigencia),
        activa: p.activa !== false,
        orden: numeroOpcional(p.orden) ?? 0,
      };
    })
    .filter((p) => p.titulo && p.activa)
    .sort(porOrden);
}

export function getTestimonios() {
  return Object.entries(archivosTestimonios)
    .map(([, crudo]) => {
      const t = objeto(crudo);
      return {
        titulo: texto(t.nombre),
        nombre: texto(t.nombre),
        texto: texto(t.texto),
        detalle: texto(t.detalle),
        orden: numeroOpcional(t.orden) ?? 0,
      };
    })
    .filter((t) => t.nombre && t.texto)
    .sort(porOrden);
}

/* ---------- precios ---------- */

export function formatearPrecio(valor) {
  if (valor === null || valor === undefined) return '';
  return new Intl.NumberFormat(negocio.localePrecios, {
    style: 'currency',
    currency: negocio.moneda,
    currencyDisplay: 'narrowSymbol',
  }).format(valor);
}

/* ---------- secciones visibles ---------- */

// Una sección sin contenido se oculta sola. La lista que usa la barra de navegación
// y la página es esta misma, así que nunca hay enlaces a secciones que no existen.
const tieneContenido = {
  menu: () => getMenu().length > 0,
  promociones: () => getPromociones().length > 0,
  historia: () => Boolean(negocio.historia.texto),
  galeria: () => galeria.fotos.length > 0,
  testimonios: () => getTestimonios().length > 0,
  ubicacion: () => Boolean(contacto.direccion),
  contacto: () =>
    Boolean(contacto.whatsapp || contacto.telefono || contacto.correo || contacto.claveWeb3forms),
};

export function seccionesVisibles() {
  return secciones
    .filter((seccion) => seccion.activa !== false)
    .filter((seccion) => (tieneContenido[seccion.id] ? tieneContenido[seccion.id]() : true));
}
