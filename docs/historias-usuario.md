# Backlog — Historias de usuario

Producto: **Registro de Incidencias**, una aplicación web estática construida
sobre el esqueleto de este repositorio (JavaScript, HTML y CSS sin dependencias
externas). Permite registrar, consultar y dar seguimiento a incidencias
operativas desde el navegador.

> **Supuesto a validar.** El esqueleto actual solo trae un contador de
> demostración, así que este backlog asume el producto descrito arriba. Si la
> capacitación apunta a otro dominio, las historias de plataforma (HU-07 a
> HU-10) se mantienen tal cual y solo cambian las de funcionalidad.

## Convenciones

| Elemento | Formato | Ejemplo |
| --- | --- | --- |
| Historia | `HU-nn` | `HU-03` |
| Criterio de aceptación | `CA-nn.m` | `CA-03.2` |
| Criterio de seguridad | `CS-nn.m` | `CS-03.1` |

Los criterios de aceptación describen **qué debe hacer** la historia; los de
seguridad describen **qué no debe permitir**. Ambos son verificables: cada uno
debe poder convertirse en una prueba automatizada o en un paso reproducible de
revisión manual.

## Resumen

| ID | Historia | Prioridad | Puntos | Estado |
| --- | --- | --- | --- | --- |
| HU-01 | Registrar una incidencia | Alta | 5 | Pendiente |
| HU-02 | Consultar el listado de incidencias | Alta | 3 | Pendiente |
| HU-03 | Filtrar y buscar incidencias | Media | 3 | Pendiente |
| HU-04 | Cambiar el estado de una incidencia | Alta | 5 | Pendiente |
| HU-05 | Conservar las incidencias entre sesiones | Alta | 5 | Pendiente |
| HU-06 | Exportar el registro a CSV | Baja | 3 | Pendiente |
| HU-07 | Servir la aplicación con cabeceras de seguridad | Alta | 3 | **Terminada** |
| HU-08 | Validar cada cambio con un pipeline de CI | Alta | 5 | Pendiente |
| HU-09 | Analizar código, dependencias y secretos en CI | Alta | 8 | Pendiente |
| HU-10 | Usar la aplicación con teclado y lector de pantalla | Media | 5 | Pendiente |

**Total: 45 puntos.**

## Definición de Terminado (global)

Aplica a todas las historias, además de sus criterios propios:

- [ ] Los criterios de aceptación y de seguridad tienen prueba automatizada, o
      un registro escrito de la verificación manual cuando no sea automatizable.
- [ ] `npm test` pasa en verde.
- [ ] El pipeline de CI pasa en verde (una vez exista HU-08).
- [ ] No se incorporan dependencias de producción sin acuerdo previo del equipo.
- [ ] El código nuevo no introduce hallazgos de severidad alta o crítica.
- [ ] La documentación afectada (README, este backlog) queda actualizada.

---

## HU-01 — Registrar una incidencia

**Como** operador de turno
**quiero** registrar una incidencia con su descripción y severidad
**para** dejar constancia del evento en el momento en que ocurre.

### Criterios de aceptación

- **CA-01.1** Dado el formulario vacío, cuando el operador envía sin completar
  el título, entonces el formulario no se envía y se muestra el mensaje
  "El título es obligatorio" junto al campo.
- **CA-01.2** Dado un título válido (entre 3 y 120 caracteres) y una severidad
  seleccionada entre `baja`, `media`, `alta` y `crítica`, cuando el operador
  envía el formulario, entonces la incidencia aparece en el listado con fecha y
  hora de registro.
- **CA-01.3** Dado un envío exitoso, cuando la incidencia se agrega, entonces
  el formulario se limpia y el foco vuelve al campo de título.
- **CA-01.4** Dada una descripción de más de 1000 caracteres, cuando el
  operador intenta enviarla, entonces se rechaza y se indica el límite excedido.
- **CA-01.5** Cada incidencia recibe un identificador único que no se repite ni
  se reutiliza tras eliminar otras incidencias.

### Criterios de seguridad

- **CS-01.1** La validación de longitud, obligatoriedad y severidad se ejecuta
  en la lógica de la aplicación (`src/js/`), no solo mediante atributos HTML
  como `required` o `maxlength`, que el usuario puede desactivar desde las
  herramientas de desarrollo.
- **CS-01.2** La severidad se valida contra una lista cerrada de valores
  permitidos. Un valor fuera de esa lista se rechaza, aunque llegue manipulando
  el DOM.
