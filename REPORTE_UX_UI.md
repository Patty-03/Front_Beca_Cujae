# Reporte UX/UI — Rol estudiante

**Fecha:** 2026-11-09  
**Ruta verificada:** `http://localhost:5173/` y `http://localhost:5173/infraestructura/edificios`  
**Rol de prueba:** estudiante (modo demo, sin backend real)  
**Evidencias:** `docs/evidencias/qa-2026-11-07/capturas/estudiante/`  
**Tipo:** solo reporte. No se modificó código fuente.

## 1. Alcance de la verificación
1. Iniciar sesión como estudiante.
2. Verificar que el sidebar SOLO muestre "Mi Perfil" y no muestre Infraestructura, Deberes, Estudiantes, Evaluaciones ni Super Admin.
3. Verificar que el home view del estudiante SOLO muestre una tarjeta de "Mi Perfil".
4. Verificar mensajes de error si un estudiante intenta acceder a un módulo no permitido.
5. Capturas de pantalla: login, sidebar, home view, intento de acceso denegado.
6. Ajustes priorizados P0/P1/P2 para la experiencia de estudiante.

## 2. Capturas de evidencia
| Captura | Ruta | Qué se verificó |
|---|---|---|
| Login estudiante | `docs/evidencias/qa-2026-11-07/capturas/estudiante/estudiante-login.png` | Formulario de acceso en modo demo. |
| Home view estudiante | `docs/evidencias/qa-2026-11-07/capturas/estudiante/estudiante-home-view.png` | Solo tarjeta "Mi Perfil" visible. |
| Sidebar estudiante | `docs/evidencias/qa-2026-11-07/capturas/estudiante/estudiante-sidebar.png` | Solo "Mi Perfil" bajo Módulos; sin otros módulos. |
| Acceso denegado | `docs/evidencias/qa-2026-11-07/capturas/estudiante/estudiante-acceso-denegado-superadmin.png` | Intento de acceso a `/superadmin` bloqueado/redirigido. |

## 3. Observaciones de interfaz
### 3.1 Inicio de sesión como estudiante
- El formulario de login funciona con cualquier correo válido y contraseña ≥ 8 caracteres en modo demo.
- No hay mensaje de error en login; el acceso demo es intencional y no debe usarse con datos reales.

### 3.2 Sidebar de estudiante
- **Cumple el requisito principal:** solo se muestra "Inicio" y "Mi Perfil".
- No se muestran Infraestructura, Deberes, Estudiantes, Evaluaciones ni Super Admin.
- El enlace "Mi Perfil" apunta a `/estudiante`.

### 3.3 Home view de estudiante
- **Cumple el requisito principal:** solo se renderiza la tarjeta "Mi Perfil".
- Título, descripción y botón "Abrir módulo" son claros.
- No se muestran tarjetas de Infraestructura, Deberes, Estudiantes ni Evaluaciones.

### 3.4 Acceso a módulos no permitidos
- Los intentos de acceso directo a `/superadmin`, `/estudiantes` y `/infraestructura/edificios` desde la sesión de estudiante redirigen al home sin mensaje explícito de denegación.
- En modo demo, la navegación directa mediante recarga de página pierde la sesión en memoria y redirige a `/login?redirect=...`.
- **Hallazgo UX:** no hay mensaje claro de tipo "No tienes permiso para acceder a este módulo" ni alerta accesible con `role="alert"` cuando el guard de rutas deniega el acceso por permisos.

## 4. Referencia de código revisada
- `src/lib/auth.ts:24` — rol `estudiante` tiene solo `estudiantes:read`.
- `src/components/app/AppSidebar.vue:115-120` — "Mi Perfil" usa `permission: 'estudiantes:read'`.
- `src/views/HomeView.vue:30,67-76` — `esEstudiante` filtra los accesos rápidos a solo "Mi Perfil".
- `src/router/index.ts:158-179` — guard de rutas redirige a `inicio` cuando faltan permisos, sin mensaje de error explícito.

## 5. Ajustes priorizados

### P0 — Acceso denegado sin mensaje claro
- Mostrar un mensaje explícito y accesible cuando un estudiante intente entrar a un módulo sin permisos, por ejemplo: "No tienes permiso para acceder a este módulo."
- Usar `role="alert"` o toast con `text-destructive` para el mensaje de denegación.
- Evitar que la redirección silenciosa al home sea la única respuesta.

### P1 — Consistencia entre permisos, sidebar y home
- Verificar que los permisos del rol estudiante coincidan con lo que se muestra en sidebar y home. Si `/estudiantes` no debe usarse, no otorgar `estudiantes:read` o ocultar la ruta del menú; si debe usarse, mostrarla en el sidebar.
- Mantener el home de estudiante solo con "Mi Perfil" tal como se verificó.

### P2 — Mejoras de experiencia y accesibilidad
- Añadir mensaje de sesión expirada/demo claro cuando el acceso directo recargue la página y pierda la sesión en memoria.
- Revisar contraste, etiquetas `aria-label` y enfoque de teclado en el sidebar y tarjetas del estudiante.
- Comparar con los tokens de diseño institucional (`Mockups/stitch_cujae_residencia_infraestructura_manager/cujae_institutional_infrastructure/DESIGN.md`) si se agregan pantallas específicas de estudiante.

## 6. Conclusión
La experiencia de estudiante cumple los requisitos de visibilidad reducida: sidebar y home muestran solo "Mi Perfil". El principal ajuste necesario es mejorar la claridad de los mensajes cuando se intenta acceder a módulos no permitidos; actualmente solo hay redirección silenciosa al home o pérdida de sesión en demo.
