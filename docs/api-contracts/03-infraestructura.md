# Contrato: Infraestructura

**Backend:** parcialmente implementado.  
**Endpoints existentes:** `GET/POST/PATCH /api/v1/edificios`, `GET/POST/PATCH /api/v1/escaleras`, `GET/POST/PATCH /api/v1/cuartos`, `GET/POST/PATCH /api/v1/estados-constructivos`, `GET /api/v1/estructura/arbol`, catálogos (`/catalogos/*`).  
**Faltantes:** DELETE de edificios/escaleras/cuartos, resumen consolidado, exportes CSV.

## GET /api/v1/estructura/arbol (ya existe)

Respuesta: `EdificioArbol[]` con `escaleras[]` y `cuartos[]` anidados. Útil para `obtenerEdificio(id)` del frontend.

## DELETE /api/v1/edificios/{id} (FALTA)

Respuesta: 204. Regla de negocio: no eliminar si tiene escaleras activas (el backend ya valida para desactivar; aplicar igual para eliminar).

## DELETE /api/v1/escaleras/{id} (FALTA)

Respuesta: 204. No eliminar si tiene cuartos activos.

## DELETE /api/v1/cuartos/{id} (FALTA)

Respuesta: 204. No eliminar si tiene alojamientos o medios activos.

## GET /api/v1/infraestructura/resumen (FALTA)

Respuesta (`InfraestructuraResumen` frontend):
```json
{
  "total_edificios": 0,
  "total_escaleras": 0,
  "total_cuartos": 0,
  "capacidad_total": 0,
  "ocupados": 0,
  "ocupacion_pct": 0,
  "estados": [{ "estado": { "id": 1, "nombre": "...", "habitable": true }, "cuartos": 0 }],
  "edificios": [ { "id": 1, "nombre": "...", "estado": {...}, "escaleras": 0, "cuartos": 0, "capacidad": 0, "ocupados": 0, "ocupacion_pct": 0 } ],
  "eventos": [{ "id": 1, "usuario": "...", "servicio": "...", "funcionalidad": "...", "fecha": "..." }]
}
```

## GET /api/v1/infraestructura/exportes/reporte (FALTA)

Respuesta: `text/csv`.

## GET /api/v1/infraestructura/exportes/censo/{edificio_id} (FALTA)

Respuesta: `text/csv`.

## Mapeo de campos

| Backend | Frontend |
|---|---|
| `estado_constructivo_id` | `estadoConstructivoId` |
| `capacidad_maxima` | `capacidadMaxima` |
| `nombre_completo` | `nombreCompleto` |
| `ocupacion_pct` | `ocupacionPct` |

**Nota:** `CrearEdificioInput` del frontend trae `estado_constructivo_id`, `estado_manual`, `observacion_estado`. El backend `EdificioCrear` solo acepta `nombre`. Solicitar agregar esos campos o crear el edificio y luego actualizar el estado por separado.
