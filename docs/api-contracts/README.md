# Contratos de API pendiente de backend

Este directorio contiene los contratos de API que el **frontend** (`Front_Beca_Cujae`) necesita y que el **backend** (`Back_Beca_Cujae`) aún no expone. Cada archivo describe endpoints, cuerpos de petición/respuesta, códigos de estado y notas de migración.

## Origen del desacuerdo

- El frontend consume rutas con prefijo `/api/v1/` (configurado en `VITE_API_URL`).
- El backend expone FastAPI bajo `settings.API_V1_STR = "/api/v1"`.
- El frontend usa `camelCase`; el backend usa `snake_case` (Pydantic/SQLModel).
- Autenticación: el backend usa OAuth2 Bearer JWT (`POST /login/access-token` con `application/x-www-form-urlencoded`, `GET /login/me`). El frontend esperaba JSON `/api/auth/login` + sesión con cookie.

## Índice

| Módulo | Archivo | Estado backend |
|---|---|---|
| Autenticación | `01-autenticacion.md` | ⚠️ Parcial (login/me sí, login/logout no) |
| Estudiantes | `02-estudiantes.md` | ⚠️ Parcial (CRUD básico sí; importar/sugerir/asignar/eliminar no) |
| Infraestructura | `03-infraestructura.md` | ⚠️ Parcial (CRUD sí; resumen/exportes/DELETE no) |
| Inventario | `04-inventario.md` | ⚠️ Parcial (medios sí; DELETE y campos front no) |
| Usuarios | `05-usuarios.md` | ❌ No existe |
| Estudiante-view | `06-estudiante-view.md` | ❌ No existe |

## Reglas generales

1. Todas las respuestas de error usan el formato `{ "message": "..." }` o `{ "detail": "..." }`.
2. Las mutaciones (POST/PATCH/DELETE) requieren header `Authorization: Bearer <access_token>`.
3. El backend soporta `Idempotency-Key` para POST (ver `app/api/idempotencia.py`).
4. CORS está configurado para `http://localhost:5173` (ajustar en producción).
