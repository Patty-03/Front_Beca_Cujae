# Becas CUJAE — Frontend

Sistema para la gestión de la residencia de la CUJAE, construido con Vue 3, Vite, Tailwind CSS v4 y shadcn-vue.

Repositorio: [Patty-03/Front_Beca_Cujae](https://github.com/Patty-03/Front_Beca_Cujae)

## Stack

- Vue 3 + TypeScript
- Vite 8
- Vue Router 5 y Pinia 4
- Tailwind CSS v4
- shadcn-vue (Reka UI + lucide)
- vue-sonner
- Vitest y Vue Test Utils
- ESLint, Prettier y Oxlint

## Requisitos

- Node.js `^22.18.0` o `>=24.12.0` (Node 23 no está soportado)
- npm
- Git

Para usar datos reales se necesita un backend compatible con el contrato de `docs/auditoria-app.md`. Sin backend, la aplicación falla cerrada; para una demo local se puede activar el modo demo en memoria.

## Instalación

```sh
git clone https://github.com/Patty-03/Front_Beca_Cujae.git
cd Front_Beca_Cujae
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

Para una instalación reproducible usando el lockfile:

```sh
npm ci
npm run dev
```

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Ejecuta type-check y build de producción |
| `npm run build-only` | Solo ejecuta el build de Vite |
| `npm run preview` | Previsualiza el build de producción |
| `npm run type-check` | Comprueba los tipos con `vue-tsc` |
| `npm test` | Ejecuta las pruebas con Vitest |
| `npm run test:watch` | Ejecuta Vitest en modo vigilancia |
| `npm run lint` | Ejecuta Oxlint y ESLint con autofix |
| `npm run format` | Formatea `src/` con Prettier |

`npm run build` genera la carpeta `dist/` con los archivos listos para publicar.

## Configuración

Copia `.env.example` a `.env.local` y ajusta los valores:

| Variable | Descripción |
| --- | --- |
| `VITE_API_URL` | URL base de la API. Vacío usa el mismo origen. |
| `VITE_AUTH_MODE` | `http` (por defecto) o `demo`. |
| `VITE_DEMO_ROLE` | Rol del adaptador demo: `estudiante`, `operador` o `administrador`. |

El modo demo mantiene los datos y la sesión en memoria; se pierden al recargar y no debe usarse con datos reales.

```sh
# .env.local
VITE_AUTH_MODE=demo
VITE_DEMO_ROLE=administrador
```

En modo demo se acepta cualquier correo válido y una contraseña de al menos 8 caracteres.

## Módulo de estudiantes

La vista `/estudiantes` permite consultar la matrícula becada, filtrar por provincia, carrera,
edificio, tipo de ingreso y estado, ver la ficha completa, los deberes y el cuarto asignado.

La importación usa archivos `.xlsx` con la plantilla que genera la propia aplicación
(`write-excel-file`). La lectura se hace con `read-excel-file` y se valida en el navegador antes
de enviar los datos. Reglas de importación:

- Solo se aceptan estudiantes con tipo de ingreso `Residente en provincia`.
- La Habana se omite y se reporta en la previsualización.
- Los extranjeros, carnets duplicados y filas con errores se omiten o rechazan sin sobrescribir.
- La asignación de cuarto es una sugerencia automática y requiere confirmación manual.
- El permiso `estudiantes:write` habilita importar y asignar; en los roles demo solo lo tiene
  `administrador`.

Los datos mock viven en `src/data/mockEstudiantes.ts` y el repositorio demo en
`src/services/estudiantes/demoRepository.ts`.

## API esperada

- `POST /api/auth/login`, `GET /api/auth/session`, `POST /api/auth/logout`.
- `GET|POST /api/infraestructura/edificios`, `GET|PATCH|DELETE /api/infraestructura/edificios/:id`.
- CRUD anidado de escaleras y cuartos bajo `/api/infraestructura`.
- `GET /api/infraestructura/exportes/reporte` y `/exportes/censo/:edificioId` devuelven `text/csv`.
- `GET /api/estudiantes` y `GET /api/estudiantes/:id` devuelven el listado y la ficha.
- `POST /api/estudiantes/importar` recibe `{ estudiantes: EstudianteImportado[] }`.
- `GET /api/estudiantes/:id/sugerencias-cuarto` devuelve las sugerencias de asignación.
- `POST /api/estudiantes/:id/asignacion-cuarto` crea o mueve la asignación activa.
- La sesión usa cookie `HttpOnly`, `Secure` y `SameSite`; las mutaciones envían `X-CSRF-Token` desde la cookie `csrf_token`.

## Notas de desarrollo

- La paleta CUJAE es fija: navy `#003366`, verde `#006a4e` y superficie `#f8f9fa`; el proyecto no incluye modo oscuro.
- Los datos mock de infraestructura están en `src/data/mockInfraestructura.ts`.
- La autenticación real vive en `src/services/auth/httpAuthGateway.ts`; la demo en `src/services/auth/demoAuthGateway.ts`. No se guarda PII en `localStorage`.
- Las exportaciones CSV están en `src/lib/csv.ts` y neutralizan fórmulas.
- Hay plantillas de despliegue en `deploy/nginx.conf`, `netlify.toml`, `vercel.json` y `public/_headers`; sustituye `api.example.com` por el origen real.
- El alias `@` apunta a `src`.
- Los componentes de shadcn-vue viven en `src/components/ui`. Para añadir más:

```sh
npx shadcn-vue@latest add dialog
```
