import test from "node:test";
import assert from "node:assert/strict";

import { incrementar, reiniciar, mensajeEstado } from "../src/js/utils.js";

test("incrementar suma 1 por defecto", () => {
  assert.equal(incrementar(0), 1);
  assert.equal(incrementar(41), 42);
});

test("incrementar acepta un paso personalizado", () => {
  assert.equal(incrementar(10, 5), 15);
  assert.equal(incrementar(10, -5), 5);
});

test("incrementar rechaza valores no numericos", () => {
  assert.throws(() => incrementar("1"), TypeError);
  assert.throws(() => incrementar(1, NaN), TypeError);
});

test("reiniciar devuelve 0", () => {
  assert.equal(reiniciar(), 0);
});

test("mensajeEstado incluye la hora recibida", () => {
  const fecha = new Date("2026-01-01T08:30:00");
  assert.match(mensajeEstado(fecha), /^Aplicacion activa desde /);
});
