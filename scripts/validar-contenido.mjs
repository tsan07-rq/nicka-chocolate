#!/usr/bin/env node
/**
 * Revisa el contenido antes de publicar. No necesita instalar nada.
 *
 *   npm run validar
 *
 * Comprueba:
 *   1. Que todos los archivos de src/content/ sean JSON válido.
 *   2. Que las fotos que nombran existan en src/assets/uploads/.
 *   3. Que cada dato de los archivos tenga su campo en public/admin/config.yml
 *      (si no, el cliente no podría editarlo desde el CMS).
 *   4. Valores esenciales (nombre, título principal, precios, WhatsApp).
 *
 * Termina con código 1 si hay errores; los avisos no lo detienen.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const RAIZ = process.cwd();
const CONTENIDO = path.join(RAIZ, 'src/content');
const SUBIDAS = path.join(RAIZ, 'src/assets/uploads');
const CONFIG_CMS = path.join(RAIZ, 'public/admin/config.yml');

const errores = [];
const avisos = [];
const relativo = (ruta) => path.relative(RAIZ, ruta).split(path.sep).join('/');

/* ---------- 1. Leer todos los JSON ---------- */

function listarJson(carpeta) {
  if (!existsSync(carpeta)) return [];
  const salida = [];
  for (const entrada of readdirSync(carpeta, { withFileTypes: true })) {
    const ruta = path.join(carpeta, entrada.name);
    if (entrada.isDirectory()) salida.push(...listarJson(ruta));
    else if (entrada.name.endsWith('.json')) salida.push(ruta);
  }
  return salida;
}

const archivos = new Map(); // ruta relativa -> datos
for (const ruta of listarJson(CONTENIDO)) {
  try {
    archivos.set(relativo(ruta), JSON.parse(readFileSync(ruta, 'utf8')));
  } catch (e) {
    errores.push(`${relativo(ruta)}: no es un JSON válido (${e.message})`);
  }
}

const obtener = (ruta) => archivos.get(ruta);

/* ---------- 2. Fotos referenciadas ---------- */

const fotosSubidas = new Set(
  existsSync(SUBIDAS) ? readdirSync(SUBIDAS).map((nombre) => nombre.toLowerCase()) : []
);

const CAMPOS_FOTO = new Set(['imagen', 'logo', 'imagenCompartir']);

