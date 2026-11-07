# Contrato: Inventario (medios)

**Backend:** parcialmente implementado.  
**Endpoints existentes:** `GET /api/v1/medios` (filtro `cuarto_id`), `POST /api/v1/medios`, `PATCH /api/v1/medios/{id}`.  
**Faltantes:** `DELETE /api/v1/medios/{id}`, campos `cantidad`/`estado`/`observaciones`, tipo medio como string enum.

## GET /api/v1/medios?cuarto_id=X (ya existe)

Respuesta (`MedioLeer` backend): `id, nombre, usable, activo, tipo_medio { id, nombre, activo }, cuarto { id, nombre, nombre_completo }`.

**Brecha:** el frontend espera `MedioDeCuarto { id, cuarto_id, tipo ('taquilla'|'cama'|...), cantidad, estado ('bueno'|'danado'|'reparacion'), observaciones? }`. El backend no expone `cantidad`, `estado`, `observaciones`, y `tipo` es un objeto con `nombre` libre, no el enum del frontend.

**Solicitud:** agregar a `Medio` los campos `cantidad` (int), `estado` (enum: bueno/danado/reparacion), `observaciones` (string), y normalizar `tipo_medio.nombre` al enum del frontend o proveer un catálogo cerrado de tipos con IDs estables.

## POST /api/v1/medios (ya existe)

Petición backend (`MedioCrear`): `nombre, tipo_medio_id (int), cuarto_id, usable`.  
Petición frontend (`CrearMedioInput`): `cuarto_id, tipo (string enum), cantidad, estado, observaciones?`.

**Brecha:** el frontend no sabe el `tipo_medio_id` (int) ni el `nombre`. Solicitar aceptar `tipo` como string o proveer endpoint de catálogo `GET /api/v1/tipos-medio` con nombres estables para hacer el mapeo.

## PATCH /api/v1/medios/{id} (ya existe)

Petición backend: `nombre, tipo_medio_id, usable, activo`.  
**Brecha:** no expone `cantidad`, `estado`, `observaciones`.

## DELETE /api/v1/medios/{id} (FALTA)

Respuesta: 204.