- **CS-01.3** El identificador se genera con `crypto.randomUUID()`, no con
  `Math.random()` ni con contadores predecibles.
- **CS-01.4** El texto que ingresa el usuario nunca se concatena en HTML. Se
  almacena tal cual y se renderiza según CS-02.1.
- **CS-01.5** El formulario no registra el contenido de las incidencias en la
  consola del navegador, ni siquiera en mensajes de depuración.

---

## HU-02 — Consultar el listado de incidencias

**Como** supervisor
**quiero** ver todas las incidencias registradas ordenadas por fecha
**para** conocer el estado operativo del turno de un vistazo.

### Criterios de aceptación

- **CA-02.1** Dadas varias incidencias registradas, cuando se abre la
  aplicación, entonces se listan de la más reciente a la más antigua.
- **CA-02.2** Cada fila muestra identificador, título, severidad, estado y
  fecha de registro en formato local (`es-PE`).
- **CA-02.3** Dado que no hay ninguna incidencia, cuando se abre la aplicación,
  entonces se muestra el mensaje "Sin incidencias registradas" y no una tabla
  vacía.
- **CA-02.4** El encabezado muestra el total de incidencias y el desglose por
  severidad.
- **CA-02.5** Con 500 incidencias cargadas, el listado se renderiza en menos de
  un segundo en un equipo de escritorio estándar.

### Criterios de seguridad

- **CS-02.1** Todo dato proveniente del usuario se inserta con `textContent` o
  `document.createTextNode()`. Queda prohibido `innerHTML`, `outerHTML`,
  `insertAdjacentHTML`, `document.write` y `eval` sobre datos de usuario.
- **CS-02.2** Una incidencia cuyo título sea
  `<img src=x onerror="alert(1)">` se muestra como texto literal y no ejecuta
  ningún script. Este caso queda cubierto por una prueba automatizada.
- **CS-02.3** El listado no expone campos internos (rutas de archivo, marcas de
  tiempo del sistema, estructuras de almacenamiento) más allá de lo que
  describe CA-02.2.
- **CS-02.4** El renderizado no construye selectores CSS ni expresiones
  regulares a partir de texto del usuario sin escaparlo previamente.

---

## HU-03 — Filtrar y buscar incidencias

**Como** supervisor
**quiero** filtrar las incidencias por texto y por severidad
**para** encontrar rápidamente un evento concreto entre muchos registros.

### Criterios de aceptación

- **CA-03.1** Dado un texto en el campo de búsqueda, cuando el supervisor
  escribe, entonces el listado muestra solo las incidencias cuyo título o
  descripción contienen ese texto, sin distinguir mayúsculas ni acentos.
- **CA-03.2** Dado un filtro de severidad, cuando se selecciona `alta`,
  entonces solo se listan las incidencias de esa severidad.
- **CA-03.3** Los filtros de texto y severidad se combinan: aplicar ambos
  restringe el resultado a las incidencias que cumplen las dos condiciones.
- **CA-03.4** Dado un filtro sin coincidencias, entonces se muestra
  "Ningún resultado para los filtros aplicados" junto a un control para
  limpiarlos.
- **CA-03.5** El filtrado se aplica con un retardo (debounce) de 200 ms desde
  la última pulsación, no en cada tecla.

### Criterios de seguridad

- **CS-03.1** La búsqueda se implementa por comparación de cadenas
  (`String.prototype.includes`), no construyendo un `RegExp` con el texto del
  usuario. Esto evita la denegación de servicio por expresiones regulares
  (ReDoS).
- **CS-03.2** El texto de búsqueda se limita a 120 caracteres antes de
  procesarse.
- **CS-03.3** Los filtros activos no se reflejan en la URL ni en el historial
  del navegador, para no filtrar contenido de incidencias a través de
  referentes o registros de proxy.
- **CS-03.4** El mensaje de "sin resultados" no repite el texto buscado dentro
  del HTML sin aplicar CS-02.1.

---

## HU-04 — Cambiar el estado de una incidencia

**Como** supervisor
**quiero** mover una incidencia entre `abierta`, `en proceso` y `cerrada`
**para** reflejar el avance real de su atención.

### Criterios de aceptación

- **CA-04.1** Dada una incidencia `abierta`, cuando el supervisor la pasa a
  `en proceso`, entonces el listado muestra el nuevo estado y la fecha del
  cambio.
