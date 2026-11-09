# Issues QA - Front_Beca_Cujae + Back_Beca_Cujae
Fecha: 2026-11-07
Entorno: Windows, Node 24.22.1, Python 3.12.10, Postgres local 5432, FastAPI backend, Vue 3 + Pinia.
Nota: No se modificó código fuente ni se hicieron commits. Se crearon solo archivos de evidencia/reporte en `docs/evidencias/qa-2026-11-07/`.

## Resumen de ejecución
- Vitest: 8 archivos, 43 pruebas, 0 fallos.
- Backend pytest: 129 pruebas recopiladas. No se pudo completar la suite completa por bloqueos de entorno y sintaxis del backend. `tests/test_login.py::test_me_devuelve_permisos` pasa tras corregir objetos faltantes en la base de prueba.
- Playwright E2E: no se ejecutó contra el backend real porque los navegadores de Playwright no se pudieron descargar (403 Access denied desde la ubicación). Está instalado Microsoft Edge, pero `playwright.config.ts` no lo configura como canal.
- Prueba manual de estudiantes: no se completó contra el backend real por los bloqueos de backend/Playwright descritos abajo.

## Issues encontrados

### ISS-001 | Crítico | Backend: sintaxis inválida en `app/api/deps.py:49` y `app/api/idempotencia.py:49`
`except InvalidTokenError, KeyError, ValueError:` no es válido en Python 3; debe ser `except (InvalidTokenError, KeyError, ValueError):`.
Evidadencia: `python -m py_compile backend/app/api/deps.py` y `backend/app/api/idempotencia.py` fallan.
Impacto: El backend FastAPI no arranca; las pruebas de backend y el flujo real de estudiantes no se pueden validar.
Reproducir:
1. `python -m py_compile Back_Beca_Cujae/backend/app/api/deps.py`
2. `python -m py_compile Back_Beca_Cujae/backend/app/api/idempotencia.py`

### ISS-002 | Alta | Backend: falta tabla `refresh_token` en la base de prueba
El login de root falla con 500 `relation "refresh_token" does not exist`.
El backend consulta/inserta en `refresh_token`, pero la base de prueba creada con scripts iniciales no la tiene.
Evidadencia: log de backend en `docs/evidencias/qa-2026-11-07/` (start.err.log) con trace de SQLAlchemy/asyncpg.
Reproducir:
1. Levantar backend con base de prueba actual.
2. `POST /api/v1/login/access-token` con `root` / contraseña de administrador.
Resultado esperado: 200 y token. Resultado real: 500 `relation "refresh_token" does not exist`.

### ISS-003 | Alta | Backend: falta columna `usuario.correo_alternativo`
Después de agregar `refresh_token`, el endpoint de sesión falla con `column u.correo_alternativo does not exist`.
El modelo/consulta `usuario_del_token` usa `correo_alternativo`, pero la tabla `usuario` no la tiene.
Evidadencia: trace de backend en `start.err.log`; prueba `tests/test_login.py::test_me_devuelve_permisos` fallaba con 500 antes de agregar la columna.
Reproducir:
1. Agregar columna: `ALTER TABLE usuario ADD COLUMN correo_alternativo varchar(254);`
2. Ejecutar `pytest tests/test_login.py`.

### ISS-004 | Media | Backend: pruebas pytest no se completan
Se recopilaron 129 pruebas. La ejecución completa se detiene/queda colgada y no genera reporte final.
Evidadencia: `docs/evidencias/qa-2026-11-07/tests-backend/pytest.log` y `pytest.err.log`.
Impacto: No se puede afirmar que el backend esté listo para producción.
Reproducir:
1. `cd Back_Beca_Cujae/backend`
2. `python -m pytest tests -q`

### ISS-005 | Media | Playwright: navegadores no disponibles / descarga bloqueada
`npx playwright install chromium` falla con `403 Access denied` desde la ubicación. `ms-playwright` solo tiene `.links`, sin binarios de Chromium.
Impacto: No se pueden ejecutar `npm run test:e2e` en desktop ni móvil tal como está configurado `playwright.config.ts`.
Reproducir:
1. `npx playwright install chromium`
2. `npm run test:e2e`

