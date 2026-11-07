# Contrato: Estudiante-view (perfil del becado)

**Backend:** NO implementado. Todo este módulo es nuevo.

El módulo `estudiante-view` del frontend provee al estudiante logueado: avisos, notificaciones, documentos, preguntas frecuentes, firma de documentos y subida de documentos.

## GET /api/v1/estudiante/avisos (FALTA)

Respuesta: `Aviso[]`
```json
[
  { "id": "a-1", "titulo": "...", "contenido": "...", "fecha": "2026-08-25", "prioridad": "alta" }
]
```
`prioridad`: `baja | media | alta`.

## GET /api/v1/estudiante/notificaciones (FALTA)

Respuesta: `Notificacion[]`
```json
[
  { "id": "n-1", "titulo": "...", "mensaje": "...", "fecha": "2026-08-28", "leida": false, "tipo": "exito" }
]
```
`tipo`: `info | exito | advertencia | error`.

## PATCH /api/v1/estudiante/notificaciones/{id}/leida (FALTA)

Respuesta: 204.

## GET /api/v1/estudiante/documentos (FALTA)

Respuesta: `Documento[]`
```json
[
  { "id": "d-1", "nombre": "...", "tipo": "convenio", "descripcion": "...", "url": "...", "fecha_subida": "2026-09-01", "firmado": false, "fecha_firma": null, "firmado_por": null }
]
```
`tipo`: `convenio | boleta | tarjeta | acta_responsabilidad_material`.

## POST /api/v1/estudiante/documentos (FALTA)

Petición `multipart/form-data`: campos `nombre`, `tipo`, `descripcion`, `archivo` (File).  
Respuesta: `Documento` (con `id` y `url` asignados por el backend).

## POST /api/v1/estudiante/documentos/{id}/firmar (FALTA)

Respuesta: 200. Marca el documento como firmado con `fecha_firma` y `firmado_por`.

## GET /api/v1/estudiante/documentos/{id}/descargar (FALTA)

Respuesta: archivo binario (el `url` del documento o un endpoint de descarga directa).

## GET /api/v1/estudiante/preguntas-frecuentes (FALTA)

Respuesta: `PreguntaFrecuente[]`
```json
[ { "id": "p-1", "categoria": "Alojamiento", "pregunta": "...", "respuesta": "..." } ]
```

## Autenticación

Todos los endpoints requieren `Authorization: Bearer <token>` y el `estudiante_id` asociado al token (el backend ya lo resuelve en `UsuarioActual.estudiante_id`).
