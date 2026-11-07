import type {
  ActualizarMedioInput,
  CrearMedioInput,
  MedioDeCuarto,
} from '@/types/inventario'
import { apiErrorMessage, apiFetch, apiJson } from '@/lib/api'
import { toCamelObject } from '@/lib/case'
import type { InventarioRepository } from './contracts'

const BASE = '/api/v1/medios'

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

function tipoMedioFront(nombre: string | undefined): MedioDeCuarto['tipo'] {
  const validos: MedioDeCuarto['tipo'][] = [
    'taquilla',
    'cama',
    'colchon',
    'almohada',
    'lampara',
    'mesilla',
    'ropero',
    'ventilador',
    'silla',
    'escritorio',
    'otro',
  ]
  if (nombre && validos.includes(nombre as MedioDeCuarto['tipo'])) {
    return nombre as MedioDeCuarto['tipo']
  }
  return 'otro'
}

function aMedioDeCuarto(back: unknown): MedioDeCuarto {
  const c = toCamelObject(back as Record<string, unknown>)
  const tipoMedio: { nombre?: string } | undefined = c.tipoMedio
  return {
    id: Number(c.id),
    cuartoId: Number(c.cuarto?.id ?? c.cuartoId ?? 0),
    tipo: tipoMedioFront(tipoMedio?.nombre),
    cantidad: 1,
    estado: c.usable === false ? 'danado' : 'bueno',
    observaciones: undefined,
  } as MedioDeCuarto
}

export class HttpInventarioRepository implements InventarioRepository {
  async obtenerMediosCuarto(cuartoId: number): Promise<MedioDeCuarto[]> {
    const datos = await solicitarJson<unknown[]>(`?cuarto_id=${cuartoId}`)
    return datos.map((d) => aMedioDeCuarto(d))
  }

  async crearMedio(_input: CrearMedioInput): Promise<MedioDeCuarto> {
    throw new Error(
      'Pendiente de backend: POST /api/v1/medios requiere tipo_medio_id (int) y nombre; el front envía tipo (string) y cantidad, que el backend aún no expone.',
    )
  }

  async actualizarMedio(
    _id: number,
    _input: ActualizarMedioInput,
  ): Promise<MedioDeCuarto> {
    throw new Error(
      'Pendiente de backend: PATCH /api/v1/medios/{id} no expone campos cantidad/estado del front.',
    )
  }

  async eliminarMedio(_id: number): Promise<void> {
    throw new Error('Pendiente de backend: DELETE /api/v1/medios/{id}')
  }
}
