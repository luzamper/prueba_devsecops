/**
 * Servidor estatico minimo para desarrollo local.
 * Usa solo modulos nativos de Node: sin dependencias externas.
 *
 * Uso: node scripts/dev-server.js [puerto]
 */
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(fileURLToPath(new URL("../src", import.meta.url)));
const PUERTO = Number(process.argv[2] ?? process.env.PORT ?? 3000);

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

/** Resuelve la URL a una ruta dentro de src/, bloqueando el path traversal. */
function resolverRuta(url) {
  const limpia = decodeURIComponent(new URL(url, "http://localhost").pathname);
  const relativa = limpia === "/" ? "index.html" : limpia.replace(/^\/+/, "");
  const destino = path.resolve(RAIZ, relativa);

  if (destino !== RAIZ && !destino.startsWith(RAIZ + path.sep)) {
    return null;
  }
  return destino;
}

const servidor = http.createServer(async (req, res) => {
  const destino = resolverRuta(req.url ?? "/");

  if (destino === null) {
    res.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    res.end("403 Prohibido");
    return;
  }

  try {
    const contenido = await fs.readFile(destino);
    const tipo = TIPOS[path.extname(destino)] ?? "application/octet-stream";
    res.writeHead(200, { "content-type": tipo, "cache-control": "no-store" });
    res.end(contenido);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("404 No encontrado");
  }
});

servidor.listen(PUERTO, () => {
  console.log(`Servidor de desarrollo en http://localhost:${PUERTO}`);
  console.log(`Sirviendo: ${RAIZ}`);
});
