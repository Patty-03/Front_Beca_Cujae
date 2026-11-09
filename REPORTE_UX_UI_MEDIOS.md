# Reporte UX/UI — Módulo de Solicitud de Medios Propios

**Fecha:** 2026-11-09  
**Ruta verificada:** `http://localhost:5173/`  
**Rol de prueba:** administrador y estudiante (modo demo, sin backend real)  
**Evidencias:** `docs/evidencias/qa-2026-11-07/capturas/medios/`  
**Tipo:** solo reporte. No se modificó código fuente.

## 1. Estado del módulo
El módulo de **Solicitud de Medios Propios** no está implementado en el frontend.

No se encontraron los archivos:
- `src/views/SolicitarMedioView.vue`
- `src/views/SolicitudesMediosView.vue`

No existen rutas para `/solicitar-medio` ni `/solicitudes-medios` en `src/router/index.ts`. Al navegar directamente a esas rutas se muestra la vista **404 Página no encontrada**.

No existe el ítem de sidebar **Solicitudes de Medios** ni la tarjeta de acceso rápido en `HomeView.vue`.

## 2. Evidencias capturadas
| Captura | Ruta | Qué muestra |
|---|---|---|
| Login administrador | `docs/evidencias/qa-2026-11-07/capturas/medios/login-admin.png` | Formulario de acceso en modo demo. |
| Home administrador | `docs/evidencias/qa-2026-11-07/capturas/medios/admin-home-view.png` | Tarjetas actuales: Infraestructura, Deberes, Estudiantes, Evaluaciones, Mi Perfil. No hay tarjeta de medios. |
| Sidebar administrador | `docs/evidencias/qa-2026-11-07/capturas/medios/admin-sidebar.png` | Módulos actuales: Infraestructura, Deberes, Estudiantes, Evaluaciones, Mi Perfil, Super Admin. No hay Solicitudes de Medios. |
| Solicitudes 404 | `docs/evidencias/qa-2026-11-07/capturas/medios/medios-solicitudes-404.png` | Ruta `/solicitudes-medios` no existe. |
| Solicitar 404 | `docs/evidencias/qa-2026-11-07/capturas/medios/medios-solicitar-404.png` | Ruta `/solicitar-medio` no existe. |
| Login estudiante | `docs/evidencias/qa-2026-11-07/capturas/medios/login-estudiante.png` | Formulario de acceso en modo demo. |
| Home estudiante | `docs/evidencias/qa-2026-11-07/capturas/medios/estudiante-home-view.png` | Solo tarjeta **Mi Perfil**. |
| Sidebar estudiante | `docs/evidencias/qa-2026-11-07/capturas/medios/estudiante-sidebar.png` | Solo **Mi Perfil** bajo Módulos. |

## 3. Referencia visual y de componentes existente
Se revisaron componentes similares para mantener consistencia si se implementa el módulo:
- `src/components/inventario/MedioFormDialog.vue`: formulario de medio con tipo, cantidad, estado, observaciones, validación visual y errores con `role="alert"`.
- `src/components/inventario/MediosDeCuartoPanel.vue`: tabla de medios, badges de estado, acciones editar/eliminar, estados de carga y vacío.
- `src/components/infraestructura/ConfirmDialog.vue`: diálogo de confirmación con acción destructiva.
- `src/lib/inventario.ts`: tipos `TipoMedio`, `EstadoMedio`, etiquetas y límites.
- `src/types/inventario.ts`: interfaz `MedioDeCuarto` (inventario asignado, no solicitud de estudiante).

## 4. Hallazgos de UX/UI
| ID | Hallazgo | Severidad |
|---|---|---|
| M-01 | No existen vistas `SolicitarMedioView.vue` ni `SolicitudesMediosView.vue`. | P0 |
| M-02 | No existen rutas ni protección por permisos para solicitudes de medios. | P0 |
| M-03 | El sidebar no muestra **Solicitudes de Medios** para ningún rol. | P0 |
| M-04 | `HomeView.vue` no muestra tarjeta de acceso rápido al módulo de medios. | P0 |
| M-05 | No hay tipo de permiso `medios:solicitar` ni `medios:gestionar` en `src/types/auth.ts`. | P0 |
| M-06 | No existe modelo de estado de solicitud (pendiente, aprobada, rechazada, entregada) separado del inventario de medios. | P1 |
| M-07 | No existe diálogo de aprobar/rechazar con motivo obligatorio para rechazo. | P1 |
| M-08 | No se verificaron estados visuales, badges, vacíos, esqueletos ni paginación porque las vistas no existen. | P1 |
| M-09 | Consistencia visual pendiente con `Mockups/stitch_cujae_residencia_infraestructura_manager/cujae_institutional_infrastructure/DESIGN.md`. | P2 |

