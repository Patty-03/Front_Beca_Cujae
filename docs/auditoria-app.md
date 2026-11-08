# Auditoría de la aplicación Front_Beca_Cujae

**Fecha:** 1 de noviembre de 2026  
**Alcance:** SPA Vue 3 de gestión de la residencia CUJAE (autenticación, navegación, infraestructura, exportaciones CSV, accesibilidad, diseño responsive, rendimiento y build de producción).  
**Modalidad:** revisión estática del código + pruebas dinámicas con Edge/Playwright, axe-core y Lighthouse.  
**Repositorio auditado:** `C:\Users\Lenovo\Documents\CUJAE\4to\Software\Front_Beca_Cujae`  
**Documento de evidencias:** [`docs/evidencias/`](evidencias/)

> Esta auditoría se realizó sin modificar el código de la aplicación ni sus dependencias. El harness de pruebas y los scripts auxiliares se ejecutaron fuera del repositorio, en un directorio temporal. Las evidencias dinámicas se guardaron en `docs/evidencias/`.

---

## 1. Resumen ejecutivo

La aplicación es una SPA correctamente construida a nivel de UI, con buen uso de Vue 3, TypeScript, Tailwind y componentes shadcn-vue/Reka UI. El build de producción compila y el type-check pasa. Sin embargo, **la seguridad es completamente simulada en el cliente**: no existe backend, la autenticación acepta cualquier correo con una contraseña de 4 caracteres, el usuario y el rol se guardan en `localStorage` y el guard de rutas solo comprueba que exista un objeto local. En consecuencia, cualquiera puede entrar y operar como administrador editando `localStorage`.

Los riesgos más relevantes para una puesta en producción son:

1. **Bypass total de autenticación y autorización** (`SEC-01`, `SEC-02`).
2. **Inyección de fórmulas/CSV** en las exportaciones (`SEC-05`).
3. **Ausencia de CSP y cabeceras de seguridad** (`SEC-06`).
4. **Datos personales en `localStorage` sin cifrado ni caducidad** (`SEC-03`).
5. **Pérdida total de datos al recargar** por el modelo mock en memoria (`SEC-10`).
6. **Login roto en contexto HTTP no seguro** por `crypto.randomUUID()` (`SEC-07`).
7. **Fallos de accesibilidad WCAG AA** en contraste, nombres accesibles y estructura de encabezados (`A11Y-01` a `A11Y-06`).

En modo demo/localhost la aplicación funciona y se ve bien; en producción, tal como está, **no es apta para manejar datos reales de estudiantes ni de infraestructura**.

### Escala de severidad

| Severidad | Criterio |
|---|---|
| **Crítica** | Compromiso total, bypass de autenticación/autorización, pérdida masiva de datos o ejecución de código. |
| **Alta** | Impacto significativo y explotable con esfuerzo bajo/medio; requiere corrección antes de producción. |
| **Media** | Impacto limitado, requiere condiciones concretas o afecta integridad/UX/accesibilidad de forma relevante. |
| **Baja** | Impacto menor, buena práctica o deuda técnica. |
| **Informativa** | Observación, control positivo o limitación de la prueba. |

Cada hallazgo se evalúa dos veces: **Demo** (uso local/demostrativo con datos mock) y **Producción** (datos reales, usuarios reales, despliegue público).

---

## 2. Entorno y metodología

| Elemento | Valor |
|---|---|
| Sistema | Windows (win32) |
| Navegador | Microsoft Edge `156.0.4314.50` |
| Node / npm | `v24.22.1` / `12.2.1` |
| Servidor de desarrollo | `http://127.0.0.1:5173` |
| Preview de producción | `http://127.0.0.1:4173` y `http://192.168.215.26:4173` |
| Playwright | `playwright-core@1.64.1` |
| axe-core | `@axe-core/playwright@4.14.0` |
| Lighthouse | `13.6.0` |
| Build | `npm run build` correcto; `vue-tsc` sin errores |
| Dependencias | `npm audit --omit=dev`: 0 vulnerabilidades; audit completo: 14 moderadas, todas en tooling de desarrollo |

### Pruebas realizadas

| Bloque | Pruebas |
|---|---|
| Autenticación | `A-01` a `A-07`: redirección, prellenado, validaciones, login con 4 caracteres, “recordarme”, logout. |
| `localStorage` | `B-01` usuario forjado, `B-02` JSON malformado. |
| Navegación | `C-01`: rutas, títulos, H1, breadcrumbs, landmarks. |
| CRUD y validaciones | `D-01` a `D-11`: crear/editar/eliminar edificios, escaleras y cuartos; límites de capacidad; errores de diálogo. |
| Persistencia y auditoría | `E-01` recarga, `E-02` eventos de auditoría. |
| CSV | `F-01` a `F-04`: exportación general, doble exportación, nombres con comas/comillas/fórmulas. |
| Servicio | `G-01`: validaciones directas del servicio (nombres largos, capacidades, duplicados, borrados protegidos). |
| Responsive | `H-01`: 320, 375, 768 y 1440 px; sidebar móvil; touch targets. |
| Accesibilidad | `I-01`, `I-02`; escaneos axe en 9 vistas. |
| Rendimiento | `J-01` métricas de Playwright; Lighthouse sobre login. |
| Seguridad adicional | `K-01` XSS, `K-02` cabeceras/devtools, `K-03` cookies, `K-04` `localStorage`; `L-01` contexto HTTP no seguro. |

Las evidencias crudas están en:

- [`evidencias/logs/results-final.json`](evidencias/logs/results-final.json): resultados completos de Playwright.
- [`evidencias/logs/audit-run.log`](evidencias/logs/audit-run.log): salida de consola de la ejecución.
- [`evidencias/axe/summary.json`](evidencias/axe/summary.json): resumen de axe.
- [`evidencias/lighthouse/summary.json`](evidencias/lighthouse/summary.json): resumen de Lighthouse.
- [`evidencias/capturas/`](evidencias/capturas/): capturas de pantalla.
- [`evidencias/csv/`](evidencias/csv/): CSV exportados con payloads.
- [`evidencias/logs/insecure-context.json`](evidencias/logs/insecure-context.json): prueba HTTP por IP LAN.
- [`evidencias/headers/`](evidencias/headers/): cabeceras del dev server y del preview.
- [`evidencias/logs/build.log`](evidencias/logs/build.log): build de producción.
- [`evidencias/logs/npm-audit-prod.json`](evidencias/logs/npm-audit-prod.json) y [`evidencias/logs/npm-audit-full.json`](evidencias/logs/npm-audit-full.json): auditoría de dependencias.

