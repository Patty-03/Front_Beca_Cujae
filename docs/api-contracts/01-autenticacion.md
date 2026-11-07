# Contrato: Autenticación

**Backend:** parcialmente implementado.  
**Endpoints existentes:** `POST /api/v1/login/access-token`, `GET /api/v1/login/me`.  
**Faltantes:** `POST /api/v1/auth/logout`.

## POST /api/v1/login/access-token (ya existe)

Petición (`application/x-www-form-urlencoded`):
- `username` (string): correo/usuario.
- `password` (string).

Respuesta 200:
```json
{
  "access_token": "string",
  "token_type": "bearer",
  "cambiar_contrasena_antes_de": "2026-09-01T00:00:00 | null",
  "contrasena_vencida": false
}
```

Respuestas de error: 400 (credenciales incorrectas / usuario inactivo), 403 (no puede iniciar sesión), 429 (cuenta bloqueada).

## GET /api/v1/login/me (ya existe)

Requiere `Authorization: Bearer <token>`.

Respuesta 200 (`UsuarioPublico`):
```json
{
  "id": 1,
  "nombre": "Ana Pérez",
  "estudiante_id": 12,
  "permisos": ["ESTUD_CONSULTAR", "EST_CONSULTAR"],
  "cambiar_contrasena_antes_de": null,
  "contrasena_vencida": false
}
```

**Nota para el backend:** este endpoint **no devuelve `email`**. El frontend necesita el email del usuario autenticado para poblar `SessionUser.email`. Opción A: agregar `email` a `UsuarioPublico`. Opción B: el frontend lo guarda en sesión local tras el login.

## POST /api/v1/auth/logout (FALTA)

Petición:
- Header `Authorization: Bearer <token>`.

Respuesta 204: invalida el token / cierra sesión.  
Si no se puede implementar aún, el frontend limpia el token localmente (ya lo hace).

## Mapeo sugerido (backend permiso → frontend permiso)

| Backend (`permisos`) | Frontend (`Permission`) |
|---|---|
| `ESTUD_GESTIONAR` | `estudiantes:write` |
| `ESTUD_CONSULTAR` | `estudiantes:read`, `infraestructura:read` |
| `AUTO_VER_MIS_DATOS` | `estudiantes:read` |
| `EST_GESTIONAR_ESTRUCTURA` | `infraestructura:write` |
| `EST_GESTIONAR_MEDIOS` | `infraestructura:write` |
| `SEG_RESTABLECER_CONTRASENA` | `usuarios:manage` |
| `SEG_INICIAR_SESION` | — (sistema) |

Roles inferidos del frontend: `administrador` si tiene `usuarios:manage`; `operador` si tiene `infraestructura:write`; `estudiante` si tiene `estudiantes:read` o `estudiantes:write`.
