import type { Permission, Role } from '@/types/auth'

export const ROLES: Role[] = ['estudiante', 'operador', 'administrador']

export const PERMISSIONS: Permission[] = [
  'infraestructura:read',
  'infraestructura:write',
  'deberes:read',
  'estudiantes:read',
  'estudiantes:write',
  'evaluaciones:read',
  'usuarios:manage',
  'roles:manage',
  'documentos:manage',
  'solicitudes-medios:crear',
  'solicitudes-medios:read',
  'solicitudes-medios:aprobar',
  'ESTUD_CONSULTAR',
]

export const ETIQUETAS_ROL: Record<Role, string> = {
  estudiante: 'Estudiante de pregrado',
  operador: 'Operador de infraestructura',
  administrador: 'Administrador',
}

export const PERMISOS_POR_ROL: Record<Role, Permission[]> = {
  estudiante: ['estudiantes:read', 'solicitudes-medios:crear', 'ESTUD_CONSULTAR'],
  operador: [
    'infraestructura:read',
    'infraestructura:write',
    'deberes:read',
    'estudiantes:read',
    'evaluaciones:read',
    'solicitudes-medios:read',
    'solicitudes-medios:aprobar',
  ],
  administrador: [...PERMISSIONS],
}

export function esRol(value: unknown): value is Role {
  return typeof value === 'string' && ROLES.includes(value as Role)
}

export function esSoloEstudiante(roles: Role[]): boolean {
  return roles.length === 1 && roles[0] === 'estudiante'
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