### Limitaciones

- No hay backend real: muchas pruebas de seguridad se hacen contra el mock en memoria y el guard cliente. Los hallazgos de autorización deben revalidarse cuando exista API.
- Lighthouse se ejecutó sobre `/login` (vista pública). Las vistas autenticadas se evaluaron con axe/Playwright, no con Lighthouse, porque la sesión vive en `localStorage`.
- La prueba de contexto inseguro se hizo por IP LAN (`http://192.168.215.26:4173`). Es representativa de un despliegue HTTP; no sustituye una prueba con el dominio y proxy reales.
- El escaneo axe en desarrollo incluye el overlay de Vue DevTools; la violación `aria-prohibited-attr` proviene de ese overlay, no de la app (ver `A11Y-08`).
- No se probaron flujos de recuperación de contraseña, notificaciones reales ni módulos marcados “En preparación” porque no existen.

---

## 3. Tabla resumen de hallazgos

| ID | Hallazgo | Demo | Producción | Evidencia principal |
|---|---|---:|---:|---|
| SEC-01 | Autenticación simulada y bypass total con `localStorage` | Alta | **Crítica** | `A-05`, `B-01` |
| SEC-02 | Sin RBAC: rol de estudiante con CRUD total | Alta | **Alta** | `B-01`, `D-02`–`D-05` |
| SEC-03 | PII en `localStorage` sin cifrado/caducidad; “recordarme” no funciona | Media | **Alta** | `A-06`, `K-04` |
| SEC-04 | Credenciales demo hardcodeadas y presentes en el bundle | Baja | Media | `A-02`, `LoginView.vue:24-25` |
| SEC-05 | Inyección de fórmulas/CSV y falta de quoting | Media | **Alta** | `F-02`, `F-04` |
| SEC-06 | Sin CSP ni cabeceras de seguridad | Media | **Alta** | `K-02`, Lighthouse |
| SEC-07 | Login falla en contexto HTTP no seguro (`crypto.randomUUID`) | Media | **Alta** | `L-01` |
| SEC-08 | Validación de servicio insuficiente (nombre/capacidad/duplicados) | Baja | Media | `G-01` |
| SEC-09 | `localStorage` malformado tumba la app | Baja | Media | `B-02` |
| SEC-10 | Sin persistencia: datos mock en memoria, se pierden al recargar | Media | **Alta** | `E-01` |
| SEC-11 | Auditoría con usuario hardcodeado | Baja | Media | `E-02` |
| SEC-12 | Endpoint de Vue DevTools activo en desarrollo | Media (dev) | Baja/N/A | `K-02` |
| SEC-13 | XSS: no explotable en la ruta probada | — | — | `K-01` |
| SEC-14 | Dependencias: 0 en producción, 14 moderadas en dev | Baja | Baja | `npm-audit-*` |
| UX-01 | Enlace “¿Olvidó?” sin funcionalidad | Media | Media | `LoginView.vue:125` |
| UX-02 | Campana de notificaciones solo muestra un toast | Baja | Baja | `AppHeader.vue:21-23` |
| UX-03 | Breadcrumb genérico “Detalle del edificio” | Baja | Baja | `C-01` |
| UX-04 | Sin búsqueda, filtros, orden ni paginación en tablas grandes | Baja | Media | `C-01`, código |
| UX-05 | Botones deshabilitados sin explicación accesible | Media | Media | `D-06` |
| UX-06 | Textos en inglés en la UI (`Toggle Sidebar`, `Sidebar`, `Close`) | Baja | Baja | `I-01`, código |
| UX-07 | Touch targets de 32 px y acciones móviles sin `aria-label` | Media | Media | `H-01` |
| UX-08 | Responsive sin overflow horizontal en 320–1440 px | — | — | `H-01` |
| UX-09 | Buenos estados de carga/error/vacío y retorno de foco en diálogos | — | — | `D-07`, `I-02` |
| A11Y-01 | Contraste insuficiente (WCAG AA) en textos, tabs y barras | Media | **Alta** | `axe/*`, ratios |
| A11Y-02 | `label-content-name-mismatch` en tarjetas de inicio | Media | Media | `axe/home.json` |
| A11Y-03 | `CardTitle` es `div`; solo hay un H1 por página | Media | Media | `I-01`, código |
| A11Y-04 | Barras de progreso sin nombre accesible contextual | Media | Media | `I-01` |
| A11Y-05 | Errores de formulario no anunciados; sin `aria-invalid`/`aria-describedby` | Media | Media | `I-02` |
| A11Y-06 | Sidebar sin landmark `nav`/`aside`; sin skip link | Baja | Media | `I-01`, código |
| A11Y-07 | Diálogos con focus trap y retorno de foco correctos | — | — | `I-02` |
| A11Y-08 | `aria-prohibited-attr` por overlay de Vue DevTools en dev | Informativa | N/A | `axe/*` |
| PERF-01 | Lighthouse login: 91/100/100/91; TBT 290 ms | Baja | Baja | `lighthouse/summary.json` |
| PERF-02 | Google Fonts por `@import` externo | Baja | Baja | `style.css:1` |
| QA-01 | Sin tests ni CI; lint con `--fix` | Baja | Media | `package.json` |
| QA-02 | README desactualizado (`src/data/mock.ts` no existe) | Baja | Baja | `README.md` |
| QA-03 | Sin configuración de despliegue, rewrite SPA ni cabeceras | Baja | Media | `index.html`, `vite.config.ts` |

---

## 4. Seguridad

### SEC-01 — Autenticación simulada y bypass total

**Severidad:** Demo **Alta** · Producción **Crítica**

