import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

const cabecerasComunes = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
}

function crearCsp(apiUrl: string, desarrollo: boolean): string {
  let apiSource = ''

  if (apiUrl.startsWith('http')) {
    try {
      apiSource = new URL(apiUrl).origin
    } catch {
      apiSource = ''
    }
  }

  const connectSources = ["'self'", apiSource, desarrollo ? 'ws: wss:' : '']
    .filter(Boolean)
    .join(' ')

  return [
    "default-src 'self'",
    desarrollo ? "script-src 'self' 'unsafe-eval'" : "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data:",
    `connect-src ${connectSources}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ')
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const desarrollo = mode === 'development'
  const csp = crearCsp(env.VITE_API_URL ?? '', desarrollo)

  return {
    plugins: [
      vue(),
      ...(desarrollo ? [vueDevTools()] : []),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      headers: {
        ...cabecerasComunes,
        'Content-Security-Policy-Report-Only': csp,
      },
    },
    preview: {
      headers: {
        ...cabecerasComunes,
        'Content-Security-Policy': csp,
      },
    },
  }
})
