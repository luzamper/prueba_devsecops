/**
 * Servidor estatico minimo para desarrollo local.
 * Usa solo modulos nativos de Node: sin dependencias externas.
 *
 * ADVERTENCIA: es un servidor de desarrollo. No debe exponerse en red ni
 * usarse como servidor de produccion (CS-07.5).
 *
 * Uso: node scripts/dev-server.js [puerto]
 */
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ = path.resolve(fileURLToPath(new URL("../src", import.meta.url)));

/**
 * Politica de seguridad de contenido (HU-07).
 * Sin 'unsafe-inline' ni 'unsafe-eval': la aplicacion no usa scripts ni
 * estilos en linea, por lo que no hacen falta.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self'",
  "connect-src 'self'",
  "font-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'self'",
].join("; ");

/** Cabeceras aplicadas a toda respuesta, incluidas las de error. */
export const CABECERAS_SEGURIDAD = Object.freeze({
  "content-security-policy": CSP,
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "x-frame-options": "DENY",
});

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
};

/**
 * Resuelve la URL a una ruta dentro de src/, bloqueando el path traversal.
 * Devuelve null si el destino queda fuera de la raiz (CS-07.4).
 */
export function resolverRuta(url) {
  let limpia;
  try {
    limpia = decodeURIComponent(new URL(url, "http://localhost").pathname);
  } catch {
    return null; // Codificacion porcentual invalida
  }

  if (limpia.includes("\0")) {
    return null;
  }

  const relativa = limpia === "/" ? "index.html" : limpia.replace(/^\/+/, "");
  const destino = path.resolve(RAIZ, relativa);

  if (destino !== RAIZ && !destino.startsWith(RAIZ + path.sep)) {
    return null;
  }
  return destino;
}

/** Responde con cuerpo de texto plano y las cabeceras de seguridad. */
function responder(res, codigo, cuerpo, tipo = "text/plain; charset=utf-8") {
  res.writeHead(codigo, { ...CABECERAS_SEGURIDAD, "content-type": tipo });
  res.end(cuerpo);
}

/** Crea el servidor sin ponerlo a escuchar, para poder probarlo. */
export function crearServidor() {
  return http.createServer(async (req, res) => {
    // Node no envia la cabecera Server, pero lo dejamos explicito (CS-07.2).
    res.removeHeader?.("Server");
    res.removeHeader?.("X-Powered-By");

    const destino = resolverRuta(req.url ?? "/");

    if (destino === null) {
      // Mensaje generico: sin rutas del sistema ni trazas (CS-07.3).
      responder(res, 403, "403 Prohibido");
      return;
    }

    try {
      const contenido = await fs.readFile(destino);
      const tipo = TIPOS[path.extname(destino)] ?? "application/octet-stream";
      res.writeHead(200, {
        ...CABECERAS_SEGURIDAD,
        "content-type": tipo,
        "cache-control": "no-store",
      });
      res.end(contenido);
    } catch {
      responder(res, 404, "404 No encontrado");
    }
  });
}

/** Arranca el servidor cuando el archivo se ejecuta directamente. */
function esEjecucionDirecta() {
  const entrada = process.argv[1];
  if (!entrada) return false;
  return path.resolve(entrada) === path.resolve(fileURLToPath(import.meta.url));
}

if (esEjecucionDirecta()) {
  const puerto = Number(process.argv[2] ?? process.env.PORT ?? 3000);
  crearServidor().listen(puerto, () => {
    console.log(`Servidor de desarrollo en http://localhost:${puerto}`);
    console.log(`Sirviendo: ${RAIZ}`);
    console.log("Solo para desarrollo local: no exponer en red.");
  });
}
