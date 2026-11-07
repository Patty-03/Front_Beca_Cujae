import type {
  ActualizarUsuarioInput,
  CrearUsuarioInput,
  Permission,
  Role,
  UsuarioAdmin,
} from '@/types/auth'
import { apiErrorMessage, apiFetch, apiJson } from '@/lib/api'
import type { UsuarioRepository } from './contracts'

const BASE = '/api/v1/usuarios'

async function solicitarJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(`${BASE}${path}`, init)

  if (!response.ok) {
    throw new Error(await apiErrorMessage(response))
  }

  return apiJson<T>(response)
}

async function solicitarVoid(path: string, init?: RequestInit): Promise<void> {
  const response = await apiFetch(`${BASE}${path}`, init)

  if (!response.ok) {
    throw new Error(await apiErrorMessage(response))
  }
}

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