**Descripción.** `useAuthStore.login()` no valida credenciales contra ninguna fuente: solo comprueba que el correo tenga formato y que la contraseña tenga al menos 4 caracteres. Luego crea un usuario con rol fijo y lo guarda en `localStorage`. El guard del router únicamente comprueba `auth.isAuthenticated`, que es `user !== null`.

**Evidencia.**

- `A-05`: login con `audit.user@cujae.edu.cu` / `1234` redirige a `/` y guarda `beca-cujae-user`.
- `B-01`: con `localStorage` forjado (`role: "Administrador"`) se accede directamente a `/infraestructura` y se ve el dashboard.
- Código: `src/stores/auth.ts:41-72` (login, `crypto.randomUUID`, rol fijo, `localStorage.setItem`), `src/router/index.ts:98-110` (guard cliente), `src/views/LoginView.vue:24-25` (credenciales precargadas).

**Impacto.**

- **Demo:** cualquier persona con acceso al navegador entra sin credenciales reales; útil para demostrar, peligroso si la demo se publica.
- **Producción:** bypass total de autenticación y suplantación de cualquier rol; no hay identidad verificable ni sesión de servidor. Es un bloqueante absoluto.

**Recomendación.**

- Implementar autenticación en backend (OIDC/LDAP institucional, JWT de corta duración o sesión con cookie `HttpOnly; Secure; SameSite`).
- Validar credenciales y permisos en el servidor en cada petición; el frontend nunca debe ser la única barrera.
- Añadir rate limiting, bloqueo progresivo, MFA para roles administrativos y registro de intentos.
- Eliminar la generación de identidad en el cliente.

---

### SEC-02 — Sin RBAC: rol de estudiante con CRUD total

**Severidad:** Demo **Alta** · Producción **Alta**

**Descripción.** El rol se fija en `"Estudiante de pregrado"` y no se usa para autorizar rutas, acciones ni servicios. Un usuario con rol de estudiante puede crear, editar y eliminar edificios, escaleras y cuartos. El rol forjado en `localStorage` tampoco se contrasta con el servidor.

**Evidencia.**

- `B-01`: usuario con rol `Administrador` forjado accede al dashboard.
- `D-02` a `D-05`: con la sesión de “Estudiante de pregrado” se crea, edita y elimina un edificio.
- Código: `src/stores/auth.ts:64` (rol fijo), `src/router/index.ts:98-110` (solo `requiresAuth`), servicios sin comprobación de rol.

**Impacto.** En producción, un estudiante podría alterar o borrar infraestructura y datos asociados. No hay separación de funciones ni trazabilidad fiable.

**Recomendación.**

- Definir roles y permisos (estudiante, operador, administrador) y aplicarlos en el backend.
- Proteger rutas y acciones con `meta.roles`/`meta.permissions` en el router y, sobre todo, con autorización de servidor.
- Ocultar o deshabilitar acciones no permitidas en la UI, sin confiar en ello como control de seguridad.
- Auditar cada operación con el usuario autenticado.

---

### SEC-03 — PII en `localStorage` sin cifrado ni caducidad; “recordarme” no funciona

**Severidad:** Demo **Media** · Producción **Alta**

**Descripción.** Se guardan `id`, `name`, `email` y `role` en `localStorage` en texto plano, sin expiración ni mecanismo de revocación. El checkbox “Mantener sesión iniciada” (`remember`) se modela pero nunca se pasa a `auth.login()`; la sesión se persiste siempre.

**Evidencia.**

- `K-04`: `beca-cujae-user` contiene nombre, correo y rol.
- `A-06`: con `rememberRequested: false`, tras recargar la URL sigue en `/` y el usuario sigue en `localStorage`.
- Código: `src/stores/auth.ts:68`, `src/views/LoginView.vue:26`, `154-163`.

**Impacto.**

- **Demo:** en equipos compartidos, el siguiente usuario ve nombre/correo y hereda la sesión.
- **Producción:** exposición de PII, sesión persistente indefinidamente y riesgo de robo de sesión si se combina con XSS. El “recordarme” no cumple lo que promete.

**Recomendación.**

- Usar cookie de sesión `HttpOnly`, `Secure`, `SameSite=Lax/Strict`, con expiración y refresh controlado por servidor.
- No guardar PII en `localStorage`; si se necesita cachear, usar almacenamiento en memoria y limpiar al cerrar.
- Implementar dos modos reales: sesión de pestaña vs. persistente, según el checkbox.
- Añadir cierre por inactividad y revocación de sesión.

---

### SEC-04 — Credenciales demo hardcodeadas y presentes en el bundle

**Severidad:** Demo **Baja** · Producción **Media**

**Descripción.** El formulario de login se prellena con `ing.juan.perez@cujae.edu.cu` / `Contraseña2026*`. Esos valores están en el código fuente y también en el bundle de producción (`dist/assets/LoginView-*.js`).

**Evidencia.**

- `A-02`: inputs con esos valores.
- `src/views/LoginView.vue:24-25`.
- Verificación en `dist/assets/LoginView-CctaWllD.js` (el hash puede cambiar en cada build).

**Impacto.** Si el build se publica sin limpiar, se distribuyen credenciales de demo y se facilita el acceso no autorizado o la reutilización de contraseñas. Aunque hoy no hay backend, es un mal patrón que persistirá cuando lo haya.

**Recomendación.**

- Eliminar valores precargados del código de producción.
- Usar un flag de modo demo (`import.meta.env.DEV` o variable de entorno) y datos de demo solo en un entorno aislado.
- Nunca incluir secretos ni credenciales en el frontend.

---

### SEC-05 — Inyección de fórmulas/CSV y falta de quoting

**Severidad:** Demo **Media** · Producción **Alta**

**Descripción.** Las exportaciones se construyen con `array.join(',')` sin citar campos ni neutralizar fórmulas. Un nombre que empiece por `=`, `+`, `-` o `@` se interpreta como fórmula al abrir el CSV en Excel/Google Sheets. Un nombre con coma, comilla o salto de línea rompe columnas/filas.

**Evidencia.**

