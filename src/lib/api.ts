const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

const FETCH_TIMEOUT_MS = 10000

let accessToken: string | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export function getFetchTimeoutMs(): number {
  return FETCH_TIMEOUT_MS
}

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`
}

function leerCookie(nombre: string): string | null {
  if (typeof document === 'undefined') return null

  const cookie = document.cookie
    .split('; ')
    .find((parte) => parte.startsWith(`${nombre}=`))

  if (!cookie) return null

  const value = cookie.slice(nombre.length + 1)
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function crearHeaders(init?: RequestInit): Headers {
  const headers = new Headers(init?.headers)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')

  const body = init?.body
  const esForm = body instanceof URLSearchParams
  if (body && !esForm && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const acceso = getAccessToken()
  if (acceso) headers.set('Authorization', `Bearer ${acceso}`)

  const metodo = (init?.method ?? 'GET').toUpperCase()
  const csrf = leerCookie('csrf_token')
  if (csrf && metodo !== 'GET' && metodo !== 'HEAD') {
    headers.set('X-CSRF-Token', csrf)
  }

  return headers
}

async function fetchConTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  ms: number = FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), ms)

  try {
    const respuesta = await fetch(input, {
      ...init,
      signal: controlador.signal,
    })
    return respuesta
  } finally {
    clearTimeout(temporizador)
  }
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetchConTimeout(apiUrl(path), {
      ...init,
      credentials: 'include',
      headers: crearHeaders(init),
    })
  } catch (caught) {
    if (caught instanceof DOMException && caught.name === 'AbortError') {
      throw new Error(
        `El servidor tardó demasiado en responder (más de ${FETCH_TIMEOUT_MS / 1000}s). Verifique que el backend esté en ejecución en ${API_BASE}.`,
      )
    }
    throw new Error('No se pudo contactar con el servidor.')
  }
}

export async function apiErrorMessage(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json()
    if (typeof data === 'object' && data !== null && 'message' in data) {
      const message = data.message
      if (typeof message === 'string' && message.trim()) return message
    }
    if (typeof data === 'object' && data !== null && 'detail' in data) {
      const detail = data.detail
      if (typeof detail === 'string' && detail.trim()) return detail
    }
  } catch {
    // La respuesta no es JSON; se usa el mensaje genérico.
  }

  if (response.status === 401) return 'La sesión ha expirado o no es válida.'
  if (response.status === 403) return 'No tienes permisos para realizar esta acción.'
  if (response.status === 404) return 'El recurso solicitado no existe.'
  if (response.status === 429) return 'Demasiados intentos. Espera antes de volver a intentarlo.'

  return `La solicitud falló (${response.status}).`
}

export async function apiJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T
  } catch {
    throw new Error('El servidor devolvió una respuesta inválida.')
  }
}

export async function apiText(response: Response): Promise<string> {
  try {
    return await response.text()
  } catch {
    throw new Error('El servidor devolvió una respuesta inválida.')
  }
}
