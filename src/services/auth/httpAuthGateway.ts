import type { AuthGateway, LoginCredentials, Session } from '@/types/auth'
import { apiErrorMessage, apiFetch, apiJson } from '@/lib/api'
import { esSesion, sesionExpirada } from './contracts'

async function leerSesion(response: Response): Promise<Session> {
  const data: unknown = await apiJson(response)

  if (!esSesion(data) || sesionExpirada(data)) {
    throw new Error('La sesión recibida no es válida o ha expirado.')
  }

  return data
}

export class HttpAuthGateway implements AuthGateway {
  async login(credentials: LoginCredentials): Promise<Session> {
    const response = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })

    if (response.status === 401) {
      throw new Error('Correo o contraseña incorrectos.')
    }

    if (!response.ok) {
      throw new Error(await apiErrorMessage(response))
    }

    return leerSesion(response)
  }

  async getSession(): Promise<Session | null> {
    const response = await apiFetch('/api/auth/session')

    if (response.status === 401) return null

    if (!response.ok) {
      throw new Error(await apiErrorMessage(response))
    }

    return leerSesion(response)
  }

  async logout(): Promise<void> {
    const response = await apiFetch('/api/auth/logout', { method: 'POST' })

    if (response.status === 401 || response.ok) return

    throw new Error(await apiErrorMessage(response))
  }
}