- `F-02`: el reporte incluye líneas como `=HYPERLINK("http://example.com","click") ...` y `Audit,CSV "X" ...` sin comillas.
- `F-04`: el censo incluye `Audit Census, "X" ...`, `Escalera, "Norte"` y `Cuarto, "101"`, generando columnas desplazadas.
- Código: `src/services/infraestructura.ts:410-457` (`join(',')` en reporte y censo), `src/lib/download.ts` (solo agrega BOM).

**Impacto.**

- **Demo:** un CSV de demostración puede ejecutar fórmulas al abrirse y corromper la visualización.
- **Producción:** CSV injection sobre datos controlados por usuarios; riesgo de exfiltración vía `HYPERLINK`/DDE y pérdida de integridad del reporte. Es especialmente relevante si los nombres vienen de formularios públicos.

**Recomendación.**

- Aplicar RFC 4180: entrecomillar todos los campos, duplicar comillas internas y manejar saltos de línea.
- Neutralizar fórmulas: prefijar `'` o tab a valores que empiecen por `= + - @`, o validar/allowlist de nombres.
- Generar el CSV en servidor con una librería madura y `Content-Disposition` correcto.
- Añadir pruebas con comas, comillas, saltos de línea y fórmulas.

---

### SEC-06 — Sin CSP ni cabeceras de seguridad

**Severidad:** Demo **Media** · Producción **Alta**

