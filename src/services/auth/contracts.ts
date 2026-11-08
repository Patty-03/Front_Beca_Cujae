import type { Session } from '@/types/auth'
import { esPermiso, esRol } from '@/lib/auth'

function esRegistro(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function esSesion(value: unknown): value is Session {
  if (!esRegistro(value) || !esRegistro(value.user)) return false

  const { user } = value

  if (
    typeof user.id !== 'string' ||
    user.id.trim() === '' ||
    typeof user.name !== 'string' ||
    user.name.trim() === '' ||
    typeof user.email !== 'string'
  ) {
    return false
  }

  if (
    !Array.isArray(user.roles) ||
    user.roles.length === 0 ||
    !user.roles.every((rol) => esRol(rol))
  ) {
    return false
  }

  if (!Array.isArray(user.permissions) || !user.permissions.every((permiso) => esPermiso(permiso))) {
    return false
  }

  return value.expiresAt === null || typeof value.expiresAt === 'string'
}

export function sesionExpirada(session: Session): boolean {
  if (session.expiresAt === null) return false

  const expiracion = Date.parse(session.expiresAt)
  return !Number.isFinite(expiracion) || expiracion <= Date.now()
}
