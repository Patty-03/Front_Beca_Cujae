# Video del proyecto (Remotion)

## Requisitos
- Dependencias instaladas: `npm install`
- Para capturar la demo automáticamente: navegador de Playwright (`npx playwright install chromium`) si no está instalado.
- `ffmpeg` lo gestiona Remotion internamente para renderizar en la mayoría de casos; si el render falla, instala ffmpeg y agrégalo al PATH.

## 1. Capturar video de la página web
Graba un recorrido automático del proyecto en modo demo y guarda `video/public/demo.webm`:

```sh
npm run video:capture
```

El script levanta Vite temporalmente con `VITE_AUTH_MODE=demo` y `VITE_DEMO_ROLE=administrador`, navega rutas principales y guarda la grabación.

## 2. Abrir Remotion Studio
```sh
npm run video:studio
```

Abre la URL que muestre la terminal (normalmente `http://localhost:3000`) en tu navegador. Ahí puedes previsualizar/editar props y la composición `ProyectoBecaCujae`.

## 3. Renderizar el video final
```sh
npm run video:render
```

Salida: `out/demo.mp4`.

## Archivos principales
- `remotion.config.ts`: configuración de Remotion (entry, `public` en `video/public`).
- `video/index.ts`: entrypoint.
- `video/Root.tsx`: composiciones.
- `video/ProyectoVideo.tsx`: escenas/timeline.
- `scripts/video/capture-demo.mjs`: captura con Playwright.
