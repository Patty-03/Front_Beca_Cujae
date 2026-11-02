const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

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

  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const metodo = (init?.method ?? 'GET').toUpperCase()
  const csrf = leerCookie('csrf_token')
  if (csrf && metodo !== 'GET' && metodo !== 'HEAD') {
    headers.set('X-CSRF-Token', csrf)
  }

  return headers
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(apiUrl(path), {
      ...init,
      credentials: 'include',
      headers: crearHeaders(init),
    })
  } catch {
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
