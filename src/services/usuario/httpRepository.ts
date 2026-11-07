import type { ActualizarUsuarioInput, CrearUsuarioInput, Permission, Role, UsuarioAdmin } from '@/types/auth'
import { apiErrorMessage, apiFetch, apiJson } from '@/lib/api'
import type { UsuarioRepository } from './contracts'

const BASE = '/api/usuarios'

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
  obtenerUsuarios(): Promise<UsuarioAdmin[]> {
    return solicitarJson('')
  }

  crearUsuario(input: CrearUsuarioInput): Promise<UsuarioAdmin> {
    return solicitarJson('', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  actualizarUsuario(input: ActualizarUsuarioInput): Promise<UsuarioAdmin> {
    return solicitarJson(`/${input.id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    })
  }

  eliminarUsuario(id: string): Promise<void> {
    return solicitarVoid(`/${id}`, { method: 'DELETE' })
  }

  asignarRol(usuarioId: string, rol: Role): Promise<UsuarioAdmin> {
    return solicitarJson(`/${usuarioId}/roles`, {
      method: 'PATCH',
      body: JSON.stringify({ rol }),
    })
  }

  actualizarPermisosRol(rol: Role, permisos: Permission[]): Promise<{ rol: Role; permisos: Permission[] }> {
    return solicitarJson(`/roles/${rol}/permisos`, {
      method: 'PATCH',
      body: JSON.stringify({ permisos }),
    })
  }
}