**Descripción.** Ni el dev server ni el preview de producción envían CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy` o `Permissions-Policy`. Lighthouse detecta “No CSP found in enforcement mode” con severidad High.

**Evidencia.**

- `K-02`: cabeceras del dev server sin CSP ni protecciones.
- [`evidencias/headers/preview-headers.json`](evidencias/headers/preview-headers.json): preview solo envía `Cache-Control`, `Content-Type`, `ETag`, etc.
- [`evidencias/lighthouse/summary.json`](evidencias/lighthouse/summary.json): `csp-xss` con `"severity": "High"`.
- `index.html`: sin meta CSP.
- `vite.config.ts:12`: `vueDevTools()` incondicional.

**Impacto.** Sin CSP, cualquier XSS futuro tiene impacto máximo; sin `frame-ancestors` hay riesgo de clickjacking; sin HSTS, downgrade a HTTP. En desarrollo, el endpoint de Vue DevTools queda expuesto si el servidor se publica.

**Recomendación.**

- Configurar cabeceras en el reverse proxy/hosting: CSP estricta con nonces/hashes, `frame-ancestors 'none'`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
- Forzar HTTPS y redirección 301/308.
- Desactivar Vue DevTools fuera de desarrollo y no exponer el dev server a la red.
- Revisar CSP con Lighthouse/Report-Only antes de enforcing.

---

### SEC-07 — Login roto en contexto HTTP no seguro por `crypto.randomUUID()`

**Severidad:** Demo **Media** · Producción **Alta**

**Descripción.** `crypto.randomUUID()` solo existe en contextos seguros (HTTPS o localhost). Si la app se sirve por HTTP en una IP LAN o dominio sin TLS, la función no está disponible y el login falla con `crypto.randomUUID is not a function`.

**Evidencia.**

- [`evidencias/logs/insecure-context.json`](evidencias/logs/insecure-context.json): `isSecureContext: false`, `hasRandomUUID: false`, toast “No se pudo iniciar sesión crypto.randomUUID is not a function”, URL final `/login`, `localStorage` vacío.
- Captura: [`evidencias/capturas/L-01-insecure-context.png`](evidencias/capturas/L-01-insecure-context.png).
- Código: `src/stores/auth.ts:61`.

**Impacto.** Una demo servida por IP (por ejemplo, para probar desde otro equipo) no permite iniciar sesión. En producción, si se despliega por HTTP, el login queda inutilizable; además, la generación de IDs de identidad en el cliente es un antipatrón.

**Recomendación.**

- Servir siempre por HTTPS (incluido el entorno de demo).
- Generar el ID en el servidor; si se necesita un UUID temporal en cliente, usar un fallback con `crypto.getRandomValues`.
- Añadir detección y mensaje claro si el contexto no es seguro.

---

### SEC-08 — Validación de servicio insuficiente

**Severidad:** Demo **Baja** · Producción **Media**

**Descripción.** El servicio solo exige nombre de al menos 3 caracteres y capacidad entera positiva. No hay longitud máxima, no hay límite superior de capacidad y el duplicado se compara con `toLowerCase()` sin normalizar acentos. La UI impone `maxlength="40"` y `max="20"` en el diálogo de cuarto y `maxlength="80"` en el de edificio, pero el servicio puede invocarse directamente (y en producción lo hará un backend/API).

**Evidencia.**

- `G-01`:
  - `longName`: nombre de 500 caracteres aceptado.
  - `capacityHuge`: capacidad `999999` aceptada.
  - `accentA`/`accentB`: `"Audit Á"` y `"Audit A"` aceptados como distintos.
  - `emptyName`, `invalidState`, `capacityZero`, `capacityDecimal`: rechazados correctamente.
- `D-09`/`D-10`: la UI bloquea `21` y `999999` por `max="20"` nativo.
- Código: `src/services/infraestructura.ts:132-135` (`validarNombre`), `324-357` (`crearCuarto`), `src/components/infraestructura/CuartoDialog.vue:137,149-150`, `EdificioDialog.vue:110`.

**Impacto.** Datos inconsistentes, nombres gigantes que rompen layouts, capacidades irreales, duplicados con acentos y diferencias entre UI y API. En producción, un cliente malicioso puede saltarse la UI y enviar valores fuera de rango.

**Recomendación.**

- Un esquema compartido (por ejemplo, Zod) con mínimos, máximos, longitud y normalización; validar también en servidor.
- Normalizar nombres (NFD + eliminación de diacríticos) para duplicados y definir límites razonables.
- Restricciones únicas en base de datos, no solo en memoria.
- Devolver errores 400 consistentes y tests de borde.

---

### SEC-09 — `localStorage` malformado tumba la aplicación

**Severidad:** Demo **Baja** · Producción **Media**

**Descripción.** `loadUser()` solo comprueba que existan las claves `id`, `name`, `email` y `role`, pero no sus tipos. Un objeto como `{ id: 1, name: 2, email: 3, role: 4 }` pasa la comprobación; luego `getInitials(auth.user.name)` ejecuta `name.split()` durante el render y la app queda en blanco.

**Evidencia.**

- `B-02`: URL `/`, sin H1, `bodyText` vacío.
- Consola: `[Vue warn] Unhandled error during execution of render function` y `pageerror: name.split is not a function` en [`evidencias/logs/results-final.json`](evidencias/logs/results-final.json) (`console.malformed`).
- Captura: [`evidencias/capturas/B-02-malformed-user.png`](evidencias/capturas/B-02-malformed-user.png).
- Código: `src/stores/auth.ts:7-28` (validación de claves sin tipos), `src/lib/format.ts:33-40` (`name.split()`), `src/components/app/AppSidebar.vue:78` (uso de `getInitials`).

**Impacto.** Un `localStorage` corrupto (versión anterior, extensión, manipulación, migración fallida) deja la app inutilizable sin recuperación automática. En producción genera soporte y pérdida de acceso.

**Recomendación.**

- Validar el esquema en tiempo de ejecución (Zod/valibot) y tipos de cada campo.
- Si es inválido, limpiar la sesión y redirigir a login con mensaje.
- Añadir un ErrorBoundary/fallback de UI y tests de migración.

---

### SEC-10 — Sin persistencia: datos mock en memoria

**Severidad:** Demo **Media** · Producción **Alta**

**Descripción.** Los datos viven en arrays importados de `src/data/mockInfraestructura.ts`. No hay API ni base de datos. Al recargar, se reconstruye el mock y se pierden los cambios. Cada pestaña tiene su propia instancia, por lo que dos pestañas no comparten estado. La auditoría también es en memoria.

**Evidencia.**

- `E-01`: `beforeReload: 1`, `afterReload: 0` para un edificio recién creado.
- Código: `src/services/infraestructura.ts` (arrays `edificios`, `escaleras`, `cuartos`, `eventosAuditoria`), `src/data/mockInfraestructura.ts`.

**Impacto.**

- **Demo:** los cambios se pierden al refrescar; sirve para mostrar UI, no para operar.
- **Producción:** pérdida de datos, inconsistencias entre usuarios/pestañas y ausencia de backups. Es un bloqueante funcional.

**Recomendación.**

- Backend con base de datos y API REST/GraphQL; transacciones y control de concurrencia.
- Estado de servidor con caché (TanStack Query o similar), invalidación y manejo de conflictos.
- Persistencia real de auditoría y backups.

---

### SEC-11 — Auditoría con usuario hardcodeado

**Severidad:** Demo **Baja** · Producción **Media**

**Descripción.** `registrarEvento()` asigna siempre `usuario: 'Operador de infraestructura'`, sin relación con el usuario autenticado. Los eventos iniciales del mock usan nombres ficticios (Ana Rodríguez, Carlos Pérez, etc.).

**Evidencia.**

- `E-02`: al crear “Audit Event …”, el evento aparece con `usuario: "Operador de infraestructura"`; `hardcodedUsers` incluye ese valor y los nombres mock.
- Código: `src/services/infraestructura.ts:108-117`.

**Impacto.** La auditoría no es fiable ni no repudiable; no se puede saber quién hizo qué. En producción incumple requisitos de trazabilidad y complica investigaciones.

**Recomendación.**

- Registrar eventos en servidor con el principal autenticado, IP, user-agent, timestamp y valores antes/después.
- Hacer el log append-only/inmutable y con retención definida.
- No aceptar el usuario desde el cliente.

---

### SEC-12 — Endpoint de Vue DevTools activo en desarrollo

**Severidad:** Demo **Media** (solo dev) · Producción **Baja/N/A**

**Descripción.** `vite.config.ts` incluye `vueDevTools()` sin condicionar. En el dev server, `/__devtools__/` responde 200 con la app de DevTools. En el preview de producción, la misma ruta devuelve el fallback SPA (no la app de DevTools), por lo que el build no la incluye.

**Evidencia.**

- `K-02`: devtools status 200, longitud 532, HTML de DevTools.
- [`evidencias/headers/preview-headers.json`](evidencias/headers/preview-headers.json) y contenido del preview: fallback SPA.
- Código: `vite.config.ts:12`.

**Impacto.** Si el dev server se expone en red (por ejemplo, `--host 0.0.0.0`) se habilita una superficie de depuración no prevista. En producción no aplica si se usa el build.

**Recomendación.**

- Activar el plugin solo en desarrollo: `mode === 'development' && vueDevTools()`.
- No exponer el dev server fuera de localhost.
- Revisar que el build de producción no incluya devtools.

---

### SEC-13 — XSS: no explotable en la ruta probada

**Severidad:** Informativa (control positivo)

**Descripción.** Se creó un edificio con nombre `<img src=x onerror="window.__xss=1"> …`. La tabla lo mostró como texto; no se creó ningún `<img>` ni se ejecutó el handler.

**Evidencia.**

- `K-01`: `flag: 0`, `imgCount: 0`; el nombre aparece como texto en la tabla.
- Búsqueda estática: no hay `v-html`, `innerHTML`, `eval` ni `dangerouslySetInnerHTML`.

**Impacto.** No se encontró XSS en este flujo. Vue escapa por interpolación. Aun así, la ausencia de CSP (SEC-06) agravaría cualquier XSS futuro.

**Recomendación.** Mantener interpolación segura; evitar `v-html`; si se necesita HTML enriquecido, sanitizar con DOMPurify y CSP.

---

### SEC-14 — Dependencias

**Severidad:** Baja

**Descripción.** `npm audit --omit=dev` no reporta vulnerabilidades en dependencias de producción. El audit completo reporta 14 moderadas, todas en tooling de desarrollo (ESLint, `minimatch`, `typescript-eslint`, etc.).

**Evidencia.**

- [`evidencias/logs/npm-audit-prod.json`](evidencias/logs/npm-audit-prod.json): 0.
- [`evidencias/logs/npm-audit-full.json`](evidencias/logs/npm-audit-full.json): 14 moderadas, 0 altas/críticas.

**Impacto.** No hay riesgo directo en runtime de producción; el riesgo está en la cadena de herramientas de desarrollo.

**Recomendación.** Actualizar tooling de forma planificada, usar Dependabot/Renovate, `npm ci` con lockfile y revisar advisories.

---

## 5. Diseño, usabilidad y UX

### UX-01 — Enlace “¿Olvidó?” sin funcionalidad

**Severidad:** Demo **Media** · Producción **Media**

`LoginView.vue:125` tiene `<a href="#">¿Olvidó?</a>`. No hay ruta, modal ni flujo de recuperación. Al hacer clic, el usuario vuelve al inicio de la página y no puede recuperar la contraseña. **Recomendación:** implementar recuperación real (correo/token) o eliminar el enlace y mostrar un texto de contacto.

### UX-02 — Campana de notificaciones solo muestra un toast

**Severidad:** Baja

`AppHeader.vue:23-25` muestra “No tienes notificaciones nuevas” con `toast.info`. No hay centro de notificaciones, historial ni estado. **Recomendación:** implementar panel o eliminar la campana si no habrá notificaciones.

### UX-03 — Breadcrumb genérico en detalle de edificio

**Severidad:** Baja

`C-01` muestra “Inicio / Edificios / Detalle del edificio” en lugar del nombre del edificio (por ejemplo, “Edificio A”). El título de la pestaña también es genérico. **Recomendación:** usar el nombre del edificio en breadcrumb y `document.title`.

### UX-04 — Sin búsqueda, filtros, orden ni paginación

**Severidad:** Demo **Baja** · Producción **Media**

La tabla de cuartos muestra 60 registros sin buscador, filtros por estado/escalera, ordenamiento ni paginación; en móvil se convierte en una lista larga. **Recomendación:** añadir búsqueda, filtros, sort y paginación/virtualización; recordar el estado en la URL.

### UX-05 — Botones deshabilitados sin explicación accesible

**Severidad:** Media

`D-06`: el botón de eliminar “Edificio A” está deshabilitado y solo tiene `title="No se puede eliminar: tiene escaleras registradas"`. El `title` no es accesible de forma fiable para teclado/lectores y no se anuncia al enfocar. **Recomendación:** texto visible o `aria-describedby` con la razón, y mensaje al intentar la acción.

### UX-06 — Textos en inglés en la UI

**Severidad:** Baja

`Toggle Sidebar`, `Sidebar`, `Displays the mobile sidebar.` y `Close` aparecen en inglés (aunque algunos son `sr-only`). **Recomendación:** traducir al español y mantener consistencia.

### UX-07 — Touch targets pequeños y acciones móviles sin nombre

**Severidad:** Media

`H-01`: los botones de icono miden 32×32 px (recomendado ≥44×44). En las tarjetas móviles de edificios/cuartos, los botones de editar/eliminar no tienen `aria-label` (solo icono). **Recomendación:** aumentar el área táctil y añadir `aria-label`/texto visible.

### UX-08 — Responsive correcto

**Severidad:** Informativa (control positivo)

`H-01`: sin overflow horizontal en 320, 375, 768 y 1440 px; capturas en [`evidencias/capturas/`](evidencias/capturas/). El sidebar móvil usa un sheet con título/descripción `sr-only`. La medición `mobileSheet.visible` dio `false` por `offsetParent` en un elemento `fixed`; la captura muestra el panel y el botón de cierre existe, por lo que se considera un falso negativo del selector, no un fallo visual.

### UX-09 — Estados de carga/error/vacío y foco en diálogos

**Severidad:** Informativa (control positivo)

Las vistas muestran skeletons, alertas de error con “Reintentar” y estados vacíos. Los diálogos atrapan el foco y, al pulsar Escape, lo devuelven al disparador (`I-02`: `focusAfterEscape: "Nuevo edificio"`). Es una base sólida.

---

## 6. Accesibilidad

### A11Y-01 — Contraste insuficiente (WCAG AA)

**Severidad:** Demo **Media** · Producción **Alta**

axe reporta `color-contrast` en todas las vistas autenticadas: 13 nodos en detalle general, 10 en escaleras/cuartos, 9 en estadísticas, 3 en dashboard y 2 en inicio/404. Ratios medidos:

| Elemento | Foreground / Background | Ratio | Requisito |
|---|---|---:|---:|
| Avatar fallback | `#6c757d` / `#eef2f5` | 4.16 | 4.5 |
| Breadcrumb | `#6c757d` / `#f8f9fa` | 4.44 | 4.5 |
| Tabs inactivas | `#73777b` / `#eef2f5` | 4.00 | 4.5 |
| Etiquetas KPI | `#6c757d` / `#f8fafb` | 4.47 | 4.5 |
| Placeholder login | `#94a3b8` / `#ffffff` | 2.56 | 4.5 |
| Barra ámbar | `#f59e0b` / `#eef2f5` | 1.91 | 3.0 (no texto) |
| Barra esmeralda | `#10b981` / `#eef2f5` | 2.25 | 3.0 (no texto) |

