import type { AuthGateway, LoginCredentials, Permission, Role, Session } from '@/types/auth'
import { apiErrorMessage, apiFetch, apiJson, setAccessToken } from '@/lib/api'
import { esSesion, sesionExpirada } from './contracts'

const TOKEN_KEY = 'beca-cujae-access_token'

let sesionCache: Session | null = null

const PERMISO_BACK_TO_FRONT: Record<string, Permission[]> = {
  ESTUD_GESTIONAR: ['estudiantes:write'],
  ESTUD_CONSULTAR: ['estudiantes:read', 'infraestructura:read'],
  AUTO_VER_MIS_DATOS: ['estudiantes:read'],
  EST_GESTIONAR_ESTRUCTURA: ['infraestructura:write'],
  EST_GESTIONAR_MEDIOS: ['infraestructura:write'],
  SEG_RESTABLECER_CONTRASENA: ['usuarios:manage'],
  SEG_INICIAR_SESION: [],
}

function permisosFront(permisosBack: string[]): Permission[] {
  const resultado = new Set<Permission>()
  for (const p of permisosBack) {
    const mapeados = PERMISO_BACK_TO_FRONT[p]
    if (mapeados) for (const m of mapeados) resultado.add(m)
  }
  return Array.from(resultado)
}

function rolesFront(permisos: Permission[]): Role[] {
  const roles: Role[] = []
  if (permisos.includes('usuarios:manage')) roles.push('administrador')
  if (permisos.includes('infraestructura:write')) roles.push('operador')
  if (
    permisos.includes('estudiantes:read') ||
    permisos.includes('estudiantes:write')
  ) {
    roles.push('estudiante')
  }
  if (roles.length === 0) roles.push('estudiante')
  return roles
}

interface TokenRespuesta {
  access_token: string
  token_type: string
  cambiar_contrasena_antes_de: string | null
  contrasena_vencida: boolean
}

interface UsuarioPublico {
  id: number
  nombre: string
  estudiante_id: number | null
  permisos: string[]
  cambiar_contrasena_antes_de: string | null
  contrasena_vencida: boolean
}

async function leerSesionDesdeToken(): Promise<Session> {
  if (sesionCache) return sesionCache

  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) throw new Error('No hay token de acceso.')

  const response = await apiFetch('/api/v1/login/me')
  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY)
    setAccessToken(null)
    sesionCache = null
    throw new Error('La sesión ha expirado o no es válida.')
  }
  if (!response.ok) {
    throw new Error(await apiErrorMessage(response))
  }

  const data = (await apiJson<UsuarioPublico>(response)) as unknown as UsuarioPublico

  const permisos = permisosFront(data.permisos)
  const roles = rolesFront(permisos)

  const ahora = Date.now()
  const unDia = 24 * 60 * 60 * 1000
  const expiraContrasena = data.cambiar_contrasena_antes_de
    ? Date.parse(data.cambiar_contrasena_antes_de)
    : ahora + unDia
  const expiresAt =
    data.contrasena_vencida || !Number.isFinite(expiraContrasena)
      ? new Date(ahora).toISOString()
      : new Date(Math.min(expiraContrasena, ahora + unDia)).toISOString()

  const session: Session = {
    user: {
      id: String(data.id),
      name: data.nombre,
      email: '',
      roles,
      permissions: permisos,
    },
    expiresAt,
  }

  if (!esSesion(session) || sesionExpirada(session)) {
    throw new Error('La sesión recibida no es válida o ha expirado.')
  }

  sesionCache = session
  return session
}

export class HttpAuthGateway implements AuthGateway {
  async login(credentials: LoginCredentials): Promise<Session> {
    const form = new URLSearchParams()
    form.set('username', credentials.email)
    form.set('password', credentials.password)

    const response = await apiFetch('/api/v1/login/access-token', {
      method: 'POST',
      body: form,
    })

    if (response.status === 401) {
      throw new Error('Usuario o contraseña incorrectos.')
    }
    if (response.status === 429) {
      throw new Error('Demasiados intentos. Espera antes de volver a intentarlo.')
    }
    if (!response.ok) {
      throw new Error(await apiErrorMessage(response))
    }

    const data = (await apiJson<TokenRespuesta>(response)) as unknown as TokenRespuesta
    setAccessToken(data.access_token)
    localStorage.setItem(TOKEN_KEY, data.access_token)

    return leerSesionDesdeToken()
  }

  async getSession(): Promise<Session | null> {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return null
    setAccessToken(token)

    try {
      return await leerSesionDesdeToken()
    } catch (caught) {
      if ((caught as Error).message.includes('401') || (caught as Error).message.includes('expirada')) {
        localStorage.removeItem(TOKEN_KEY)
        setAccessToken(null)
        return null
      }
      throw caught
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem(TOKEN_KEY)
    setAccessToken(null)
    sesionCache = null
  }
}
