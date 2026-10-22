import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import { crearServidor, resolverRuta, RAIZ } from "../scripts/dev-server.js";

let servidor;
let base;

before(async () => {
  servidor = crearServidor();
  await new Promise((resolve) => servidor.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  await new Promise((resolve) => servidor.close(resolve));
});

// --- CA-07.1 / CA-07.3 / CS-07.1: cabeceras de seguridad ---

test("CA-07.1 la respuesta incluye las cabeceras de seguridad", async () => {
  const res = await fetch(`${base}/`);

  assert.equal(res.status, 200);
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.equal(res.headers.get("referrer-policy"), "no-referrer");
  assert.equal(res.headers.get("x-frame-options"), "DENY");
  assert.ok(res.headers.get("content-security-policy"));
});

test("CA-07.3 la CSP no permite inline ni eval", async () => {
  const res = await fetch(`${base}/`);
  const csp = res.headers.get("content-security-policy");

  assert.match(csp, /default-src 'self'/);
  assert.doesNotMatch(csp, /unsafe-inline/);
  assert.doesNotMatch(csp, /unsafe-eval/);
});

test("CS-07.1 la CSP restringe frame-ancestors, base-uri y form-action", async () => {
  const res = await fetch(`${base}/`);
  const csp = res.headers.get("content-security-policy");

  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /base-uri 'none'/);
  assert.match(csp, /form-action 'self'/);
});

test("CA-07.1 las respuestas de error tambien llevan las cabeceras", async () => {
  for (const ruta of ["/no-existe.html", "/..%2f..%2fpackage.json"]) {
    const res = await fetch(`${base}${ruta}`);
    assert.ok(res.status >= 400, `${ruta} deberia fallar`);
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
    assert.ok(res.headers.get("content-security-policy"), `${ruta} sin CSP`);
  }
});

test("CS-07.2 la respuesta no revela el software del servidor", async () => {
  const res = await fetch(`${base}/`);

  assert.equal(res.headers.get("server"), null);
  assert.equal(res.headers.get("x-powered-by"), null);
});

// --- CS-07.3: mensajes de error genericos ---

test("CS-07.3 los errores no exponen rutas ni trazas", async () => {
  const res = await fetch(`${base}/no-existe.html`);
  const cuerpo = await res.text();

  assert.equal(res.status, 404);
  assert.equal(cuerpo, "404 No encontrado");
  assert.doesNotMatch(cuerpo, /[A-Za-z]:\|\/home\/|at Object|Error:/);
});

// --- CA-07.5 / CS-07.4: path traversal ---

test("CA-07.5 el path traversal codificado responde 403", async () => {
  const res = await fetch(`${base}/..%2f..%2fpackage.json`);

  assert.equal(res.status, 403);
});

test("CS-07.4 ninguna ruta escapa de la raiz servida", () => {
  // Invariante de seguridad: el destino es null (bloqueado) o queda dentro de
  // src/. Las rutas con ../ sin codificar las normaliza el parser de URL antes
  // de llegar aqui, asi que terminan dentro de la raiz y responden 404.
  const rutas = [
    "/../package.json",
    "/..%2f..%2fpackage.json",
    "/../../../../etc/passwd",
    "/%2e%2e%2f%2e%2e%2fpackage.json",
    "/C:/Windows/win.ini",
    "/index.html%00.txt",
    "/....//package.json",
  ];

  for (const ruta of rutas) {
    const destino = resolverRuta(ruta);
    if (destino === null) continue;
    assert.ok(
      destino.startsWith(RAIZ + path.sep),
      `${ruta} escapo de la raiz: ${destino}`,
    );
  }
});

test("CS-07.4 el traversal codificado se bloquea de forma explicita", () => {
  // Estas si sobreviven a la normalizacion de URL y dependen de la validacion
  // de resolverRuta.
  assert.equal(resolverRuta("/..%2f..%2fpackage.json"), null);
  assert.equal(resolverRuta("/%2e%2e%2f%2e%2e%2fpackage.json"), null);
  assert.equal(resolverRuta("/index.html%00.txt"), null);
});

test("CS-07.4 resolverRuta acepta los recursos de la aplicacion", () => {
  for (const ruta of ["/", "/index.html", "/css/styles.css", "/js/app.js"]) {
    assert.notEqual(resolverRuta(ruta), null, `deberia permitir ${ruta}`);
  }
});

// --- recursos servidos correctamente ---

test("los recursos se sirven con su tipo de contenido", async () => {
  const casos = [
    ["/", "text/html; charset=utf-8"],
    ["/css/styles.css", "text/css; charset=utf-8"],
    ["/js/app.js", "text/javascript; charset=utf-8"],
    ["/favicon.svg", "image/svg+xml"],
  ];

  for (const [ruta, tipo] of casos) {
    const res = await fetch(`${base}${ruta}`);
    assert.equal(res.status, 200, `${ruta} no respondio 200`);
    assert.equal(res.headers.get("content-type"), tipo, `tipo de ${ruta}`);
  }
});
