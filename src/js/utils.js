/**
 * Funciones puras de uso general.
 * Se mantienen sin dependencias del DOM para poder probarlas con node:test.
 */

/** Texto de estado que se muestra en la tarjeta principal. */
export function mensajeEstado(fecha = new Date()) {
  return `Aplicacion activa desde ${fecha.toLocaleTimeString("es-PE")}`;
}
