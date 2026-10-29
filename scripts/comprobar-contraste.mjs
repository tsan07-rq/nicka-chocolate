#!/usr/bin/env node
/**
 * Comprueba que los colores de marca se puedan leer bien (contraste WCAG 2.x).
 * Lee perfiles/<perfil>/marca.css, calcula también los tonos derivados (color-mix)
 * y revisa los pares de colores que la plantilla usa de verdad.
 *
 * Uso:  npm run contraste              (perfil cafeteria)
 *       npm run contraste -- restaurante
 *
 * Mínimos: 4.5 para texto normal, 3 para bordes y detalles (WCAG AA).
 * Termina con error si algún par no cumple, para no entregar una web ilegible.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const perfil = process.argv[2] || 'cafeteria';
const archivo = path.join(process.cwd(), 'perfiles', perfil, 'marca.css');

let css;
try {
  css = readFileSync(archivo, 'utf8');
} catch {
  console.error(`No se encontró ${archivo}`);
  process.exit(1);
}

// Variables CSS (--nombre: valor;), sin comentarios.
const variables = {};
for (const [, nombre, valor] of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
  variables[nombre] = valor.trim();
}

function aRGB(valor, nivel = 0) {
  if (nivel > 10) throw new Error('referencia circular entre variables');
  const v = valor.trim();
  let m;

  if ((m = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i))) {
    const hex = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  }
  if (v === 'black') return [0, 0, 0];
  if (v === 'white') return [255, 255, 255];

  if ((m = v.match(/^var\((--[\w-]+)\)$/))) {
    if (!(m[1] in variables)) throw new Error(`no existe la variable ${m[1]}`);
    return aRGB(variables[m[1]], nivel + 1);
  }

  if ((m = v.match(/^color-mix\(\s*in srgb\s*,\s*(.+?)\s+(\d+(?:\.\d+)?)%\s*,\s*(.+?)\s*\)$/))) {
    const peso = Number(m[2]) / 100;
    const a = aRGB(m[1], nivel + 1);
    const b = aRGB(m[3], nivel + 1);
    return a.map((canal, i) => Math.round(canal * peso + b[i] * (1 - peso)));
  }

  throw new Error(`no se pudo interpretar el color "${v}" (usa #rrggbb)`);
}

function luminancia([r, g, b]) {
  const lineal = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lineal(r) + 0.7152 * lineal(g) + 0.0722 * lineal(b);
}

function contraste(a, b) {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
}

const aHex = (rgb) => '#' + rgb.map((c) => c.toString(16).padStart(2, '0')).join('');

// Tokens opcionales para marcas oscuras: si no existen, se usan los de siempre.
const tokenTitulos = '--marca-titulos' in variables ? '--marca-titulos' : '--marca-principal';
const tokenSobreAcento = '--marca-sobre-acento' in variables ? '--marca-sobre-acento' : '--marca-texto';

// [descripción, color del frente, color del fondo, mínimo]
const pares = [
  ['Texto principal sobre el fondo', '--marca-texto', '--marca-fondo', 4.5],
  ['Texto principal sobre secciones alternas', '--marca-texto', '--marca-fondo-alterno', 4.5],
  ['Texto de apoyo sobre el fondo', '--marca-texto-suave', '--marca-fondo', 4.5],
  ['Texto de apoyo sobre secciones alternas', '--marca-texto-suave', '--marca-fondo-alterno', 4.5],
  ['Títulos sobre el fondo', tokenTitulos, '--marca-fondo', 4.5],
  ['Títulos sobre secciones alternas', tokenTitulos, '--marca-fondo-alterno', 4.5],
  ['Enlaces (acento legible) sobre el fondo', '--marca-acento-texto', '--marca-fondo', 4.5],
  ['Enlaces (acento legible) sobre secciones alternas', '--marca-acento-texto', '--marca-fondo-alterno', 4.5],
  ['Texto claro sobre la barra de navegación', '--marca-sobre-principal', '--marca-principal', 4.5],
  ['Texto claro sobre el hero sin foto y el pie', '--marca-sobre-principal', '--marca-principal-profundo', 4.5],
  ['Texto de los botones de acento y de WhatsApp', tokenSobreAcento, '--marca-acento', 4.5],
  ['Anillo de foco (acento) sobre la barra', '--marca-acento', '--marca-principal', 3],
  ['Borde de los campos del formulario', '--marca-borde-fuerte', '--marca-fondo', 3],
];

if ('--marca-error' in variables) {
  pares.push(['Mensajes de error sobre el fondo', '--marca-error', '--marca-fondo', 4.5]);
}

let fallos = 0;
console.log(`Contraste de los colores de ${path.relative(process.cwd(), archivo)}\n`);

for (const [descripcion, frente, fondo, minimo] of pares) {
  try {
    const f = aRGB(`var(${frente})`);
    const g = aRGB(`var(${fondo})`);
    const ratio = contraste(f, g);
    const bien = ratio >= minimo;
    if (!bien) fallos += 1;
    console.log(
      `${bien ? 'OK   ' : 'FALLA'}  ${ratio.toFixed(2).padStart(5)} (mín. ${minimo})  ${descripcion}  [${aHex(f)} sobre ${aHex(g)}]`
    );
  } catch (error) {
    fallos += 1;
    console.log(`ERROR  ${descripcion}: ${error.message}`);
  }
}

if (fallos > 0) {
  console.log(`\n${fallos} par(es) sin contraste suficiente. Oscurece o aclara el color indicado en marca.css.`);
  console.log('Pista: si falla el acento como texto, ajusta el porcentaje de --marca-acento-texto (más texto = más oscuro).');
  process.exit(1);
}
console.log('\nTodos los pares cumplen.');
