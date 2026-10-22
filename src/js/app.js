import { incrementar, reiniciar, mensajeEstado } from "./utils.js";

const refs = {
  estado: document.getElementById("status"),
  contador: document.getElementById("counter"),
  sumar: document.getElementById("increment"),
  reiniciar: document.getElementById("reset"),
};

let valor = reiniciar();

function pintarContador() {
  refs.contador.textContent = String(valor);
}

function iniciar() {
  refs.estado.textContent = mensajeEstado();
  pintarContador();

  refs.sumar.addEventListener("click", () => {
    valor = incrementar(valor);
    pintarContador();
  });

  refs.reiniciar.addEventListener("click", () => {
    valor = reiniciar();
    pintarContador();
  });
}

document.addEventListener("DOMContentLoaded", iniciar);