function revisarFotos(valor, archivo, ruta = '') {
  if (Array.isArray(valor)) {
    valor.forEach((item) => revisarFotos(item, archivo, ruta));
  } else if (valor && typeof valor === 'object') {
    for (const [clave, hijo] of Object.entries(valor)) {
      if (CAMPOS_FOTO.has(clave) && typeof hijo === 'string' && hijo.trim()) {
        const foto = hijo.trim();
        if (/^https?:\/\//i.test(foto)) continue;
        const nombre = foto.split('/').pop().toLowerCase();
        if (!fotosSubidas.has(nombre)) {
          avisos.push(`${archivo}: la foto "${nombre}" (${ruta}${clave}) no está en src/assets/uploads/; esa foto no se mostrará`);
        }
      } else {
        revisarFotos(hijo, archivo, `${ruta}${clave}.`);
      }
    }
  }
}
for (const [archivo, datos] of archivos) revisarFotos(datos, archivo);

/* ---------- 3. Campos del CMS ---------- */

function nombresEnConfig(lineas, indiceInicio) {
  // Desde la línea "file:" o "folder:" hasta que la sangría baje: son los campos de ese bloque.
  const sangria = (linea) => linea.match(/^ */)[0].length;
  const base = sangria(lineas[indiceInicio]);
  const nombres = new Set();
  for (let i = indiceInicio + 1; i < lineas.length; i++) {
    const linea = lineas[i];
    if (!linea.trim() || linea.trim().startsWith('#')) continue;
    if (sangria(linea) < base) break;
    const m = linea.match(/^\s*-?\s*name:\s*['"]?([\w-]+)['"]?\s*$/);
    if (m) nombres.add(m[1]);
  }
  return nombres;
}

function clavesDe(valor, salida = new Set()) {
  if (Array.isArray(valor)) valor.forEach((item) => clavesDe(item, salida));
  else if (valor && typeof valor === 'object') {
    for (const [clave, hijo] of Object.entries(valor)) {
      salida.add(clave);
      clavesDe(hijo, salida);
    }
  }
  return salida;
}

if (!existsSync(CONFIG_CMS)) {
  avisos.push('public/admin/config.yml no existe: el cliente no podrá editar desde el CMS');
} else {
  const lineas = readFileSync(CONFIG_CMS, 'utf8').split(/\r?\n/);
  for (let i = 0; i < lineas.length; i++) {
    const m = lineas[i].match(/^\s*(file|folder):\s*(\S+)/);
    if (!m) continue;
    const [, tipo, destino] = m;
    const campos = nombresEnConfig(lineas, i);

    const afectados =
      tipo === 'file'
        ? [destino].filter((ruta) => archivos.has(ruta))
        : [...archivos.keys()].filter((ruta) => ruta.startsWith(destino.replace(/\/$/, '') + '/'));

    if (tipo === 'file' && afectados.length === 0) {
      errores.push(`config.yml apunta a ${destino}, que no existe`);
      continue;
    }

    const claves = new Set();
    for (const ruta of afectados) clavesDe(obtener(ruta), claves);

    for (const clave of claves) {
      if (!campos.has(clave)) {
        errores.push(`${destino}: el dato "${clave}" no tiene campo en public/admin/config.yml (el cliente no podría editarlo y el CMS podría perderlo)`);
      }
    }
  }
}

/* ---------- 4. Valores esenciales ---------- */

const negocio = obtener('src/content/negocio.json');
if (!negocio) {
  errores.push('src/content/negocio.json no existe');
} else {
  if (!String(negocio.nombre ?? '').trim()) errores.push('negocio.json: falta "nombre"');
  if (!String(negocio.hero?.titulo ?? '').trim()) errores.push('negocio.json: falta "hero.titulo"');
}

const contacto = obtener('src/content/contacto.json');
if (contacto) {
  const whatsapp = String(contacto.whatsapp ?? '').replace(/\D/g, '');
  if (whatsapp && (whatsapp.length < 8 || whatsapp.length > 15)) {
    avisos.push(`contacto.json: el WhatsApp "${contacto.whatsapp}" no parece un número válido (usa el código del país, sin el 0 inicial)`);
  }
  if (/^0+(-0+)*$/.test(String(contacto.claveWeb3forms ?? '').replace(/-/g, '')) && contacto.claveWeb3forms) {
    avisos.push('contacto.json: "claveWeb3forms" es la clave de ejemplo; el formulario no enviará nada hasta poner la del cliente');
  }
  if (/ejemplo\.com|^\+?593\s?90\s?000/i.test(JSON.stringify(contacto))) {
    avisos.push('contacto.json: aún tiene datos de ejemplo (correo, teléfono o dirección)');
  }
}

for (const [archivo, datos] of archivos) {
  if (!archivo.startsWith('src/content/menu/')) continue;
  if (!String(datos.nombre ?? '').trim()) errores.push(`${archivo}: falta el nombre de la categoría`);
  (datos.productos ?? []).forEach((producto, i) => {
    const precio = producto.precio;
    if (precio !== undefined && precio !== null && precio !== '') {
      const n = Number(precio);
      if (!Number.isFinite(n)) errores.push(`${archivo}: el precio del producto #${i + 1} ("${precio}") no es un número`);
      else if (n < 0) errores.push(`${archivo}: el precio del producto #${i + 1} es negativo`);
    }
  });
}

/* ---------- Resultado ---------- */

console.log(`Revisados ${archivos.size} archivos de contenido.\n`);
if (avisos.length) {
  console.log(`AVISOS (${avisos.length})`);
  avisos.forEach((a) => console.log(`  - ${a}`));
  console.log('');
}
if (errores.length) {
  console.log(`ERRORES (${errores.length})`);
  errores.forEach((e) => console.log(`  - ${e}`));
  console.log('\nHay errores que corregir antes de publicar.');
  process.exit(1);
}
console.log('Sin errores.');