- **CA-04.2** Las transiciones permitidas son `abierta → en proceso`,
  `en proceso → cerrada` y `abierta → cerrada`. Cualquier otra se rechaza.
- **CA-04.3** Dada una incidencia `cerrada`, cuando se intenta reabrir,
  entonces la acción se bloquea y se informa que el estado es final.
- **CA-04.4** Cerrar una incidencia de severidad `crítica` exige confirmación
  explícita antes de aplicarse.
- **CA-04.5** Cada cambio de estado queda asentado en un historial consultable
  con estado anterior, estado nuevo y fecha.

### Criterios de seguridad

- **CS-04.1** La validación de transiciones vive en una función pura de
  `src/js/`, de modo que deshabilitar un botón desde el navegador no permita
  una transición inválida.
- **CS-04.2** El historial de cambios es de solo lectura desde la interfaz: no
  existe ninguna ruta de código que lo edite o lo borre.
- **CS-04.3** El identificador de la incidencia a modificar se valida contra
  las incidencias existentes antes de aplicar el cambio, en lugar de confiar en
  el valor que trae el elemento del DOM.
- **CS-04.4** Una prueba automatizada invoca la lógica de transición
  directamente con cada combinación inválida y confirma que todas se rechazan.

---

## HU-05 — Conservar las incidencias entre sesiones

**Como** operador de turno
**quiero** que las incidencias sigan allí tras recargar o cerrar el navegador
**para** no perder lo registrado durante la jornada.

### Criterios de aceptación

- **CA-05.1** Dadas varias incidencias registradas, cuando se recarga la
  página, entonces se recuperan todas con sus datos intactos.
- **CA-05.2** Dado un almacenamiento vacío o inexistente, cuando se abre la
  aplicación, entonces arranca con el listado vacío y sin errores en consola.
- **CA-05.3** Dado un contenido almacenado corrupto o con formato inválido,
  cuando se abre la aplicación, entonces se descarta, se informa al usuario y
  la aplicación sigue operativa.
- **CA-05.4** Dado que se alcanza la cuota de almacenamiento, cuando se intenta
  guardar, entonces se avisa al usuario y no se pierden las incidencias ya
  registradas.
- **CA-05.5** Existe una acción explícita para borrar todo el registro, con
  confirmación previa.

### Criterios de seguridad

- **CS-05.1** No se almacenan datos personales ni credenciales. Las
  incidencias no incluyen campos de nombre, documento de identidad, teléfono ni
  contraseñas.
- **CS-05.2** El contenido recuperado del almacenamiento se trata como no
  confiable: se valida su estructura campo por campo tras `JSON.parse`, dentro
  de un `try/catch`, antes de usarse.
- **CS-05.3** El `JSON.parse` nunca alimenta directamente al renderizado; pasa
  primero por la validación de CS-05.2 y por el renderizado seguro de CS-02.1.
- **CS-05.4** La validación rechaza claves inesperadas en lugar de copiarlas al
  objeto de la aplicación, evitando contaminación de prototipo
  (`__proto__`, `constructor`, `prototype`).
- **CS-05.5** El borrado del registro elimina efectivamente la clave de
  `localStorage`, sin dejar residuos recuperables desde la consola.

---

## HU-06 — Exportar el registro a CSV

**Como** supervisor
**quiero** descargar las incidencias en un archivo CSV
**para** analizarlas en una hoja de cálculo y adjuntarlas al reporte de turno.

### Criterios de aceptación

- **CA-06.1** Dado el listado con incidencias, cuando se pulsa "Exportar",
  entonces el navegador descarga un archivo `.csv`.
- **CA-06.2** El archivo incluye una fila de encabezados y una fila por
  incidencia, con las mismas columnas que muestra el listado.
- **CA-06.3** Si hay filtros aplicados, la exportación respeta el listado
  visible y el archivo lo indica en su nombre.
- **CA-06.4** El nombre del archivo sigue el patrón
  `incidencias-AAAA-MM-DD.csv`.
- **CA-06.5** Los campos que contienen comas, comillas o saltos de línea se
  escapan según RFC 4180 y el archivo abre correctamente en Excel.

### Criterios de seguridad

- **CS-06.1** Se neutraliza la inyección de fórmulas en CSV: todo campo que
  empiece con `=`, `+`, `-`, `@`, tabulador o retorno de carro se antepone con
  un apóstrofo, de modo que Excel o LibreOffice no lo ejecuten como fórmula.
