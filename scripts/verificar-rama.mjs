#!/usr/bin/env node
/**
 * Verifica que una rama compile en tu computador.
 *
 * Uso (desde la carpeta del proyecto):
 *     node scripts/verificar-rama.mjs                 # verifica la rama actual
 *     node scripts/verificar-rama.mjs nombre-de-rama  # descarga y verifica esa rama
 *
 * Hace: git fetch + checkout + pull, npm install, npm run build, y comprueba que
 * exista dist/index.html. Guarda todo en verificacion.log (pégalo en el chat si falla).
 * Si el package-lock.json cambió, te ofrece subirlo a la rama.
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import path from 'node:path';

const RAIZ = process.cwd();
const LOG = path.join(RAIZ, 'verificacion.log');
const rama = process.argv[2];

writeFileSync(LOG, `Verificación - ${new Date().toISOString()}\n\n`);

function escribir(texto) {
  process.stdout.write(texto);
  appendFileSync(LOG, texto);
}

function titulo(texto) {
  escribir(`\n=== ${texto} ===\n`);
}

function correr(comando) {
  return new Promise((resolve) => {
    escribir(`$ ${comando}\n`);
    const proceso = spawn(comando, { cwd: RAIZ, shell: true });
    proceso.stdout.on('data', (d) => escribir(d.toString()));
    proceso.stderr.on('data', (d) => escribir(d.toString()));
    proceso.on('close', (codigo) => {
      escribir(`(código de salida: ${codigo})\n`);
      resolve(codigo);
    });
    proceso.on('error', (e) => {
      escribir(`No se pudo ejecutar el comando: ${e.message}\n`);
      resolve(1);
    });
  });
}

function capturar(comando) {
  return new Promise((resolve) => {
    let salida = '';
    const proceso = spawn(comando, { cwd: RAIZ, shell: true });
    proceso.stdout.on('data', (d) => (salida += d.toString()));
    proceso.stderr.on('data', (d) => (salida += d.toString()));
    proceso.on('close', (codigo) => resolve({ codigo, salida: salida.trim() }));
    proceso.on('error', () => resolve({ codigo: 1, salida: '' }));
  });
}

function terminar(ok, mensaje) {
  titulo(ok ? 'RESULTADO: TODO BIEN' : 'RESULTADO: HAY UN PROBLEMA');
  escribir(`${mensaje}\n`);
  if (!ok) escribir(`\nPega el contenido de este archivo en el chat:\n  ${LOG}\n`);
  process.exit(ok ? 0 : 1);
}

async function main() {
  if (!existsSync(path.join(RAIZ, 'package.json')) || !existsSync(path.join(RAIZ, 'astro.config.mjs'))) {
    terminar(false, 'Ejecuta este script desde la carpeta del proyecto (plantilla-maestra).');
  }

  // 1. Node
  titulo('1. Node');
  const [mayor, menor, parche] = process.versions.node.split('.').map(Number);
  const paquete = JSON.parse(readFileSync(path.join(RAIZ, 'package.json'), 'utf8'));
  const requerido = (paquete.engines?.node ?? '>=22.22.0').replace('>=', '');
  const [rMayor, rMenor, rParche] = requerido.split('.').map(Number);
  escribir(`Node ${process.versions.node} (el proyecto pide ${requerido} o superior, versión par)\n`);
  const muyViejo =
    mayor < rMayor ||
    (mayor === rMayor && (menor < rMenor || (menor === rMenor && parche < rParche)));
  if (mayor % 2 !== 0 || muyViejo) {
    terminar(
      false,
      `Necesitas Node ${requerido} o superior (par). Si usas nvm: nvm install ${requerido} y nvm use ${requerido} (PowerShell como administrador).`
    );
  }

  // 2. Rama
  titulo('2. Rama');
  if ((await capturar('git --version')).codigo !== 0) terminar(false, 'No se encontró git.');
  if (rama) {
    if ((await correr(`git fetch origin ${rama}`)) !== 0) terminar(false, 'No se pudo descargar la rama.');
    if ((await correr(`git checkout ${rama}`)) !== 0) {
      terminar(false, 'No se pudo cambiar de rama. ¿Tienes cambios sin guardar? Revisa "git status".');
    }
    if ((await correr(`git pull origin ${rama}`)) !== 0) terminar(false, 'git pull falló.');
  } else {
    const actual = await capturar('git branch --show-current');
    escribir(`Verificando la rama actual: ${actual.salida}\n`);
  }
  const estado = await capturar('git status --porcelain');
  if (estado.salida) {
    escribir(`Aviso: hay cambios locales sin guardar:\n${estado.salida}\n`);
  }

  // 3. Instalación
  titulo('3. npm install');
  if ((await correr('npm install')) !== 0) terminar(false, 'npm install falló.');

  // 4. Build
  titulo('4. npm run build');
  if ((await correr('npm run build')) !== 0) terminar(false, 'El build falló. Necesito ver el error de arriba.');
  if (!existsSync(path.join(RAIZ, 'dist', 'index.html'))) {
    terminar(false, 'El build terminó sin errores pero no generó dist/index.html.');
  }
  escribir('\nSe generó dist/index.html correctamente.\n');

  // 5. package-lock.json
  titulo('5. package-lock.json');
  const lock = await capturar('git status --porcelain package-lock.json');
  if (!lock.salida) {
    escribir('package-lock.json no cambió. Nada que subir.\n');
  } else {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const respuesta = (await rl.question('package-lock.json cambió. ¿Lo subo a la rama ahora? (s/n): '))
      .trim()
      .toLowerCase();
    rl.close();
    if (['s', 'si', 'sí'].includes(respuesta)) {
      const actual = (await capturar('git branch --show-current')).salida;
      await correr('git add package-lock.json');
      await correr('git commit -m "Actualiza package-lock.json (build verificado)"');
      if ((await correr(`git push origin ${actual}`)) !== 0) {
        escribir(`No se pudo subir. Puedes hacerlo luego con: git push origin ${actual}\n`);
      }
    } else {
      escribir('Lo dejé sin subir.\n');
    }
  }

  terminar(true, 'La rama compila bien en tu computador. Avísame en el chat.');
}

main().catch((e) => terminar(false, `Error inesperado: ${e.message}`));
