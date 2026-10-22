import test from "node:test";
import assert from "node:assert/strict";

import { mensajeEstado } from "../src/js/utils.js";

test("mensajeEstado incluye la hora recibida", () => {
  const fecha = new Date("2026-01-01T08:30:00");
  assert.match(mensajeEstado(fecha), /^Aplicacion activa desde /);
});

test("mensajeEstado usa la fecha actual por defecto", () => {
  assert.match(mensajeEstado(), /^Aplicacion activa desde /);
});
