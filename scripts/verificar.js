/**
 * Verificacion de sintaxis y formato sin dependencias externas.
 *
 * Comprueba lo que declara .editorconfig y la sintaxis de cada modulo
 * JavaScript. Se ejecuta en local y en CI (HU-08, CA-08.1).
 *
 * Uso: node scripts/verificar.js
 */
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const ejecutar = promisify(execFile);

const RAIZ = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const DIRECTORIOS = ["src", "scripts", "tests"];
const EXTENSIONES_TEXTO = new Set([".js", ".css", ".html", ".json", ".md", ".svg"]);
const EXCLUIDOS = new Set(["node_modules", ".git", "coverage"]);

const problemas = [];

function registrar(archivo, mensaje) {
  problemas.push(`${path.relative(RAIZ, archivo)}: ${mensaje}`);
}

/** Recorre un directorio y devuelve los archivos de texto que contiene. */
async function listarArchivos(directorio) {
  const encontrados = [];
  let entradas;

  try {
    entradas = await fs.readdir(directorio, { withFileTypes: true });
  } catch {
    return encontrados;
  }

  for (const entrada of entradas) {
    if (EXCLUIDOS.has(entrada.name)) continue;
    const completa = path.join(directorio, entrada.name);

    if (entrada.isDirectory()) {
      encontrados.push(...(await listarArchivos(completa)));
    } else if (EXTENSIONES_TEXTO.has(path.extname(entrada.name))) {
      encontrados.push(completa);
    }
  }
  return encontrados;
}

/** Reglas de formato declaradas en .editorconfig. */
async function verificarFormato(archivo) {
  const contenido = await fs.readFile(archivo, "utf8");

  if (contenido.includes("\r\n")) {
    registrar(archivo, "usa finales de linea CRLF; se esperaba LF");
  }
  if (contenido.length > 0 && !contenido.endsWith("\n")) {
    registrar(archivo, "no termina con salto de linea");
  }

  const lineas = contenido.split("\n");
  const esMarkdown = path.extname(archivo) === ".md";

  lineas.forEach((linea, indice) => {
    const numero = indice + 1;
    if (linea.includes("\t")) {
      registrar(archivo, `linea ${numero}: contiene tabulador`);
    }
    if (!esMarkdown && /[ ]+$/.test(linea)) {
      registrar(archivo, `linea ${numero}: espacios al final`);
    }
  });
}

/** Sintaxis de cada modulo JavaScript. */
async function verificarSintaxis(archivo) {
  try {
    await ejecutar(process.execPath, ["--check", archivo]);
  } catch (error) {
    const detalle = String(error.stderr ?? error.message).split("\n")[0];
    registrar(archivo, `error de sintaxis: ${detalle}`);
  }
}

const listas = await Promise.all(
  DIRECTORIOS.map((d) => listarArchivos(path.join(RAIZ, d))),
);
const archivos = listas.flat();

for (const archivo of archivos) {
  await verificarFormato(archivo);
  if (path.extname(archivo) === ".js") {
    await verificarSintaxis(archivo);
  }
}

if (problemas.length > 0) {
  console.error(`Se encontraron ${problemas.length} problema(s):\n`);
  for (const problema of problemas) {
    console.error(`  - ${problema}`);
  }
  process.exit(1);
}

console.log(`Verificacion correcta: ${archivos.length} archivo(s) sin problemas.`);
