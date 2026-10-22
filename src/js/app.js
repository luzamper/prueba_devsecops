import { mensajeEstado } from "./utils.js";
import {
  agregarIncidencia,
  crearIncidencia,
  resumirPorSeveridad,
  validarIncidencia,
} from "./incidencias.js";

const refs = {
  estado: document.getElementById("status"),
  formulario: document.getElementById("form-incidencia"),
  titulo: document.getElementById("titulo"),
  descripcion: document.getElementById("descripcion"),
  severidad: document.getElementById("severidad"),
  resumen: document.getElementById("resumen"),
  listado: document.getElementById("listado"),
};

const errores = {
  titulo: document.getElementById("error-titulo"),
  descripcion: document.getElementById("error-descripcion"),
  severidad: document.getElementById("error-severidad"),
};

let incidencias = [];

/** Limpia los mensajes de error de todos los campos. */
function limpiarErrores() {
  for (const campo of Object.keys(errores)) {
    errores[campo].textContent = "";
    refs[campo].removeAttribute("aria-invalid");
  }
}

/** Muestra los errores devueltos por la validacion. */
function pintarErrores(detalle) {
  for (const [campo, mensaje] of Object.entries(detalle)) {
    if (!errores[campo]) continue;
    // textContent, nunca innerHTML (CS-01.4).
    errores[campo].textContent = mensaje;
    refs[campo].setAttribute("aria-invalid", "true");
  }
}

/** Construye la fila de una incidencia solo con nodos de texto (CS-01.4). */
function construirFila(incidencia) {
  const fila = document.createElement("li");
  fila.className = "listado__fila";

  const titulo = document.createElement("span");
  titulo.className = "listado__titulo";
  titulo.textContent = incidencia.titulo;

  const severidad = document.createElement("span");
  severidad.className = `etiqueta etiqueta--${incidencia.severidad}`;
  severidad.textContent = incidencia.severidad;

  const fecha = document.createElement("time");
  fecha.className = "listado__fecha";
  fecha.dateTime = incidencia.registrada;
  fecha.textContent = new Date(incidencia.registrada).toLocaleString("es-PE");

  fila.append(titulo, severidad, fecha);

  if (incidencia.descripcion) {
    const descripcion = document.createElement("p");
    descripcion.className = "listado__descripcion";
    descripcion.textContent = incidencia.descripcion;
    fila.append(descripcion);
  }

  return fila;
}

/** Repinta el resumen y el listado completo. */
function pintarListado() {
  refs.listado.replaceChildren();

  if (incidencias.length === 0) {
    refs.resumen.textContent = "Sin incidencias registradas";
    return;
  }

  const { total, porSeveridad } = resumirPorSeveridad(incidencias);
  const desglose = Object.entries(porSeveridad)
    .filter(([, cantidad]) => cantidad > 0)
    .map(([severidad, cantidad]) => `${cantidad} ${severidad}`)
    .join(", ");

  refs.resumen.textContent = `${total} incidencia(s): ${desglose}`;
  refs.listado.append(...incidencias.map(construirFila));
}

/** Procesa el envio del formulario. */
function alEnviar(evento) {
  evento.preventDefault();
  limpiarErrores();

  const datos = {
    titulo: refs.titulo.value,
    descripcion: refs.descripcion.value,
    severidad: refs.severidad.value,
  };

  const { valido, errores: detalle } = validarIncidencia(datos);
  if (!valido) {
    pintarErrores(detalle);
    const primero = Object.keys(detalle)[0];
    refs[primero]?.focus();
    return;
  }

  incidencias = agregarIncidencia(incidencias, crearIncidencia(datos));
  refs.formulario.reset();
  pintarListado();
  refs.titulo.focus();
}

function iniciar() {
  refs.estado.textContent = mensajeEstado();
  refs.formulario.addEventListener("submit", alEnviar);
  pintarListado();
}

document.addEventListener("DOMContentLoaded", iniciar);
