import type { Permission, Role } from '@/types/auth'

export const ROLES: Role[] = ['estudiante', 'operador', 'administrador']

export const PERMISSIONS: Permission[] = [
  'infraestructura:read',
  'infraestructura:write',
  'deberes:read',
  'estudiantes:read',
  'estudiantes:write',
  'evaluaciones:read',
]

export const ETIQUETAS_ROL: Record<Role, string> = {
  estudiante: 'Estudiante de pregrado',
  operador: 'Operador de infraestructura',
  administrador: 'Administrador',
}

export const PERMISOS_POR_ROL: Record<Role, Permission[]> = {
  estudiante: ['infraestructura:read', 'deberes:read', 'estudiantes:read', 'evaluaciones:read'],
  operador: [
    'infraestructura:read',
    'infraestructura:write',
    'deberes:read',
    'estudiantes:read',
    'evaluaciones:read',
  ],
  administrador: [...PERMISSIONS],
}

export function esRol(value: unknown): value is Role {
  return typeof value === 'string' && ROLES.includes(value as Role)
}

export function esPermiso(value: unknown): value is Permission {
  return typeof value === 'string' && PERMISSIONS.includes(value as Permission)
}

export function puedeEscribirInfraestructura(permissions: Permission[]): boolean {
  return permissions.includes('infraestructura:write')
}

export function puedeEscribirEstudiantes(permissions: Permission[]): boolean {
  return permissions.includes('estudiantes:write')
}
