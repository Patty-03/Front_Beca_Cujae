import type { CrearUsuarioInput, ActualizarUsuarioInput } from '@/types/auth'
import { modoDemo } from '@/services/auth'
import { demoUsuarioRepository } from './demoRepository'
import { HttpUsuarioRepository } from './httpRepository'

const repositorio = modoDemo
  ? demoUsuarioRepository
  : new HttpUsuarioRepository()

export const obtenerUsuarios = (): Promise<import('@/types/auth').UsuarioAdmin[]> =>
  repositorio.obtenerUsuarios()

export const crearUsuario = (input: CrearUsuarioInput): Promise<import('@/types/auth').UsuarioAdmin> =>
  repositorio.crearUsuario(input)

export const actualizarUsuario = (
  input: ActualizarUsuarioInput,
): Promise<import('@/types/auth').UsuarioAdmin> => repositorio.actualizarUsuario(input)

export const eliminarUsuario = (id: string): Promise<void> => repositorio.eliminarUsuario(id)

export const asignarRol = (usuarioId: string, rol: import('@/types/auth').Role): Promise<import('@/types/auth').UsuarioAdmin> =>
  repositorio.asignarRol(usuarioId, rol)

export const actualizarPermisosRol = (
  rol: import('@/types/auth').Role,
  permisos: import('@/types/auth').Permission[],
): Promise<{ rol: import('@/types/auth').Role; permisos: import('@/types/auth').Permission[] }> =>
  repositorio.actualizarPermisosRol(rol, permisos)