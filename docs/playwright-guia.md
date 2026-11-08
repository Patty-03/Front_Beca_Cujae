# Guía de Instalación y Ejecución de Pruebas E2E con Playwright

## 1. Instalar Playwright

```bash
# Instalar la librería de pruebas
npm install -D @playwright/test

# Instalar los navegadores (requiere conexión a internet)
npx playwright install chromium
```

> **Nota:** Si la descarga de navegadores falla por restricción geográfica (error 403 del CDN), prueba con una VPN o instala los navegadores manualmente desde la máquina que tenga acceso a `https://cdn.playwright.dev`.

## 2. Ejecutar las pruebas

```bash
# Ejecutar todas las pruebas E2E
npm run test:e2e

# Ejecutar con interfaz visual (modo observador)
npm run test:e2e:ui

# Ver el reporte HTML de la última ejecución
npm run test:e2e:report
```

## 3. Estructura de pruebas

```
e2e/
├── estudiante-perfil.spec.ts      # Dashboard, KPIs, cuarto, deberes, avisos
├── estudiante-documentos.spec.ts  # Firmar y descargar documentos
└── admin-subir-documento.spec.ts  # Admin sube documentos para firma
```

## 4. Requisitos previos

Antes de ejecutar las pruebas:
1. El backend debe estar corriendo en `http://localhost:8000`
2. El frontend debe estar accesible en `http://localhost:5173`
3. Las credenciales de prueba deben existir en el backend

## 5. Configuración

El archivo `playwright.config.ts` en la raíz del proyecto configura:
- Navegador: Chromium (Desktop Chrome)
- URL base: `http://localhost:5173`
- Servidor de desarrollo: se inicia automáticamente con `npm run dev`
- Capturas de pantalla y video: solo en caso de falla
