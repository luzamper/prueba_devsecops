# prueba_devsecops

Proyecto base para la capacitacion DevSecOps. Aplicacion web estatica hecha
unicamente con **JavaScript, HTML y CSS**, sin dependencias externas: el
servidor de desarrollo y los tests usan solo modulos nativos de Node.

## Requisitos

- Node.js >= 20 (probado con v25)
- npm

## Scripts

| Comando                 | Descripcion                                      |
| ----------------------- | ------------------------------------------------ |
| `npm start`             | Levanta el servidor estatico en `localhost:3000` |
| `npm run dev`           | Igual que `start`, con recarga del servidor      |
| `npm test`              | Ejecuta los tests (`node --test`)                |
| `npm run test:coverage` | Tests con reporte de cobertura                   |
| `npm run verificar`     | Sintaxis y formato segun `.editorconfig`         |
| `npm run audit`         | Auditoria de dependencias                        |

El puerto se puede cambiar: `npm start -- 8080` o con la variable `PORT`.

## Estructura

```
.
├── scripts/
│   ├── dev-server.js      Servidor estatico de desarrollo (Node nativo)
│   └── verificar.js       Verificacion de sintaxis y formato
├── .github/
│   └── workflows/
│       ├── ci.yml         Pipeline de integracion continua
│       └── dependencias.yml  Analisis de dependencias
├── docs/
│   └── historias-usuario.md  Backlog con criterios de aceptacion y seguridad
├── src/
│   ├── index.html         Punto de entrada
│   ├── favicon.svg        Icono del sitio
│   ├── css/
│   │   └── styles.css     Estilos
│   └── js/
│       ├── app.js         Conexion con el DOM
│       └── utils.js       Logica pura (lo que cubren los tests)
├── tests/
│   ├── dev-server.test.js Cabeceras de seguridad y path traversal
│   └── utils.test.js      Tests unitarios
├── .editorconfig
├── .gitignore
└── package.json
```

## Integracion continua

`.github/workflows/ci.yml` se ejecuta en cada push a `main`, en cada pull
request hacia `main` y a peticion (`workflow_dispatch`):

- **pruebas**: matriz de Node 20, 22 y 24 (el minimo de `engines` y las
  versiones vigentes). Instala con `npm ci`, verifica sintaxis y formato, y
  ejecuta los tests. Si algo falla, el job queda en rojo.
- **cobertura**: genera `lcov.info` y lo publica como artefacto de la
  ejecucion, con retencion de 7 dias.

Medidas aplicadas (HU-08):

- Permisos minimos: `contents: read`.
- Acciones de terceros fijadas por SHA de commit completo, no por etiqueta
  movil como `@v7`, que puede reapuntarse a otro codigo.
- Se usa `pull_request` y no `pull_request_target`, de modo que los pull
  requests desde un fork corran sin acceso a los secretos del repositorio.
- Instalacion reproducible con `npm ci` a partir de `package-lock.json`.
- El workflow no usa ni imprime secretos ni variables de entorno.

## Analisis de dependencias

`.github/workflows/dependencias.yml` se ejecuta en cada push a `main`, en cada
pull request hacia `main`, a peticion y **cada lunes** (los CVE se publican
despues de fusionar el codigo, asi que un repositorio sin cambios tambien se
audita):

- **auditoria**: `npm audit --audit-level=moderate` sobre `package-lock.json`.
  Falla ante hallazgos moderate o superiores y publica el informe JSON como
  artefacto.
- **revision** (solo en pull requests): `dependency-review-action` compara la
  rama con la base y bloquea las dependencias nuevas con vulnerabilidades.

El proyecto no tiene dependencias, de modo que hoy ambos jobs pasan sin
hallazgos. Para verlos fallar, agregar en una rama de prueba una dependencia con
un CVE conocido.

## Seguridad del servidor de desarrollo

`scripts/dev-server.js` es **exclusivamente para desarrollo local y no debe
exponerse en red**. Aun asi aplica las medidas de HU-07:

- Cabeceras en toda respuesta, incluidas las de error: `Content-Security-Policy`
  (`default-src 'self'`, sin `unsafe-inline` ni `unsafe-eval`),
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` y
  `X-Frame-Options: DENY`.
- Solo sirve archivos dentro de `src/`; salir de ahi responde 403, incluyendo
  rutas codificadas (`..%2f`) y rutas absolutas.
- Los errores devuelven mensajes genericos, sin rutas del sistema ni trazas.
- No revela el software ni la version del servidor.

Todo lo anterior esta cubierto por `tests/dev-server.test.js`.

## Convenciones

- `src/js/utils.js` concentra la logica pura, sin tocar el DOM, para que sea
  verificable desde `node --test`.
- `src/js/app.js` solo se encarga de enlazar esa logica con la interfaz.
- Todo el codigo usa modulos ES (`"type": "module"`).