### ISS-006 | Media | Playwright: `playwright.config.ts` no cubre móvil ni Edge instalado
El config solo define escritorio Chromium. Está instalado Microsoft Edge en `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`, pero no se usa como canal.
Impacto: No hay cobertura móvil automatizada ni uso del navegador disponible.

### ISS-007 | Medio | Backend: `pyproject.toml` requiere Python >=3.14, pero el entorno disponible es Python 3.12
Se instalaron dependencias en Python 3.12 para probar, pero el proyecto declara `requires-python = ">=3.14,<4.0"`.
Impacto: Riesgo de incompatibilidades en entornos de producción/desarrollo.

## Evidencia generada
- `docs/evidencias/qa-2026-11-07/tests-vitest/vitest.log`: 43 pruebas pasadas.
- `docs/evidencias/qa-2026-11-07/tests-backend/pytest.log` / `pytest.err.log`: ejecución parcial de backend.
- `docs/evidencias/qa-2026-11-07/screenshots/`: sin capturas (no se pudo abrir el navegador automatizado).
- `docs/evidencias/qa-2026-11-07/ISSUES.md`: este archivo.

## Recomendación inmediata
1. Corregir la sintaxis `except` en `deps.py` e `idempotencia.py` (no es cambio de lógica, solo compatibilidad Python 3).
2. Aplicar en la base de prueba los objetos faltantes: tabla `refresh_token` y columna `usuario.correo_alternativo`.
3. Configurar Playwright para usar Edge (`channel: 'msedge'`) o instalar Chromium desde una ubicación accesible; agregar proyecto móvil si se requiere.
4. Completar ejecución de pytest y Playwright tras los arreglos anteriores.

## Resultados QA Edificios - 2026-11-09T15:42:25.964Z
Pasaron 0/10 casos.

