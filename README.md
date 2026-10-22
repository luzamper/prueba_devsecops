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
| `npm test`              | Ejecuta los tests unitarios (`node --test`)      |
| `npm run test:coverage` | Tests con reporte de cobertura                   |
| `npm run audit`         | Auditoria de dependencias                        |

El puerto se puede cambiar: `npm start -- 8080` o con la variable `PORT`.

## Estructura

```
.
├── scripts/
│   └── dev-server.js      Servidor estatico de desarrollo (Node nativo)
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
