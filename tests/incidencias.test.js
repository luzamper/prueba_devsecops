import test from "node:test";
import assert from "node:assert/strict";

import {
  ESTADOS,
  LIMITES,
  SEVERIDADES,
  agregarIncidencia,
  crearIncidencia,
  resumirPorSeveridad,
  validarIncidencia,
} from "../src/js/incidencias.js";

const base = { titulo: "Fuga en la bomba 3", descripcion: "Turno noche", severidad: "alta" };

// --- CA-01.1: el titulo es obligatorio ---

test("CA-01.1 el titulo vacio produce un error", () => {
  const { valido, errores } = validarIncidencia({ ...base, titulo: "" });

  assert.equal(valido, false);
  assert.equal(errores.titulo, "El titulo es obligatorio");
});

test("CA-01.1 un titulo de solo espacios se trata como vacio", () => {
  const { valido, errores } = validarIncidencia({ ...base, titulo: "    " });

  assert.equal(valido, false);
  assert.equal(errores.titulo, "El titulo es obligatorio");
});

// --- CA-01.2: titulo de 3 a 120 caracteres y severidad valida ---

test("CA-01.2 acepta un titulo y una severidad validos", () => {
  const { valido, errores } = validarIncidencia(base);

  assert.equal(valido, true);
  assert.deepEqual(errores, {});
});

test("CA-01.2 respeta los limites del titulo", () => {
  const corto = "ab";
  const justo = "a".repeat(LIMITES.tituloMinimo);
  const maximo = "a".repeat(LIMITES.tituloMaximo);
  const excedido = "a".repeat(LIMITES.tituloMaximo + 1);

  assert.equal(validarIncidencia({ ...base, titulo: corto }).valido, false);
  assert.equal(validarIncidencia({ ...base, titulo: justo }).valido, true);
  assert.equal(validarIncidencia({ ...base, titulo: maximo }).valido, true);
  assert.equal(validarIncidencia({ ...base, titulo: excedido }).valido, false);
});

test("CA-01.2 la incidencia nace en estado abierta y con fecha", () => {
  const fecha = new Date("2026-03-15T14:20:00Z");
  const incidencia = crearIncidencia(base, fecha);

  assert.equal(incidencia.estado, ESTADOS[0]);
  assert.equal(incidencia.estado, "abierta");
  assert.equal(incidencia.registrada, fecha.toISOString());
});

// --- CA-01.4: limite de la descripcion ---

test("CA-01.4 rechaza una descripcion que supera el limite", () => {
  const larga = "x".repeat(LIMITES.descripcionMaxima + 1);
  const { valido, errores } = validarIncidencia({ ...base, descripcion: larga });

  assert.equal(valido, false);
  assert.match(errores.descripcion, /supera los 1000/);
});

test("CA-01.4 acepta una descripcion en el limite exacto", () => {
  const justa = "x".repeat(LIMITES.descripcionMaxima);

  assert.equal(validarIncidencia({ ...base, descripcion: justa }).valido, true);
});

test("CA-01.4 la descripcion es opcional", () => {
  assert.equal(validarIncidencia({ titulo: base.titulo, severidad: "baja" }).valido, true);
});

// --- CA-01.5: identificador unico ---

test("CA-01.5 cada incidencia recibe un identificador distinto", () => {
  const identificadores = new Set();
  for (let i = 0; i < 500; i += 1) {
    identificadores.add(crearIncidencia(base).id);
  }

  assert.equal(identificadores.size, 500);
});

// --- CS-01.1: la validacion no depende del HTML ---

test("CS-01.1 validarIncidencia rechaza datos que el DOM podria dejar pasar", () => {
  // Simula el envio manipulado desde las herramientas de desarrollo: sin
  // titulo y con una severidad inventada.
  const { valido, errores } = validarIncidencia({ titulo: "", severidad: "ninguna" });

  assert.equal(valido, false);
  assert.ok(errores.titulo);
  assert.ok(errores.severidad);
});

test("CS-01.1 crearIncidencia lanza si los datos no son validos", () => {
  assert.throws(() => crearIncidencia({ ...base, titulo: "" }), TypeError);
  assert.throws(() => crearIncidencia({ ...base, severidad: "urgente" }), TypeError);
});

// --- CS-01.2: severidad contra lista cerrada ---

test("CS-01.2 solo admite las severidades declaradas", () => {
  for (const severidad of SEVERIDADES) {
    assert.equal(validarIncidencia({ ...base, severidad }).valido, true, severidad);
  }

  const invalidas = ["urgente", "ALTA", "", null, undefined, 0, "__proto__", "critica "];
  for (const severidad of invalidas) {
    assert.equal(
      validarIncidencia({ ...base, severidad }).valido,
      false,
      `deberia rechazar ${JSON.stringify(severidad)}`,
    );
  }
});

test("CS-01.2 la lista de severidades es inmutable", () => {
  assert.throws(() => {
    SEVERIDADES.push("urgente");
  }, TypeError);
});

// --- CS-01.3: identificador no predecible ---

test("CS-01.3 el identificador tiene formato UUID v4", () => {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

  assert.match(crearIncidencia(base).id, uuid);
});

// --- CS-01.4: el texto se guarda tal cual, sin interpretarse como HTML ---

test("CS-01.4 un titulo con HTML se almacena como texto literal", () => {
  const payload = '<img src=x onerror="alert(1)">';
  const incidencia = crearIncidencia({ ...base, titulo: payload });

  assert.equal(incidencia.titulo, payload);
});

// --- Inmutabilidad y agregado ---

test("la incidencia creada es inmutable", () => {
  const incidencia = crearIncidencia(base);

  assert.throws(() => {
    incidencia.estado = "cerrada";
  }, TypeError);
});

test("agregarIncidencia no muta la lista recibida", () => {
  const original = [];
  const incidencia = crearIncidencia(base);
  const resultado = agregarIncidencia(original, incidencia);

  assert.equal(original.length, 0);
  assert.equal(resultado.length, 1);
  assert.equal(resultado[0], incidencia);
});

test("agregarIncidencia coloca la mas reciente al inicio", () => {
  const primera = crearIncidencia({ ...base, titulo: "Primera" });
  const segunda = crearIncidencia({ ...base, titulo: "Segunda" });

  const lista = agregarIncidencia(agregarIncidencia([], primera), segunda);

  assert.deepEqual(lista.map((i) => i.titulo), ["Segunda", "Primera"]);
});

test("agregarIncidencia exige un arreglo", () => {
  assert.throws(() => agregarIncidencia(null, crearIncidencia(base)), TypeError);
});

// --- Resumen por severidad ---

test("resumirPorSeveridad cuenta el total y el desglose", () => {
  const lista = [
    crearIncidencia({ ...base, severidad: "alta" }),
    crearIncidencia({ ...base, severidad: "alta" }),
    crearIncidencia({ ...base, severidad: "baja" }),
  ];

  const { total, porSeveridad } = resumirPorSeveridad(lista);

  assert.equal(total, 3);
  assert.equal(porSeveridad.alta, 2);
  assert.equal(porSeveridad.baja, 1);
  assert.equal(porSeveridad.media, 0);
  assert.equal(porSeveridad.critica, 0);
});

test("resumirPorSeveridad devuelve ceros con lista vacia", () => {
  const { total, porSeveridad } = resumirPorSeveridad([]);

  assert.equal(total, 0);
  assert.deepEqual(Object.values(porSeveridad), [0, 0, 0, 0]);
});