**Evidencia:** [`evidencias/axe/detalle-general.json`](evidencias/axe/detalle-general.json), [`evidencias/axe/home.json`](evidencias/axe/home.json), [`evidencias/axe/summary.json`](evidencias/axe/summary.json).

**Recomendación.** Oscurecer `--muted-foreground` (por ejemplo, a un gris con ratio ≥4.5 sobre los fondos usados), ajustar tabs y placeholders, y usar colores de barra con contraste ≥3:1 o añadir patrones/etiquetas. Verificar con axe y pruebas visuales.

### A11Y-02 — `label-content-name-mismatch` en tarjetas de inicio

**Severidad:** Media

`axe/home.json` reporta 4 violaciones serias en los enlaces de módulos: el `aria-label` es “Abrir módulo Infraestructura”, pero el texto visible incluye título, descripción y “Abrir módulo”. WCAG 2.5.3 exige que el texto visible esté contenido en el nombre accesible. **Recomendación:** quitar `aria-label` y dejar que el contenido visible sea el nombre, o usar `aria-labelledby` apuntando al título visible.

### A11Y-03 — `CardTitle` es `div`; solo hay un H1 por página

**Severidad:** Media

`src/components/ui/card/CardTitle.vue:11-21` renderiza un `div`, no un encabezado. En `I-01`, la página de edificios solo tiene un `H1`; las secciones y tarjetas no aportan jerarquía `H2/H3`. **Recomendación:** permitir `as="h2"/"h3"` en `CardTitle` o usar encabezados semánticos en las vistas; mantener un H1 por página y jerarquía coherente.

