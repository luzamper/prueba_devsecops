/**
 * Funciones puras de la aplicacion.
 * Se mantienen sin dependencias del DOM para poder probarlas con node:test.
 */

/** Suma un paso al valor actual del contador. */
export function incrementar(valor, paso = 1) {
  if (!Number.isFinite(valor)) {
    throw new TypeError("valor debe ser un numero finito");
  }
  if (!Number.isFinite(paso)) {
    throw new TypeError("paso debe ser un numero finito");
  }
  return valor + paso;
}

/** Devuelve el valor inicial del contador. */
export function reiniciar() {
  return 0;
}

/** Texto de estado que se muestra en la tarjeta principal. */
export function mensajeEstado(fecha = new Date()) {
  return `Aplicacion activa desde ${fecha.toLocaleTimeString("es-PE")}`;
}