- **CP-01 Abrir modal "Nuevo edificio"**: FALLÓ — Falta combo Estado constructivo (consola:0 red:123)
- **CP-02 Combo estados constructivos con opciones**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:2)
- **CP-03 Registrar edificio**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:2)
- **CP-04 Ver detalle de edificio**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:2)
- **CP-05 Crear escalera**: FALLÓ — page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
[2m  - navigating to "http://localhost:5173/login", waiting until "networkidle"[22m
 (consola:0 red:0)
- **CP-06 Crear cuarto**: FALLÓ — page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
[2m  - navigating to "http://localhost:5173/login", waiting until "networkidle"[22m
 (consola:0 red:0)
- **CP-07 Editar edificio**: FALLÓ — page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
[2m  - navigating to "http://localhost:5173/login", waiting until "networkidle"[22m
 (consola:0 red:0)
- **CP-08 Eliminar edificio sin escaleras**: FALLÓ — page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
[2m  - navigating to "http://localhost:5173/login", waiting until "networkidle"[22m
 (consola:0 red:0)
- **CP-09 Error al eliminar edificio con escaleras**: FALLÓ — page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
[2m  - navigating to "http://localhost:5173/login", waiting until "networkidle"[22m
 (consola:0 red:0)
- **CP-10 Control de permisos (estudiante no puede crear edificios)**: FALLÓ — page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
[2m  - navigating to "http://localhost:5173/login", waiting until "networkidle"[22m
 (consola:0 red:0)
## Resultados QA Edificios - 2026-11-09T15:49:09.669Z
Pasaron 0/10 casos.

- **[object Object]**: FALLÓ — fn is not a function (consola:0 red:0)
- **[object Object]**: FALLÓ — fn is not a function (consola:0 red:0)
- **[object Object]**: FALLÓ — fn is not a function (consola:0 red:0)
- **[object Object]**: FALLÓ — fn is not a function (consola:0 red:0)
- **[object Object]**: FALLÓ — fn is not a function (consola:0 red:0)
- **[object Object]**: FALLÓ — fn is not a function (consola:0 red:0)
- **[object Object]**: FALLÓ — fn is not a function (consola:0 red:0)
- **[object Object]**: FALLÓ — fn is not a function (consola:0 red:0)
- **[object Object]**: FALLÓ — fn is not a function (consola:0 red:0)
- **[object Object]**: FALLÓ — fn is not a function (consola:0 red:0)
## Resultados QA Edificios - 2026-11-09T15:50:07.516Z
Pasaron 0/10 casos.

- **[object Object]**: FALLÓ — fn is not a function (consola:0 red:0)
- **[object Object]**: FALLÓ — fn is not a function (consola:0 red:0)
- **[object Object]**: FALLÓ — fn is not a function (consola:0 red:0)
- **[object Object]**: FALLÓ — fn is not a function (consola:0 red:0)
- **[object Object]**: FALLÓ — fn is not a function (consola:0 red:0)
- **[object Object]**: FALLÓ — fn is not a function (consola:0 red:0)
- **[object Object]**: FALLÓ — fn is not a function (consola:0 red:0)
- **[object Object]**: FALLÓ — fn is not a function (consola:0 red:0)
- **[object Object]**: FALLÓ — fn is not a function (consola:0 red:0)
- **[object Object]**: FALLÓ — fn is not a function (consola:0 red:0)
## Resultados QA Edificios - 2026-11-09T15:54:09.238Z
Pasaron 0/10 casos.

- **CP-01 Abrir modal "Nuevo edificio"**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('h1:has-text("Gestión de edificios")') to be visible[22m
 (consola:0 red:35)
- **CP-02 Combo estados constructivos con opciones**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('h1:has-text("Gestión de edificios")') to be visible[22m
 (consola:0 red:37)
- **CP-03 Registrar edificio**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('h1:has-text("Gestión de edificios")') to be visible[22m
 (consola:0 red:4)
- **CP-04 Ver detalle de edificio**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('h1:has-text("Gestión de edificios")') to be visible[22m
 (consola:0 red:6)
- **CP-05 Crear escalera**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('h1:has-text("Gestión de edificios")') to be visible[22m
 (consola:0 red:4)
- **CP-06 Crear cuarto**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('h1:has-text("Gestión de edificios")') to be visible[22m
 (consola:0 red:4)
- **CP-07 Editar edificio**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('h1:has-text("Gestión de edificios")') to be visible[22m
 (consola:0 red:70)
- **CP-08 Eliminar edificio sin escaleras**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('h1:has-text("Gestión de edificios")') to be visible[22m
 (consola:0 red:4)
- **CP-09 Error al eliminar edificio con escaleras**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('h1:has-text("Gestión de edificios")') to be visible[22m
 (consola:0 red:4)
- **CP-10 Control de permisos (estudiante no puede crear edificios)**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('h1:has-text("Gestión de edificios")') to be visible[22m
 (consola:0 red:41)
## Resultados QA Edificios - 2026-11-09T16:00:19.431Z
Pasaron 0/10 casos.

- **CP-01 Abrir modal "Nuevo edificio"**: FALLÓ — page.waitForSelector: Timeout 10000ms exceeded.
Call log:
[2m  - waiting for locator('dialog:has-text("Nuevo edificio")') to be visible[22m
 (consola:0 red:123)
- **CP-02 Combo estados constructivos con opciones**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:2)
- **CP-03 Registrar edificio**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:2)
- **CP-04 Ver detalle de edificio**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:2)
- **CP-05 Crear escalera**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:40)
- **CP-06 Crear cuarto**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:2)
- **CP-07 Editar edificio**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:2)
- **CP-08 Eliminar edificio sin escaleras**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:40)
- **CP-09 Error al eliminar edificio con escaleras**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:2)
- **CP-10 Control de permisos (estudiante no puede crear edificios)**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:2)
## Resultados QA Edificios - 2026-11-09T16:08:11.746Z
Pasaron 0/10 casos.

- **CP-01 Abrir modal "Nuevo edificio"**: FALLÓ — page.waitForSelector: Timeout 10000ms exceeded.
Call log:
[2m  - waiting for locator('dialog:has-text("Nuevo edificio")') to be visible[22m
 (consola:0 red:123)
- **CP-02 Combo estados constructivos con opciones**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:2)
- **CP-03 Registrar edificio**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:2)
- **CP-04 Ver detalle de edificio**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:122)
- **CP-05 Crear escalera**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:2)
- **CP-06 Crear cuarto**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:41)
- **CP-07 Editar edificio**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:2)
- **CP-08 Eliminar edificio sin escaleras**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:2)
- **CP-09 Error al eliminar edificio con escaleras**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:41)
- **CP-10 Control de permisos (estudiante no puede crear edificios)**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:2)
## Resultados QA Edificios - 2026-11-09T16:15:13.816Z
Pasaron 0/10 casos.

- **CP-01 Abrir modal "Nuevo edificio"**: FALLÓ — page.waitForSelector: Timeout 10000ms exceeded.
Call log:
[2m  - waiting for locator('dialog:has-text("Nuevo edificio")') to be visible[22m
 (consola:0 red:148)
- **CP-02 Combo estados constructivos con opciones**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:2)
- **CP-03 Registrar edificio**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:122)
- **CP-04 Ver detalle de edificio**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:2)
- **CP-05 Crear escalera**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:2)
- **CP-06 Crear cuarto**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:2)
- **CP-07 Editar edificio**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:2)
- **CP-08 Eliminar edificio sin escaleras**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:40)
- **CP-09 Error al eliminar edificio con escaleras**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:2)
- **CP-10 Control de permisos (estudiante no puede crear edificios)**: FALLÓ — page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m
 (consola:0 red:2)
## QA Edificios - 2026-11-09T16:17:49.751Z
Pasaron 0/11 casos.

- **[object Object]**: fn is not a function
- **[object Object]**: fn is not a function
- **[object Object]**: fn is not a function
- **[object Object]**: fn is not a function
- **[object Object]**: fn is not a function
- **[object Object]**: fn is not a function
- **[object Object]**: fn is not a function
- **[object Object]**: fn is not a function
- **[object Object]**: fn is not a function
- **[object Object]**: fn is not a function
- **[object Object]**: fn is not a function
## QA Edificios - 2026-11-09T16:20:10.049Z
Pasaron 2/11 casos.

- **CP-02 combo estados constructivos**: sin botón
- **CP-03 registrar edificio**: sin botón
- **CP-04 ver detalle edificio**: sin edificios
- **CP-05 crear escalera**: sin edificios
- **CP-06 crear cuarto**: sin edificios
- **CP-07 editar edificio**: sin botón editar
- **CP-08 eliminar edificio sin escaleras**: sin botón nuevo edificio
- **CP-09 eliminar edificio con escaleras bloqueado**: sin botón nuevo edificio
- **CP-10 permisos estudiante**: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m

## QA Edificios - 2026-11-09T16:25:44.214Z
Pasaron 2/11 casos.

- **CP-02 combo estados constructivos**: sin botón
- **CP-03 registrar edificio**: sin botón
- **CP-04 ver detalle edificio**: sin edificios
- **CP-05 crear escalera**: sin edificios
- **CP-06 crear cuarto**: sin edificios
- **CP-07 editar edificio**: sin botón editar
- **CP-08 eliminar edificio sin escaleras**: sin botón nuevo edificio
- **CP-09 eliminar edificio con escaleras bloqueado**: sin botón nuevo edificio
- **CP-10 permisos estudiante**: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m

## QA Edificios - 2026-11-09T16:27:54.072Z
Pasaron 2/11 casos.

- **CP-02 combo estados constructivos**: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
[2m  - waiting for locator('dialog:has-text("Nuevo edificio")') to be visible[22m

- **CP-03 registrar edificio**: sin botón
- **CP-04 ver detalle edificio**: sin edificios
- **CP-05 crear escalera**: sin edificios
- **CP-06 crear cuarto**: sin edificios
- **CP-07 editar edificio**: sin botón editar
- **CP-08 eliminar edificio sin escaleras**: sin botón nuevo edificio
- **CP-09 eliminar edificio con escaleras bloqueado**: sin botón nuevo edificio
- **CP-10 permisos estudiante**: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m

## QA Edificios - 2026-11-09T16:31:48.109Z
Pasaron 2/11 casos.

- **CP-02 combo estados constructivos**: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
[2m  - waiting for locator('dialog:has-text("Nuevo edificio")') to be visible[22m

- **CP-03 registrar edificio**: sin botón
- **CP-04 ver detalle edificio**: sin edificios
- **CP-05 crear escalera**: sin edificios
- **CP-06 crear cuarto**: sin edificios
- **CP-07 editar edificio**: sin botón editar
- **CP-08 eliminar edificio sin escaleras**: sin botón nuevo edificio
- **CP-09 eliminar edificio con escaleras bloqueado**: sin botón nuevo edificio
- **CP-10 permisos estudiante**: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m

## QA Edificios - 2026-11-09T16:33:59.473Z
Pasaron 2/11 casos.

- **CP-02 combo estados constructivos**: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
[2m  - waiting for locator('dialog:has-text("Nuevo edificio")') to be visible[22m

- **CP-03 registrar edificio**: sin botón
- **CP-04 ver detalle edificio**: sin edificios
- **CP-05 crear escalera**: sin edificios
- **CP-06 crear cuarto**: sin edificios
- **CP-07 editar edificio**: sin botón editar
- **CP-08 eliminar edificio sin escaleras**: sin botón nuevo edificio
- **CP-09 eliminar edificio con escaleras bloqueado**: sin botón nuevo edificio
- **CP-10 permisos estudiante**: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m

## QA Edificios - 2026-11-09T16:35:52.646Z
Pasaron 2/11 casos.

- **CP-01 abrir modal Nuevo edificio**: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('h1:has-text("Gestión de edificios")') to be visible[22m

- **CP-02 combo estados constructivos**: sin botón
- **CP-03 registrar edificio**: sin botón
- **CP-04 ver detalle edificio**: sin edificios
- **CP-05 crear escalera**: sin edificios
- **CP-06 crear cuarto**: sin edificios
- **CP-07 editar edificio**: sin botón editar
- **CP-08 eliminar edificio sin escaleras**: sin botón nuevo edificio
- **CP-09 eliminar edificio con escaleras bloqueado**: sin botón nuevo edificio
## QA Edificios - 2026-11-09T16:44:04.478Z
Pasaron 2/11 casos.

- **CP-02 combo estados constructivos**: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
[2m  - waiting for locator('dialog:has-text("Nuevo edificio")') to be visible[22m

- **CP-03 registrar edificio**: sin botón
- **CP-04 ver detalle edificio**: sin edificios
- **CP-05 crear escalera**: sin edificios
- **CP-06 crear cuarto**: sin edificios
- **CP-07 editar edificio**: sin botón editar
- **CP-08 eliminar edificio sin escaleras**: sin botón nuevo edificio
- **CP-09 eliminar edificio con escaleras bloqueado**: sin botón nuevo edificio
- **CP-10 permisos estudiante**: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('input[id="username"]') to be visible[22m

## QA Edificios - 2026-11-09T16:48:02.971Z
Pasaron 2/11 casos.

- **CP-01 abrir modal Nuevo edificio**: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('h1:has-text("Gestión de edificios")') to be visible[22m

- **CP-02 combo estados constructivos**: sin botón
- **CP-03 registrar edificio**: sin botón
- **CP-04 ver detalle edificio**: sin edificios
- **CP-05 crear escalera**: sin edificios
- **CP-06 crear cuarto**: sin edificios
- **CP-07 editar edificio**: sin botón editar
- **CP-08 eliminar edificio sin escaleras**: sin botón nuevo edificio
- **CP-09 eliminar edificio con escaleras bloqueado**: sin botón nuevo edificio
## QA Edificios - 2026-11-09T16:51:08.634Z
Pasaron 3/10 casos.

- **CP-02 combo estados constructivos**: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
[2m  - waiting for locator('dialog:has-text("Nuevo edificio")') to be visible[22m

- **CP-03 registrar edificio**: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
[2m  - waiting for locator('dialog:has-text("Nuevo edificio")') to be visible[22m

- **CP-04 ver detalle edificio**: no detalle:http://localhost:5173/infraestructura/edificios
- **CP-05 crear escalera**: sin botón agregar escalera
- **CP-06 crear cuarto**: sin escaleras
- **CP-08 eliminar edificio sin escaleras**: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
[2m  - waiting for locator('dialog:has-text("Nuevo edificio")') to be visible[22m

- **CP-09 eliminar edificio con escaleras bloqueado**: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
[2m  - waiting for locator('dialog:has-text("Nuevo edificio")') to be visible[22m

## QA Edificios - 2026-11-09T16:54:12.038Z
Pasaron 0/10 casos.

- **CP-01 login + abrir modal Nuevo edificio**: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
[2m  - navigating to "http://localhost:5173/login", waiting until "domcontentloaded"[22m

- **CP-02 combo estados constructivos**: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
[2m  - navigating to "http://localhost:5173/login", waiting until "domcontentloaded"[22m

- **CP-03 registrar edificio**: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
[2m  - navigating to "http://localhost:5173/login", waiting until "domcontentloaded"[22m

- **CP-04 ver detalle edificio**: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
[2m  - navigating to "http://localhost:5173/login", waiting until "domcontentloaded"[22m

- **CP-05 crear escalera**: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
[2m  - navigating to "http://localhost:5173/login", waiting until "domcontentloaded"[22m

- **CP-06 crear cuarto**: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
[2m  - navigating to "http://localhost:5173/login", waiting until "domcontentloaded"[22m

- **CP-07 editar edificio**: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
[2m  - navigating to "http://localhost:5173/login", waiting until "domcontentloaded"[22m

- **CP-08 eliminar edificio sin escaleras**: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
[2m  - navigating to "http://localhost:5173/login", waiting until "domcontentloaded"[22m

- **CP-09 eliminar edificio con escaleras bloqueado**: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
[2m  - navigating to "http://localhost:5173/login", waiting until "domcontentloaded"[22m

- **CP-10 permisos estudiante**: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
[2m  - navigating to "http://localhost:5173/login", waiting until "domcontentloaded"[22m

## QA Edificios - 2026-11-09T16:56:20.086Z
Pasaron 1/10 casos.

- **CP-02 combo estados constructivos**: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
[2m  - waiting for locator('dialog:has-text("Nuevo edificio")') to be visible[22m

- **CP-03 registrar edificio**: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
[2m  - waiting for locator('dialog:has-text("Nuevo edificio")') to be visible[22m

- **CP-04 ver detalle edificio**: no detalle:http://localhost:5173/infraestructura/edificios
- **CP-05 crear escalera**: sin botón agregar escalera
- **CP-06 crear cuarto**: sin escaleras
- **CP-07 editar edificio**: diálogo editar no cerró
- **CP-08 eliminar edificio sin escaleras**: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
[2m  - waiting for locator('dialog:has-text("Nuevo edificio")') to be visible[22m

- **CP-09 eliminar edificio con escaleras bloqueado**: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
[2m  - waiting for locator('dialog:has-text("Nuevo edificio")') to be visible[22m

- **CP-10 permisos estudiante**: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('h1:has-text("Gestión de edificios")') to be visible[22m

## QA Edificios - 2026-11-09T17:07:00.255Z
Pasaron 1/10 casos.

- **CP-02 combo estados constructivos**: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
[2m  - waiting for locator('dialog:has-text("Nuevo edificio")') to be visible[22m

- **CP-03 registrar edificio**: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
[2m  - waiting for locator('dialog:has-text("Nuevo edificio")') to be visible[22m

- **CP-04 ver detalle edificio**: no detalle:http://localhost:5173/infraestructura/edificios
- **CP-05 crear escalera**: sin botón agregar escalera
- **CP-06 crear cuarto**: sin escaleras
- **CP-07 editar edificio**: diálogo editar no cerró
- **CP-08 eliminar edificio sin escaleras**: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
[2m  - waiting for locator('dialog:has-text("Nuevo edificio")') to be visible[22m

- **CP-09 eliminar edificio con escaleras bloqueado**: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
[2m  - waiting for locator('dialog:has-text("Nuevo edificio")') to be visible[22m

- **CP-10 permisos estudiante**: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('h1:has-text("Gestión de edificios")') to be visible[22m

## QA Edificios - 2026-11-09T17:25:54.839Z
Pasaron 1/10 casos.

- **CP-02 combo estados constructivos**: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
[2m  - waiting for locator('dialog:has-text("Nuevo edificio")') to be visible[22m

- **CP-03 registrar edificio**: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
[2m  - waiting for locator('dialog:has-text("Nuevo edificio")') to be visible[22m

- **CP-04 ver detalle edificio**: no detalle:http://localhost:5173/infraestructura/edificios
- **CP-05 crear escalera**: sin botón agregar escalera
- **CP-06 crear cuarto**: sin escaleras
- **CP-07 editar edificio**: diálogo editar no cerró
- **CP-08 eliminar edificio sin escaleras**: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
[2m  - waiting for locator('dialog:has-text("Nuevo edificio")') to be visible[22m

- **CP-09 eliminar edificio con escaleras bloqueado**: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
[2m  - waiting for locator('dialog:has-text("Nuevo edificio")') to be visible[22m

- **CP-10 permisos estudiante**: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for locator('h1:has-text("Gestión de edificios")') to be visible[22m
