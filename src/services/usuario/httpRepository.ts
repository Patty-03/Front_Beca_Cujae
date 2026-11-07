import type {
  ActualizarUsuarioInput,
  CrearUsuarioInput,
  Permission,
  Role,
  UsuarioAdmin,
} from '@/types/auth'
import type { UsuarioRepository } from './contracts'

export class HttpUsuarioRepository implements UsuarioRepository {
  async obtenerUsuarios(): Promise<UsuarioAdmin[]> {
    throw new Error('Pendiente de backend: GET /api/v1/usuarios')
  }

  async crearUsuario(_input: CrearUsuarioInput): Promise<UsuarioAdmin> {
    throw new Error('Pendiente de backend: POST /api/v1/usuarios')
  }

  async actualizarUsuario(_input: ActualizarUsuarioInput): Promise<UsuarioAdmin> {
    throw new Error('Pendiente de backend: PATCH /api/v1/usuarios/{id}')
  }

  async eliminarUsuario(_id: string): Promise<void> {
    throw new Error('Pendiente de backend: DELETE /api/v1/usuarios/{id}')
  }

  async asignarRol(_usuarioId: string, _rol: Role): Promise<UsuarioAdmin> {
    throw new Error('Pendiente de backend: PATCH /api/v1/usuarios/{id}/roles')
  }

  async actualizarPermisosRol(
    _rol: Role,
    _permisos: Permission[],
  ): Promise<{ rol: Role; permisos: Permission[] }> {
    throw new Error('Pendiente de backend: PATCH /api/v1/roles/{rol}/permisos')
  }
}