### A11Y-04 — Barras de progreso sin nombre accesible contextual

**Severidad:** Media

`I-01` lista 16 `[role="progressbar"]` con `aria-label` igual al porcentaje (“81%”), sin indicar edificio/cuarto. El usuario de lector de pantalla no sabe qué mide. **Recomendación:** `aria-label="Ocupación de Edificio A: 81%"` o `aria-labelledby` al nombre visible; mantener `aria-valuenow`.

### A11Y-05 — Errores de formulario no anunciados

**Severidad:** Media

`I-02`: el párrafo de error no tiene `role="alert"` ni `aria-live`; el input no tiene `aria-invalid` ni `aria-describedby`. Un usuario de lector de pantalla puede no enterarse del error. **Recomendación:** `role="alert"`/`aria-live="polite"`, `aria-invalid="true"` y `aria-describedby` al id del error; enfocar el primer campo inválido.

### A11Y-06 — Sidebar sin landmark y sin skip link

**Severidad:** Demo **Baja** · Producción **Media**

`I-01`: `main: 1`, `nav: 1` (breadcrumb), `aside: 0`. El menú lateral es un `div`, no un `<nav>`/`<aside>`, y no hay skip link para saltar al contenido. **Recomendación:** envolver la navegación principal en `<nav aria-label="Navegación principal">`, añadir skip link y conservar el `<main>` actual.

### A11Y-07 — Diálogos: foco correcto

**Severidad:** Informativa (control positivo)

`I-02`: al abrir “Nuevo edificio” el foco va al campo; al cerrar con Escape vuelve a “Nuevo edificio”. Reka UI gestiona focus trap correctamente.

### A11Y-08 — `aria-prohibited-attr` por Vue DevTools

**Severidad:** Informativa

axe reporta `aria-prohibited-attr` en todas las vistas de desarrollo sobre `.panel-entry-btn` (“Toggle Vue DevTools”). Es un artefacto del overlay de DevTools, no de la app. En el build de producción no debería existir. Se documenta para no confundirlo con un fallo de la interfaz.

---

## 7. Rendimiento

### PERF-01 — Lighthouse sobre login

**Severidad:** Baja

Resultados en [`evidencias/lighthouse/summary.json`](evidencias/lighthouse/summary.json):

| Categoría | Score |
|---|---:|
| Performance | 91 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 91 |

Métricas: FCP 2.2 s, LCP 2.2 s, Speed Index 2.2 s, TBT 290 ms, CLS 0, TTI 2.6 s. Son aceptables; TBT y FCP son las áreas con más margen. La vista autenticada no se midió con Lighthouse por la sesión en `localStorage`.

### PERF-02 — Google Fonts externo por `@import`

**Severidad:** Baja

`src/style.css:1` importa Inter desde `fonts.googleapis.com`. Un `@import` en CSS puede bloquear el render y añade una dependencia externa (privacidad/disponibilidad). **Recomendación:** self-host de la fuente, `font-display: swap`, `preconnect` si se mantiene externa.

### PERF-03 — Bundle de producción

El build genera chunks razonables; los mayores son `useApi` (~116.8 KB, 46.1 KB gzip), `index` (~86.9 KB, 32 KB gzip), `AppLayout` (~66 KB, 15.4 KB gzip) y `KpiCard` (~60 KB, 17.3 KB gzip). No hay un problema grave, pero conviene vigilar el chunk compartido y aplicar presupuesto de rendimiento en CI.

---

## 8. Calidad, mantenibilidad y despliegue

### QA-01 — Sin tests ni CI

**Severidad:** Demo **Baja** · Producción **Media**

`package.json` no tiene script `test` ni configuración de Vitest/Playwright. No hay workflows de CI. `npm run lint` usa `--fix`, lo que puede modificar archivos en CI de forma silenciosa. **Recomendación:** añadir tests unitarios (Vitest) y E2E (Playwright), CI con lint sin `--fix`, type-check y build; publicar reportes.

### QA-02 — README desactualizado

**Severidad:** Baja

`README.md` dice que los datos mock están en `src/data/mock.ts`, pero el archivo real es `src/data/mockInfraestructura.ts`. También afirma que no se requiere backend sin explicar que la autenticación es simulada y que no hay persistencia. **Recomendación:** actualizar rutas, limitaciones, despliegue y estado de los módulos.

### QA-03 — Sin configuración de despliegue/rewrite/cabeceras

**Severidad:** Demo **Baja** · Producción **Media**

No hay `vercel.json`, `netlify.toml`, configuración de Nginx/Apache ni notas de rewrite para SPA. El preview de Vite hace fallback, pero un hosting estático mal configurado devolverá 404 en rutas profundas. Tampoco hay cabeceras de seguridad. **Recomendación:** documentar y versionar la configuración de despliegue con rewrite a `index.html` y cabeceras (ver SEC-06).

---

## 9. Controles positivos observados

- **XSS:** la interpolación de Vue escapa el payload; no se encontró `v-html`/`innerHTML`/`eval`.
- **Open redirect:** `LoginView.vue:35-41` valida que `redirect` empiece por `/` y no por `//`.
- **Logout:** limpia `beca-cujae-user` de `localStorage` (`A-07`).
- **Responsive:** sin overflow horizontal en 320, 375, 768 y 1440 px.
- **Diálogos:** focus trap y retorno de foco correctos (`I-02`).
- **Estados de UI:** skeletons, alertas de error con reintento y estados vacíos.
- **Build:** `npm run build` y `vue-tsc` pasan; `npm audit --omit=dev` sin vulnerabilidades.
- **Lint:** los logs de Oxlint/ESLint no reportan errores (ver [`evidencias/logs/oxlint.txt`](evidencias/logs/oxlint.txt) y [`evidencias/logs/eslint.txt`](evidencias/logs/eslint.txt)).

---

