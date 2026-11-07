# Contrato: Estudiantes

**Backend:** parcialmente implementado.  
**Endpoints existentes:** `GET /api/v1/estudiantes`, `GET /api/v1/estudiantes/{id}`, `POST /api/v1/estudiantes`, `PATCH /api/v1/estudiantes/{id}`.  
**Faltantes:** importar, sugerir cuartos, asignar cuarto, eliminar.

## GET /api/v1/estudiantes (ya existe)

Query: `q`, `especialidad_id`, `facultad_id`, `anio_academico`, `grupo`, `pais_id`, `sexo_id`, `activo`, `limit`, `offset`.

Respuesta (`EstudianteResumen` backend): `id, carnet_de_identidad, pasaporte, nombre, activo, anio_academico, grupo, sexo_id, pais_id, especialidad_id, especialidad, facultad`.

**Brecha con el frontend:** el frontend espera `EstudianteResumen` con `carnet, sexo ('F'|'M'), provincia, municipio, facultad, carrera, especialidad, anioAcademico, grupo, tipoIngreso, estadoBeca, telefono, asignacion, deberesPendientes, deberesIncumplidos`. El backend no expone `telefono`, `estadoBeca`, `tipoIngreso`, `provincia`, `municipio`, `asignacion`, `deberes*` en el listado.

**Solicitud:** agregar al menos `telefono`, `estado_beca`, `tipo_ingreso`, `provincia`, `municipio` al resumen, o exponer un endpoint de detalle más completo.

## GET /api/v1/estudiantes/{id} (ya existe)

Respuesta (`EstudianteLeer` backend): muchos campos (`fecha_nacimiento`, `sexo`, `pais`, `municipio`, `militancia`, `especialidad`, `anio_academico`, `grupo`, `fecha_de_ingreso`, `padecimiento`, `madre`, `padre`, `telefono_madre`, `telefono_padre`, `direccion_particular`, `telefono`, `correo_institucional`, `correo_alternativo`, `cuarto_actual`, `usuario_id`).

**Brecha:** el frontend espera `Estudiante` con `deberes[]`, `zona_procedencia`, `universidad_origen`, `preuniversitario`. El backend no expone `deberes`.

## POST /api/v1/estudiantes/importar (FALTA)

Petición: `{ estudiantes: EstudianteImportado[] }`  
Respuesta: `{ resumen: { total, validas, omitidas, rechazadas }, importadas: EstudianteResumen[] }`

## GET /api/v1/estudiantes/{id}/sugerencias-cuarto (FALTA)

Respuesta: `SugerenciaCuarto[]`  
```json
[
  {
    "cuarto_id": 1,
    "cuarto_nombre": "101",
    "edificio_id": 1,
    "edificio_nombre": "Edificio A",
    "escalera_id": 1,
    "escalera_nombre": "A",
    "capacidad_maxima": 2,
    "ocupados": 1,
    "disponibles": 1,
    "puntuacion": 90,
    "motivos": ["Cerca de escala"]
  }
]
```

## POST /api/v1/estudiantes/{id}/asignacion-cuarto (FALTA)

Petición: `{ cuarto_id, desde?, taquilla?, llave_entregada?, llave_taquilla_entregada? }`  
Respuesta: `AsignacionCuarto`

## DELETE /api/v1/estudiantes/{id} (FALTA)

Respuesta: 204.

## Mapeo de campos (backend snake_case → frontend camelCase)

| Backend | Frontend |
|---|---|
| `carnet_de_identidad` / `pasaporte` | `carnet` |
| `anio_academico` | `anioAcademico` |
| `fecha_nacimiento` | `fechaNacimiento` |
| `fecha_de_ingreso` | `fechaIngreso` |
| `direccion_particular` | `direccionParticular` |
| `telefono_madre` / `telefono_padre` | `telefonoMadre` / `telefonoPadre` |
| `cuarto_actual` | `asignacion` |
| `correo_institucional` / `correo_alternativo` | — (no mapeados en front) |
