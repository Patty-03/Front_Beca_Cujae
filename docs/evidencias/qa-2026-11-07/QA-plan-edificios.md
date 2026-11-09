# QA Plan - Módulo de Edificios e Infraestructura

## Resumen
Plan de pruebas para el módulo de gestión de edificios, escaleras y cuartos de la residencia CUJAE.

**Fecha:** 2026-11-09  
**Versión:** 1.0  
**Estado:** En ejecución

## Contexto
- Frontend: Vue 3 + Pinia + Tailwind (puerto 5173)
- Backend: FastAPI (puerto 8000)
- Base de datos: PostgreSQL con datos de prueba cargados
- Usuarios de prueba: `admin@cujae.edu.cu` / `12345678` (administrador), `estudiante@cujae.edu.cu` / `12345678` (estudiante)
- Datos de prueba creados: Edificio A, Escalera A, Cuarto 101, Estados constructivos (Bueno, Regular, Deficiente, En reparación)

## Casos de prueba

### CP-01: Abrir modal "Nuevo edificio"
**Objetivo:** Verificar que el modal se abre correctamente desde el listado de edificios.  
**Pasos:**
1. Iniciar sesión como administrador
2. Navegar a `/infraestructura/edificios`
3. Clic en botón "Nuevo edificio"
**Resultado esperado:** Modal se abre con campos Nombre, Estado constructivo, Observación

### CP-02: Combo de estados constructivos desplegado
**Objetivo:** Verificar que el combo "Estado constructivo definitivo" muestra opciones.  
**Pasos:**
1. Abrir modal "Nuevo edificio"
2. Clic en el combo "Estado constructivo definitivo"
**Resultado esperado:** Se muestran al menos 4 opciones (Bueno, Regular, Deficiente, En reparación)

### CP-03: Registrar edificio exitosamente
**Objetivo:** Verificar creación de nuevo edificio.  
**Pasos:**
1. Abrir modal "Nuevo edificio"
2. Llenar nombre (ej. "Edificio B")
3. Seleccionar estado constructivo
4. Clic en "Registrar edificio"
**Resultado esperado:** Edificio aparece en el listado, toast de éxito

### CP-04: Ver detalle de edificio
**Objetivo:** Verificar navegación al detalle y visualización de escaleras/cuartos.  
**Pasos:**
1. Clic en un edificio del listado
**Resultado esperado:** Se abre `/infraestructura/edificios/:id` con pestañas General, Escaleras, Cuartos, Estadísticas

### CP-05: Crear escalera
**Objetivo:** Verificar creación de escalera en edificio.  
**Pasos:**
1. Desde el detalle del edificio, clic en "Agregar escalera"
2. Llenar nombre
3. Guardar
**Resultado esperado:** Nueva escalera aparece en el edificio

### CP-06: Crear cuarto
**Objetivo:** Verificar creación de cuarto en escalera.  
**Pasos:**
1. Desde una escalera, clic en "Agregar cuarto"
2. Llenar nombre, capacidad, seleccionar estado
3. Guardar
**Resultado esperado:** Nuevo cuarto aparece en la escalera

### CP-07: Editar edificio
**Objetivo:** Verificar modificación de edificio existente.  
**Pasos:**
1. Clic en editar edificio
2. Cambiar nombre
3. Guardar
**Resultado esperado:** Nombre actualizado en el listado

### CP-08: Eliminar edificio sin escaleras
**Objetivo:** Verificar eliminación de edificio vacío.  
**Pasos:**
1. Crear edificio sin escaleras
2. Clic en eliminar
3. Confirmar
**Resultado esperado:** Edificio eliminado del listado

### CP-09: Error al eliminar edificio con escaleras
**Objetivo:** Verificar validación de negocio.  
**Pasos:**
1. Intentar eliminar edificio que tiene escaleras
**Resultado esperado:** Error "No se puede eliminar el edificio porque tiene escaleras registradas"

### CP-10: Control de permisos
**Objetivo:** Verificar que solo administrador puede crear edificios.  
**Pasos:**
1. Iniciar sesión como estudiante
2. Intentar acceder a `/infraestructura/edificios`
**Resultado esperado:** Redirección o mensaje de sin permisos

## Evidencias
- Capturas de pantalla: `docs/evidencias/qa-2026-11-07/capturas/`
- Logs de pruebas: `docs/evidencias/qa-2026-11-07/logs/`
- Lista de issues: `docs/evidencias/qa-2026-11-07/ISSUES.md`

## Criterios de aceptación
- [ ] Modal "Nuevo edificio" se abre correctamente
- [ ] Combo de estados constructivos muestra opciones
- [ ] Se puede crear edificio, escalera y cuarto
- [ ] Se puede editar y eliminar edificios sin escaleras
- [ ] Se bloquea eliminación de edificios con escaleras
- [ ] Permisos de rol se respetan
