import type { CrearUsuarioInput, ActualizarUsuarioInput, UsuarioAdmin } from '@/types/auth'
import type { UsuarioRepository } from './contracts'

const usuarios: UsuarioAdmin[] = [
  { id: 'u-1', nombre: 'Administrador Demo', email: 'admin@beca.cujae.edu', roles: ['administrador'], activo: true },
  { id: 'u-2', nombre: 'Operador Demo', email: 'operador@beca.cujae.edu', roles: ['operador'], activo: true },
  { id: 'u-3', nombre: 'Estudiante Demo', email: 'estudiante@beca.cujae.edu', roles: ['estudiante'], activo: true },
]

const delay = (ms = 240) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const encontrarUsuario = (id: string) => usuarios.find((usuario) => usuario.id === id)

export const demoUsuarioRepository: UsuarioRepository = {
  obtenerUsuarios: async (): Promise<UsuarioAdmin[]> => {
    await delay(120)
    return usuarios.map((usuario) => ({ ...usuario }))
  },
  crearUsuario: async (input: CrearUsuarioInput): Promise<UsuarioAdmin> => {
    await delay()
    const usuario: UsuarioAdmin = { id: 'u-' + (usuarios.length + 1).toString(), ...input }
    usuarios.push(usuario)
    return { ...usuario }
  },
  actualizarUsuario: async (input: ActualizarUsuarioInput): Promise<UsuarioAdmin> => {
    await delay()
    const index = usuarios.findIndex((usuario) => usuario.id === input.id)
    if (index < 0) throw new Error('El usuario solicitado no existe.')
    usuarios[index] = { ...input }
    return { ...usuarios[index] }
  },
  eliminarUsuario: async (id: string): Promise<void> => {
    await delay()
    const index = usuarios.findIndex((usuario) => usuario.id === id)
    if (index < 0) throw new Error('El usuario solicitado no existe.')
    usuarios.splice(index, 1)
  },
  asignarRol: async (usuarioId: string, rol: import('@/types/auth').Role): Promise<UsuarioAdmin> => {
    await delay()
    const usuario = encontrarUsuario(usuarioId)
    if (!usuario) throw new Error('El usuario solicitado no existe.')
    const actualizado = { ...usuario, roles: [rol] }
    const index = usuarios.findIndex((u) => u.id === usuarioId)
    if (index >= 0) usuarios[index] = actualizado
    return actualizado
  },
  actualizarPermisosRol: async (rol: import('@/types/auth').Role, permisos: import('@/types/auth').Permission[]): Promise<{ rol: import('@/types/auth').Role; permisos: import('@/types/auth').Permission[] }> => {
    await delay()
    return { rol, permisos }
  },
}