- **CS-06.2** Una prueba automatizada exporta una incidencia cuyo título sea
  `=cmd|'/c calc'!A1` y verifica que el campo queda neutralizado.
- **CS-06.3** El nombre del archivo se construye solo con la fecha y una
  constante; nunca incorpora texto del usuario que pueda contener separadores
  de ruta.
- **CS-06.4** La descarga se genera en el navegador con `Blob` y una URL de
  objeto que se libera con `URL.revokeObjectURL()` tras usarse. Los datos no se
  envían a ningún servicio externo.

---

## HU-07 — Servir la aplicación con cabeceras de seguridad

**Como** responsable de la plataforma
**quiero** que el servidor envíe cabeceras de seguridad HTTP
**para** reducir el impacto de un fallo de la aplicación en el navegador.

### Criterios de aceptación

- **CA-07.1** Dada una petición a cualquier recurso, cuando el servidor
  responde, entonces incluye `Content-Security-Policy`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` y
  `X-Frame-Options: DENY`.
- **CA-07.2** Con las cabeceras activas, la aplicación sigue funcionando sin
  violaciones de CSP en la consola del navegador.
- **CA-07.3** La política de CSP es `default-src 'self'` y no incluye
  `unsafe-inline` ni `unsafe-eval`.
- **CA-07.4** Existe una prueba automatizada que levanta el servidor, hace una
  petición y verifica cada cabecera.
- **CA-07.5** La protección contra path traversal ya presente en
  `scripts/dev-server.js` queda cubierta por una prueba que confirma la
  respuesta 403.

### Criterios de seguridad

- **CS-07.1** La CSP incluye `frame-ancestors 'none'`, `base-uri 'none'` y
  `form-action 'self'`.
- **CS-07.2** Las respuestas no revelan el software ni la versión del servidor
  en ninguna cabecera.
- **CS-07.3** Las respuestas de error (403, 404) devuelven un mensaje genérico,
  sin rutas del sistema de archivos ni trazas de error.
- **CS-07.4** El servidor solo sirve archivos dentro de `src/`; cualquier
  intento de salir de ese directorio responde 403, incluyendo rutas
  codificadas (`..%2f`) y rutas absolutas.
- **CS-07.5** Se documenta que este servidor es exclusivamente para desarrollo
  local y no debe exponerse en red.

> **Resuelto al implementar.** `src/index.html` usaba
> `<link rel="icon" href="data:,">`, que `default-src 'self'` habría bloqueado.
> Se reemplazó por `src/favicon.svg`, servido desde el propio origen, de modo
> que la CSP no necesita permitir `data:`.

---

## HU-08 — Validar cada cambio con un pipeline de CI

**Como** responsable técnico del equipo
**quiero** que cada push y cada pull request ejecute pruebas automáticas
**para** detectar una regresión antes de que llegue a la rama principal.

### Criterios de aceptación

- **CA-08.1** Dado un push a cualquier rama o un pull request hacia `main`,
  cuando se dispara el pipeline, entonces se ejecutan `npm test` y la
  verificación de formato.
- **CA-08.2** Dada una prueba que falla, cuando termina el pipeline, entonces
  el resultado es rojo y el pull request queda bloqueado para fusión.
- **CA-08.3** El pipeline se ejecuta sobre la versión de Node declarada en
  `engines` del `package.json`.
- **CA-08.4** El pipeline completo termina en menos de tres minutos.
- **CA-08.5** El reporte de cobertura queda disponible como artefacto de la
  ejecución.

### Criterios de seguridad

- **CS-08.1** El token del pipeline se declara con permisos mínimos
  (`permissions: contents: read`), nunca con permisos de escritura por defecto.
- **CS-08.2** Las acciones de terceros se fijan por SHA de commit completo, no
  por etiqueta móvil como `@v4`, que puede reapuntarse.
- **CS-08.3** El pipeline no imprime variables de entorno ni secretos en el
  registro de ejecución.
- **CS-08.4** Los pull requests desde forks no tienen acceso a los secretos del
  repositorio.
- **CS-08.5** La instalación de dependencias usa `npm ci` con el archivo de
  bloqueo, de modo que la ejecución sea reproducible y no incorpore versiones
  no revisadas.

---

## HU-09 — Analizar código, dependencias y secretos en CI

**Como** responsable de seguridad
**quiero** que el pipeline analice el código, las dependencias y los secretos
**para** detectar vulnerabilidades introducidas en el propio flujo de trabajo.

### Criterios de aceptación

- **CA-09.1** Dado un pull request, cuando se ejecuta el pipeline, entonces
  corre un análisis estático (SAST) sobre el código JavaScript.
- **CA-09.2** Dado un hallazgo de severidad alta o crítica, cuando termina el
  análisis, entonces el pipeline falla e identifica archivo y línea.
- **CA-09.3** Se ejecuta `npm audit --audit-level=moderate` y su resultado
  queda registrado.
- **CA-09.4** Se ejecuta un escaneo de secretos sobre el historial del cambio.
- **CA-09.5** Se genera un inventario de componentes (SBOM) como artefacto de
  la ejecución.
- **CA-09.6** Los hallazgos aceptados conscientemente se documentan con
  justificación y fecha de revisión, en lugar de silenciarse sin dejar rastro.

### Criterios de seguridad

- **CS-09.1** El umbral de fallo del pipeline está definido por escrito y no se
  modifica para desbloquear una entrega sin aprobación del responsable de
  seguridad.
- **CS-09.2** El escaneo de secretos cubre el historial de commits del cambio,
  no solo el estado final de los archivos.
- **CS-09.3** Los reportes de hallazgos no se publican en artefactos de acceso
  público mientras no estén corregidos.
- **CS-09.4** Las herramientas de análisis se ejecutan con versión fijada, para
  que un cambio en la herramienta no altere el resultado de forma silenciosa.
- **CS-09.5** Un secreto detectado se trata como comprometido: se rota, no
  basta con borrarlo del código.

---

## HU-10 — Usar la aplicación con teclado y lector de pantalla

**Como** operador que no utiliza el ratón
**quiero** registrar y consultar incidencias usando solo el teclado
**para** trabajar sin depender de un dispositivo señalador.

### Criterios de aceptación

- **CA-10.1** Toda la funcionalidad (registrar, filtrar, cambiar estado,
  exportar) es alcanzable con `Tab`, `Shift+Tab`, `Enter` y `Espacio`.
- **CA-10.2** El foco es visible en todo momento y su recorrido sigue el orden
  lógico de la página.
- **CA-10.3** Cada campo del formulario tiene una etiqueta `<label>` asociada
  mediante el atributo `for`.
- **CA-10.4** Los mensajes de error se asocian al campo con `aria-describedby`
  y se anuncian mediante una región `aria-live`.
- **CA-10.5** El contraste de texto y controles cumple WCAG 2.1 nivel AA
  (relación mínima 4.5:1).
- **CA-10.6** Un diálogo de confirmación atrapa el foco mientras está abierto y
  lo devuelve al control de origen al cerrarse.

### Criterios de seguridad

- **CS-10.1** Los mensajes de error dirigidos al usuario son genéricos: no
  incluyen trazas de error, rutas del sistema de archivos, nombres de clave de
  almacenamiento ni versiones de componentes.
- **CS-10.2** Las acciones destructivas (borrar el registro, cerrar una
  incidencia crítica) exigen una confirmación que no se active con una sola
  pulsación accidental de `Enter`.
- **CS-10.3** La región `aria-live` recibe texto plano mediante `textContent`,
  nunca HTML construido con datos del usuario.
- **CS-10.4** Ningún control queda oculto a la vista pero accesible por
  teclado: no existen accesos a funciones que la interfaz pretenda ocultar.

---

## Riesgos y dependencias

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| HU-05 guarda datos en el navegador sin cifrado | Medio | CS-05.1 prohíbe datos personales; si el alcance cambia, revisar la historia antes de implementarla. |
| HU-09 puede bloquear entregas por hallazgos en dependencias transitivas | Medio | CA-09.6 exige documentar las excepciones con fecha de revisión. |
| El proyecto no tiene dependencias de producción hoy | Bajo | HU-09 mantiene su valor sobre las dependencias de desarrollo y el propio código. |

### Orden sugerido

1. **HU-07** y **HU-08** primero: el pipeline y las cabeceras protegen todo lo
   que venga después, y el costo de añadirlos crece con el tamaño del código.
2. **HU-01**, **HU-02** y **HU-05**: el núcleo funcional mínimo.
3. **HU-09**: con código real que analizar, los hallazgos son significativos.
4. **HU-03**, **HU-04**, **HU-10** y **HU-06**: el resto, por prioridad.
