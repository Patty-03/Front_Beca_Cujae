import type { Permission, Role, UsuarioAdmin } from '@/types/auth'

export interface CrearUsuarioInput {
  nombre: string
  email: string
  roles: Role[]
  activo: boolean
}

export interface ActualizarUsuarioInput {
  id: string
  nombre: string
  email: string
  roles: Role[]
  activo: boolean
}

export interface UsuarioRepository {
  obtenerUsuarios(): Promise<UsuarioAdmin[]>
  crearUsuario(input: CrearUsuarioInput): Promise<UsuarioAdmin>
  actualizarUsuario(input: ActualizarUsuarioInput): Promise<UsuarioAdmin>
  eliminarUsuario(id: string): Promise<void>
  asignarRol(usuarioId: string, rol: Role): Promise<UsuarioAdmin>
  actualizarPermisosRol(rol: Role, permisos: Permission[]): Promise<{ rol: Role; permisos: Permission[] }>
}