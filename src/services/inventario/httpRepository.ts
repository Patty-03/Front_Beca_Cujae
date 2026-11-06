import type {
  ActualizarMedioInput,
  CrearMedioInput,
  MedioDeCuarto,
} from '@/types/inventario'
import { apiErrorMessage, apiFetch, apiJson } from '@/lib/api'
import type { InventarioRepository } from './contracts'

const BASE = '/api/inventario'

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

export class HttpInventarioRepository implements InventarioRepository {
  obtenerMediosCuarto(cuartoId: number): Promise<MedioDeCuarto[]> {
    return solicitarJson(`/cuartos/${cuartoId}/medios`)
  }

  crearMedio(input: CrearMedioInput): Promise<MedioDeCuarto> {
    return solicitarJson(`/cuartos/${input.cuartoId}/medios`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  actualizarMedio(id: number, input: ActualizarMedioInput): Promise<MedioDeCuarto> {
    return solicitarJson(`/medios/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    })
  }

  eliminarMedio(id: number): Promise<void> {
    return solicitarVoid(`/medios/${id}`, { method: 'DELETE' })
  }
}
