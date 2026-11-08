# Contrato: Usuarios (gestión completa)

**Backend:** NO implementado para administración.  
**Endpoints existentes:** solo `POST /api/v1/usuarios/yo/contrasena` (cambiar propia contraseña) y `POST /api/v1/usuarios/{id}/restablecer-contrasena` (restablecer ajeno).  
**Faltantes:** todo el CRUD de usuarios, roles y permisos.

## GET /api/v1/usuarios (FALTA)

Respuesta: `UsuarioAdmin[]`  
```json
[
  { "id": "1", "nombre": "Ana Pérez", "email": "ana@cujae.edu.cu", "roles": ["estudiante"], "activo": true }
]
```

## POST /api/v1/usuarios (FALTA)

Petición (`CrearUsuarioInput`): `{ nombre, email, roles: Role[], activo }`  
Respuesta: `UsuarioAdmin`

## PATCH /api/v1/usuarios/{id} (FALTA)

Petición (`ActualizarUsuarioInput`): `{ id, nombre, email, roles: Role[], activo }`  
Respuesta: `UsuarioAdmin`

## DELETE /api/v1/usuarios/{id} (FALTA)

Respuesta: 204.

## PATCH /api/v1/usuarios/{id}/roles (FALTA)

Petición: `{ rol: Role }`  
Respuesta: `UsuarioAdmin`

## PATCH /api/v1/roles/{rol}/permisos (FALTA)

Petición: `{ permisos: Permission[] }`  
Respuesta: `{ rol: Role, permisos: Permission[] }`

## Catálogos de referencia (frontend)

Roles: `estudiante`, `operador`, `administrador`.  
Permisos frontend: `infraestructura:read`, `infraestructura:write`, `deberes:read`, `estudiantes:read`, `estudiantes:write`, `evaluaciones:read`, `usuarios:manage`, `roles:manage`, `documentos:manage`.

**Nota:** el frontend usa `id` de tipo `string` para usuarios; el backend usa `int`. Acordar serialización (string en JSON) para evitar incompatibilidades de TypeScript.
