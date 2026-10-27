# Becas CUJAE — Frontend

SIstema para la gestión de la residencia de la CUJAE, construida con Vue 3, Vite, Tailwind CSS v4 y shadcn-vue.

Repositorio: [Patty-03/Front_Beca_Cujae](https://github.com/Patty-03/Front_Beca_Cujae)

## Stack

- Vue 3 + TypeScript
- Vite 8
- Vue Router 5 y Pinia 4
- Tailwind CSS v4
- shadcn-vue (Reka UI + lucide)
- vue-sonner
- ESLint, Prettier y Oxlint

## Requisitos

- Node.js `^22.18.0` o `>=24.12.0` (Node 23 no está soportado)
- npm
- Git

El proyecto no requiere backend ni variables de entorno para funcionar en local.

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
| `npm run lint` | Ejecuta Oxlint y ESLint con autofix |
| `npm run format` | Formatea `src/` con Prettier |

`npm run build` genera la carpeta `dist/` con los archivos listos para publicar.

## Notas de desarrollo

- La paleta CUJAE es fija: navy `#003366`, verde `#006a4e` y superficie `#f8f9fa`; el proyecto no incluye modo oscuro.
- Los datos de becas y solicitudes son mock y están en `src/data/mock.ts`.
- La autenticación es simulada y se gestiona en `src/stores/auth.ts`.
- El alias `@` apunta a `src`.
- Los componentes de shadcn-vue viven en `src/components/ui`. Para añadir más:

```sh
npx shadcn-vue@latest add dialog
```
