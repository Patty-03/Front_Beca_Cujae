import type {
  ActualizarCuartoInput,
  ActualizarEdificioInput,
  ActualizarEscaleraInput,
  CrearCuartoInput,
  CrearEdificioInput,
  CrearEscaleraInput,
  CuartoResumen,
  EdificioDetalle,
  EdificioResumen,
  EscaleraResumen,
  EstadoConstructivo,
  InfraestructuraResumen,
} from '@/types/infraestructura'
import { apiErrorMessage, apiFetch, apiJson } from '@/lib/api'
import { toCamelObject } from '@/lib/case'
import type { InfraestructuraRepository } from './contracts'

const BASE = '/api/v1'

interface EstadoConstructivoBack {
  id: number
  nombre: string
  habitable: boolean
}

interface EdificioBack {
  id: number
  nombre: string
}

interface CuartoBack {
  id: number
  nombre: string
  nombreCompleto?: string
  capacidadMaxima?: number
  escalera?: { id: number }
  estadoConstructivo?: { id: number; nombre: string; habitable: boolean }
}

interface EscaleraBack {
  id: number
  nombre: string
}

interface EdificioArbol {
  id: number
  nombre: string
  activo: boolean
  capacidad_habitable: number
  escaleras: Array<{
    id: number
    nombre: string
    activo: boolean
    capacidad_habitable: number
    cuartos: Array<{
      id: number
      nombre: string
      capacidad_maxima: number
      habitable: boolean
      activo: boolean
    }>
  }>
}

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

function aEstadoConstructivo(back: unknown): EstadoConstructivo {
  const c = toCamelObject(back as Record<string, unknown>) as unknown as EstadoConstructivoBack
  return {
    id: c.id,
    nombre: c.nombre,
    habitable: c.habitable,
  }
}

function aEdificioResumen(back: unknown): EdificioResumen {
  const c = toCamelObject(back as Record<string, unknown>) as unknown as EdificioBack
  const estado: EstadoConstructivo = {
    id: 1,
    nombre: 'Sin clasificar',
    habitable: true,
  }
  return {
    id: c.id,
    nombre: c.nombre,
    estado,
    estadoSugerido: estado,
    estadoManual: false,
    observacionEstado: undefined,
    escaleras: 0,
    cuartos: 0,
    capacidad: 0,
    ocupados: 0,
    ocupacionPct: 0,
  }
}

function aEdificioDetalle(arbol: EdificioArbol): EdificioDetalle {
  const base = aEdificioResumen(arbol)
  const escalerasDetalle: EscaleraResumen[] = arbol.escaleras.map((e) => ({
    id: e.id,
    nombre: e.nombre,
    cuartos: e.cuartos.length,
    capacidad: e.capacidad_habitable,
    ocupados: 0,
    ocupacionPct: 0,
  }))
  const cuartosDetalle: CuartoResumen[] = arbol.escaleras.flatMap((e) =>
    e.cuartos.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      capacidadMaxima: c.capacidad_maxima,
      escaleraId: e.id,
      estado: {
        id: 1,
        nombre: c.habitable ? 'habitable' : 'no habitable',
        habitable: c.habitable,
      },
      ocupados: 0,
      ocupacionPct: 0,
      tieneAlojamientos: false,
    })),
  )
  return {
    ...base,
    escalerasDetalle,
    cuartosDetalle,
  }
}

function aCuartoResumen(back: unknown): CuartoResumen {
  const c = toCamelObject(back as Record<string, unknown>) as unknown as CuartoBack
  return {
    id: c.id,
    nombre: c.nombre,
    capacidadMaxima: c.capacidadMaxima ?? 0,
    escaleraId: c.escalera?.id ?? 0,
    estado: {
      id: c.estadoConstructivo?.id ?? 1,
      nombre: c.estadoConstructivo?.nombre ?? 'habitable',
      habitable: c.estadoConstructivo?.habitable ?? true,
    },
    ocupados: 0,
    ocupacionPct: 0,
    tieneAlojamientos: false,
  }
}

export class HttpInfraestructuraRepository implements InfraestructuraRepository {
  async obtenerEstadosConstructivos(): Promise<EstadoConstructivo[]> {
    const datos = await solicitarJson<Record<string, unknown>[]>(
      '/estados-constructivos',
    )
    return datos.map((d) => aEstadoConstructivo(d))
  }

  async obtenerResumen(): Promise<InfraestructuraResumen> {
    throw new Error('Pendiente de backend: GET /api/v1/infraestructura/resumen')
  }