## 10. Plan de remediación sugerido

### Antes de cualquier uso con datos reales (bloqueantes)

1. **Backend de autenticación y autorización** (SEC-01, SEC-02): sesión de servidor/cookie segura, RBAC, rate limiting, MFA para administradores.
2. **Persistencia real** (SEC-10): API + base de datos + auditoría inmutable.
3. **HTTPS obligatorio** (SEC-06, SEC-07): certificado, HSTS, redirección; corregir `crypto.randomUUID`.
4. **Sanitizar exportaciones CSV** (SEC-05): quoting RFC 4180 + neutralización de fórmulas.
5. **Cabeceras de seguridad/CSP** (SEC-06) y eliminar credenciales demo (SEC-04).
6. **No guardar PII en `localStorage`** y hacer que “recordarme” funcione de verdad (SEC-03).

### Corto plazo

7. Validación compartida cliente/servidor con máximos y normalización (SEC-08).
8. Validación de esquema de sesión y fallback ante `localStorage` corrupto (SEC-09).
9. Auditoría con usuario autenticado (SEC-11).
10. Corregir contraste, nombres accesibles, encabezados, progreso y errores de formulario (A11Y-01 a A11Y-06).
11. Añadir búsqueda/filtros/orden/paginación y mejorar explicaciones de botones deshabilitados (UX-04, UX-05).
12. Traducir textos y ampliar touch targets (UX-06, UX-07).

### Mediano plazo

13. Tests unitarios/E2E y CI (QA-01).
14. Lighthouse CI sobre flujos autenticados y presupuesto de rendimiento.
15. Self-host de fuentes y revisión de chunks (PERF-02, PERF-03).
16. Documentar despliegue, rewrite SPA y cabeceras (QA-03); actualizar README (QA-02).
17. Plan de migración de datos mock y pruebas de carga.

---

## 11. Estado de remediación

Actualizado el 1 de noviembre de 2026 tras la implementación por fases. La columna **Estado** distingue lo resuelto en el frontend de lo que sigue bloqueado por la ausencia de backend.

| ID | Estado | Nota |
|---|---|---|
| SEC-01 | Parcial | Adaptador HTTP fail-closed y contrato de sesión; falta backend real. |
| SEC-02 | Parcial | Permisos en router, navegación y acciones; falta autorización de servidor. |
| SEC-03 | Mitigado | Sin PII en `localStorage`; «recordarme» se envía al backend; cookie segura pendiente de servidor. |
| SEC-04 | Resuelto | Credenciales demo eliminadas del formulario. |
| SEC-05 | Resuelto | CSV con quoting RFC 4180 y neutralización de fórmulas; pruebas añadidas. |
| SEC-06 | Resuelto | CSP, cabeceras de seguridad, DevTools condicionado y plantillas de despliegue. |
| SEC-07 | Resuelto | Eliminado `crypto.randomUUID`; aviso de contexto no seguro. |
| SEC-08 | Resuelto | Límites, capacidad y duplicados normalizados; validación de servidor pendiente. |
| SEC-09 | Resuelto | Sesión validada en runtime y limpieza de la clave legacy. |
| SEC-10 | Parcial | Repositorio y adaptador HTTP listos; falta API/BD. |
| SEC-11 | Resuelto en cliente | Auditoría demo usa el usuario autenticado; falta log inmutable en servidor. |
| SEC-12 | Resuelto | Vue DevTools solo en desarrollo. |
| SEC-13 | Sin cambios | Control positivo: no se introdujo `v-html`. |
| SEC-14 | Sin cambios | Dependencias de desarrollo pendientes de actualización planificada. |
| UX-01 | Resuelto | Enlace «¿Olvidó?» eliminado. |
| UX-02 | Pendiente | Fuera del alcance aprobado. |
| UX-03 | Pendiente | Fuera del alcance aprobado. |
| UX-04 | Resuelto | Búsqueda, filtros, orden y paginación en cuartos. |
| UX-05 | Mitigado | Botones con razón accesible y aviso al intentar una acción bloqueada. |
| UX-06 | Resuelto | Textos del sidebar y hoja móvil traducidos. |
| UX-07 | Mitigado | Objetivos táctiles ampliados y nombres accesibles en acciones móviles. |
| A11Y-01 | Resuelto | Tokens de contraste, tabs, placeholders y barras ajustados; revalidar con axe. |
| A11Y-02 | Resuelto | Eliminado `aria-label` que no coincidía con el texto visible. |
| A11Y-03 | Resuelto | `CardTitle` renderiza encabezado semántico `h2`. |
| A11Y-04 | Resuelto | Barras de progreso con nombre contextual. |
| A11Y-05 | Resuelto | Errores con `role="alert"` y campos con `aria-invalid`/`aria-describedby`. |
| A11Y-06 | Resuelto | Sidebar como `nav` y skip link al contenido principal. |
| A11Y-08 | Resuelto indirectamente | DevTools fuera del build de producción. |
| PERF-02 | Resuelto | Inter self-hosted con `@fontsource-variable/inter`. |
| PERF-03 | Sin cambios | Sin regresión relevante; presupuesto de CI pendiente. |
| QA-01 | Resuelto | Vitest, pruebas y workflow de CI sin autofix. |
| QA-02 | Resuelto | README actualizado con auth, API, entorno y despliegue. |
| QA-03 | Resuelto | Plantillas para Nginx, Netlify, Vercel y `_headers`. |

Verificación ejecutada: `npm run type-check`, `npm test` (20 pruebas), `npx eslint .`, `npx oxlint .`, `npm run build` y cabeceras del preview de producción.

## 12. Conclusión

La aplicación tiene una base visual y de componentes buena, y el build es sano. Pero la seguridad y la persistencia están **simuladas**: no hay autenticación real, no hay autorización, no hay backend y los datos se pierden al recargar. Para una demo local es suficiente; para producción, es necesario abordar primero los hallazgos **críticos/altos** (SEC-01, SEC-02, SEC-05, SEC-06, SEC-07, SEC-10) y después el resto de la deuda de accesibilidad, UX y calidad. Las evidencias adjuntas permiten reproducir cada hallazgo y verificar las correcciones.
