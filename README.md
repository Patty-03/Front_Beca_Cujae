# Becas CUJAE — Frontend

Aplicación SPA para la gestión de becas universitarias de la CUJAE, construida con Vue 3, Vite, Tailwind CSS v4 y shadcn-vue.

## Stack

- Vue 3 + TypeScript
- Vite 8
- Vue Router 5 y Pinia 4
- Tailwind CSS v4
- shadcn-vue (Reka UI + lucide)
- ESLint, Prettier y Oxlint

## Requisitos

- Node.js 22.18+ o 24.12+
- npm

## Puesta en marcha

```sh
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

## Acceso de demostración

La autenticación es simulada y se guarda en `localStorage`; no requiere backend.

- Correo: `estudiante@cujae.edu.cu`
- Contraseña: `beca2026`

También se acepta cualquier correo válido con una contraseña de al menos 4 caracteres.

## Scripts

```sh
npm run dev        # servidor de desarrollo
npm run build      # type-check + build de producción
npm run preview    # previsualizar el build
npm run type-check # comprobar tipos con vue-tsc
npm run lint       # Oxlint + ESLint
npm run format     # Prettier
```

## Estructura

```text
src/
├─ components/
│  ├─ app/          # layout, sidebar, header y tabla de solicitudes
│  ├─ ui/           # componentes generados por shadcn-vue
│  └─ ModeToggle.vue
├─ data/mock.ts     # datos de ejemplo
├─ layouts/         # layout autenticado
├─ lib/             # utilidades (cn, formato)
├─ router/          # rutas y guard de autenticación
├─ stores/          # Pinia (auth)
├─ types/           # tipos del dominio
├─ views/           # login, dashboard, solicitudes, becas y 404
└─ style.css        # Tailwind + tema de shadcn-vue
```

## Notas

- El tema claro/oscuro se gestiona con `useColorMode` de VueUse.
- Los datos de becas y solicitudes son mock; se pueden sustituir por llamadas a una API en `src/data/mock.ts` y `src/stores/auth.ts`.
- Para añadir más componentes de shadcn-vue:

```sh
npx shadcn-vue@latest add dialog
```
