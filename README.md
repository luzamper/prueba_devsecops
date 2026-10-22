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
├── src/
│   ├── index.html         Punto de entrada
│   ├── css/
│   │   └── styles.css     Estilos
│   └── js/
│       ├── app.js         Conexion con el DOM
│       └── utils.js       Logica pura (lo que cubren los tests)
├── tests/
│   └── utils.test.js      Tests unitarios
├── .editorconfig
├── .gitignore
└── package.json
```

## Convenciones

- `src/js/utils.js` concentra la logica pura, sin tocar el DOM, para que sea
  verificable desde `node --test`.
- `src/js/app.js` solo se encarga de enlazar esa logica con la interfaz.
- Todo el codigo usa modulos ES (`"type": "module"`).
