/**
 * Logica pura del registro de incidencias (HU-01).
 *
 * No toca el DOM: se puede verificar completa desde node:test.
 */

/** Valores admitidos de severidad (CS-01.2: lista cerrada). */
export const SEVERIDADES = Object.freeze(["baja", "media", "alta", "critica"]);

/** Estados admitidos de una incidencia. */
export const ESTADOS = Object.freeze(["abierta", "en proceso", "cerrada"]);

export const LIMITES = Object.freeze({
  tituloMinimo: 3,
  tituloMaximo: 120,
  descripcionMaxima: 1000,
});

/**
 * Valida los datos de una incidencia.
 * La validacion vive aqui, no en los atributos del HTML, porque el usuario
 * puede desactivarlos desde las herramientas de desarrollo (CS-01.1).
 *
 * @returns {{ valido: boolean, errores: Record<string, string> }}
 */
export function validarIncidencia({ titulo, descripcion, severidad } = {}) {
  const errores = {};

  const tituloNormalizado = typeof titulo === "string" ? titulo.trim() : "";
  if (tituloNormalizado.length === 0) {
    errores.titulo = "El titulo es obligatorio";
  } else if (tituloNormalizado.length < LIMITES.tituloMinimo) {
    errores.titulo = `El titulo necesita al menos ${LIMITES.tituloMinimo} caracteres`;
  } else if (tituloNormalizado.length > LIMITES.tituloMaximo) {
    errores.titulo = `El titulo supera los ${LIMITES.tituloMaximo} caracteres`;
  }

  const descripcionNormalizada =
    typeof descripcion === "string" ? descripcion.trim() : "";
  if (descripcionNormalizada.length > LIMITES.descripcionMaxima) {
    errores.descripcion = `La descripcion supera los ${LIMITES.descripcionMaxima} caracteres`;
  }

  if (!SEVERIDADES.includes(severidad)) {
    errores.severidad = "Seleccione una severidad valida";
  }

  return { valido: Object.keys(errores).length === 0, errores };
}

/** Genera un identificador sin valor predecible (CS-01.3). */
function generarIdentificador() {
  return globalThis.crypto.randomUUID();
}

/**
 * Construye una incidencia a partir de datos ya validados.
 * Lanza si los datos no son validos: nunca se crea una incidencia invalida.
 */
export function crearIncidencia(datos, fecha = new Date()) {
  const { valido, errores } = validarIncidencia(datos);
  if (!valido) {
    throw new TypeError(`Datos invalidos: ${Object.values(errores).join("; ")}`);
  }

  return Object.freeze({
    id: generarIdentificador(),
    titulo: datos.titulo.trim(),
    descripcion: typeof datos.descripcion === "string" ? datos.descripcion.trim() : "",
    severidad: datos.severidad,
    estado: ESTADOS[0],
    registrada: fecha.toISOString(),
  });
}

/**
 * Devuelve una lista nueva con la incidencia al inicio.
 * No muta la lista recibida.
 */
export function agregarIncidencia(lista, incidencia) {
  if (!Array.isArray(lista)) {
    throw new TypeError("lista debe ser un arreglo");
  }
  return [incidencia, ...lista];
}

/** Total de incidencias y desglose por severidad. */
export function resumirPorSeveridad(lista) {
  const resumen = Object.fromEntries(SEVERIDADES.map((s) => [s, 0]));
  for (const incidencia of lista) {
    if (incidencia.severidad in resumen) {
      resumen[incidencia.severidad] += 1;
    }
  }
  return { total: lista.length, porSeveridad: resumen };
}