  async obtenerEdificios(): Promise<EdificioResumen[]> {
    const datos = await solicitarJson<Record<string, unknown>[]>('/edificios')
    return datos.map((d) => aEdificioResumen(d))
  }

  async obtenerEdificio(id: number): Promise<EdificioDetalle> {
    const arbol = await solicitarJson<EdificioArbol[]>('/estructura/arbol')
    const encontrado = arbol.find((e) => e.id === id)
    if (!encontrado) {
      throw new Error(`El edificio ${id} no existe.`)
    }
    return aEdificioDetalle(encontrado)
  }

  async crearEdificio(input: CrearEdificioInput): Promise<EdificioResumen> {
    const creado = await solicitarJson<Record<string, unknown>>('/edificios', {
      method: 'POST',
      body: JSON.stringify({ nombre: input.nombre }),
    })
    return aEdificioResumen(creado)
  }

  async actualizarEdificio(
    id: number,
    input: ActualizarEdificioInput,
  ): Promise<EdificioResumen> {
    const cambios: Record<string, unknown> = {}
    if (input.nombre != null) cambios.nombre = input.nombre
    const actualizado = await solicitarJson<Record<string, unknown>>(
      `/edificios/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(cambios),
      },
    )
    return aEdificioResumen(actualizado)
  }

  async eliminarEdificio(id: number): Promise<void> {
    return solicitarVoid(`/edificios/${id}`, { method: 'DELETE' })
  }

  async crearEscalera(
    _edificioId: number,
    input: CrearEscaleraInput,
  ): Promise<EscaleraResumen> {
    const creado = await solicitarJson<Record<string, unknown>>('/escaleras', {
      method: 'POST',
      body: JSON.stringify({ nombre: input.nombre, edificio_id: _edificioId }),
    })
    const c = toCamelObject(creado) as unknown as EscaleraBack
    return {
      id: c.id,
      nombre: c.nombre,
      cuartos: 0,
      capacidad: 0,
      ocupados: 0,
      ocupacionPct: 0,
    }
  }

  async actualizarEscalera(
    id: number,
    input: ActualizarEscaleraInput,
  ): Promise<EscaleraResumen> {
    const cambios: Record<string, unknown> = {}
    if (input.nombre != null) cambios.nombre = input.nombre
    const actualizado = await solicitarJson<Record<string, unknown>>(
      `/escaleras/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(cambios),
      },
    )
    const c = toCamelObject(actualizado) as unknown as EscaleraBack
    return {
      id: c.id,
      nombre: c.nombre,
      cuartos: 0,
      capacidad: 0,
      ocupados: 0,
      ocupacionPct: 0,
    }
  }

  async eliminarEscalera(id: number): Promise<void> {
    return solicitarVoid(`/escaleras/${id}`, { method: 'DELETE' })
  }

  async crearCuarto(
    _escaleraId: number,
    input: CrearCuartoInput,
  ): Promise<CuartoResumen> {
    const creado = await solicitarJson<Record<string, unknown>>('/cuartos', {
      method: 'POST',
      body: JSON.stringify({
        nombre: input.nombre,
        capacidad_maxima: input.capacidadMaxima,
        escalera_id: _escaleraId,
        estado_constructivo_id: input.estadoConstructivoId,
      }),
    })
    return aCuartoResumen(creado)
  }

  async actualizarCuarto(
    id: number,
    input: ActualizarCuartoInput,
  ): Promise<CuartoResumen> {
    const cambios: Record<string, unknown> = {}
    if (input.nombre != null) cambios.nombre = input.nombre
    if (input.capacidadMaxima != null) cambios.capacidad_maxima = input.capacidadMaxima
    if (input.estadoConstructivoId != null)
      cambios.estado_constructivo_id = input.estadoConstructivoId
    const actualizado = await solicitarJson<Record<string, unknown>>(
      `/cuartos/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(cambios),
      },
    )
    return aCuartoResumen(actualizado)
  }

  async eliminarCuarto(id: number): Promise<void> {
    return solicitarVoid(`/cuartos/${id}`, { method: 'DELETE' })
  }

  async exportarReporteGeneral(): Promise<string> {
    throw new Error('Pendiente de backend: GET /api/v1/infraestructura/exportes/reporte')
  }

  async exportarCenso(_edificioId: number): Promise<string> {
    throw new Error('Pendiente de backend: GET /api/v1/infraestructura/exportes/censo/{id}')
  }
}