## 5. Ajustes priorizados

### P0 — Críticos / bloqueantes de funcionalidad
1. Crear las vistas `SolicitarMedioView.vue` (estudiante) y `SolicitudesMediosView.vue` (operador/administrador).
2. Agregar rutas con guards:
   - `/solicitar-medio`: requiere `medios:solicitar`, roles estudiantes.
   - `/solicitudes-medios`: requiere `medios:gestionar`, roles operador/administrador.
3. Agregar permisos en `src/types/auth.ts` y `src/lib/auth.ts`:
   - `medios:solicitar`
   - `medios:gestionar`
4. Agregar ítem de sidebar **Solicitudes de Medios** solo para roles con el permiso correspondiente.
5. Agregar tarjeta de acceso rápido en `HomeView.vue` para los roles que tengan permiso al módulo.
6. Cuando un estudiante u operador intente acceder sin permiso, mostrar mensaje claro con `role="alert"`, no solo redirección silenciosa.

### P1 — Diseño del formulario de solicitud
- Título claro: **Solicitar medio propio**.
- Campos obligatorios marcados visualmente y con `aria-required="true"`:
  - Cuarto / escalera / edificio (seleccionable o automático según sesión).
  - Tipo de medio (taquilla, cama, colchón, almohada, lámpara, mesilla, ropero, ventilador, silla, escritorio, otro).
  - Cantidad (número entero, mínimo 1, máximo según límite de negocio).
  - Observaciones/justificación (opcional, con contador y máximo razonable).
- Estado inicial de la solicitud: **Pendiente** (no editable por el estudiante al crear).
- Validación visual:
  - `aria-invalid` en campos con error.
  - Mensaje de error con `role="alert"` y color destructivo.
  - Mensajes en español y accionables (ej. "Seleccione un tipo de medio", "La cantidad debe ser un número entero entre 1 y 20").
- Botón **Solicitar medio** deshabilitado durante el envío y toast de confirmación al guardar.
- Diseño responsivo: formulario en tarjeta, ancho máximo cómodo, foco visible y navegación por teclado.

### P1 — Diseño de lista de solicitudes
- Tabla con columnas: ID, Estudiante, Edificio/Escalera/Cuarto, Tipo medio, Cantidad, Estado, Fecha solicitud, Acciones.
- Estados con badges semánticos:
  - Pendiente: ámbar/amarillo.
  - Aprobada: verde.
  - Rechazada: rojo.
  - Entregada: azul/gris.
- Acciones para operador/administrador: **Aprobar**, **Rechazar**, **Ver detalle**.
- Estados de carga (esqueletos), vacío ("Sin solicitudes registradas"), error con botón **Reintentar** y paginación/filtros si aplica.
- Accesibilidad de tabla: encabezados con alcance, filtros con `aria-label`, filas navegables por teclado.

### P1 — Diálogo de aprobar/rechazar
- Título claro según acción: **Aprobar solicitud de medio** / **Rechazar solicitud de medio**.
- Resumen de la solicitud: estudiante, cuarto, tipo, cantidad, fecha.
- Para rechazar: campo **Motivo del rechazo** obligatorio.
- Botones: Cancelar, Aprobar (primario), Rechazar (destructivo).
- Deshabilitar botones durante carga y mostrar toast al completar.
- Usar `ConfirmDialog` como base para la acción destructiva.

### P2 — Consistencia visual con la app
- Usar tokens de diseño institucional:
  - Primario: `#006A4E` (CUJAE esmeralda).
  - Bordes de entrada: `#CBD5E1`.
  - Foco visible: anillo `#006A4E`.
  - Estados de error: `#DC2626`.
  - Badges de estado: paleta semántica del mockup (Bueno/Regular/En Reparación/Mal Estado/Fuera de Servicio) y estados de solicitud.
- Tipografía: `Inter`, encabezados de módulo, labels en mayúsculas con tracking, `tabular-nums` para cantidades y fechas.
- Formularios: inputs altura 36px, radio 4px, sombra nivel 3 para diálogos.
- Componentes: reutilizar Shadcn/Vue (`Dialog`, `Select`, `Input`, `Textarea`, `Table`, `Badge`, `Button`, `Alert`, `ConfirmDialog`) como en `MedioFormDialog` y `MediosDeCuartoPanel`.

## 6. Conclusión
El módulo de Solicitud de Medios Propios no existe en el frontend. Antes de cualquier revisión visual detallada, es necesario crear las vistas, rutas, permisos, ítem de sidebar y tarjeta de home. Las prioridades P0 se centran en que el módulo exista y sea accesible solo para los roles correctos; P1 define la experiencia de solicitud, lista, aprobación/rechazo y estados; P2 garantiza consistencia visual con el sistema de diseño de CUJAE.
