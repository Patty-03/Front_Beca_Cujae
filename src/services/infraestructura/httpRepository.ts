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
import { apiErrorMessage, apiFetch, apiJson, apiText } from '@/lib/api'
import { toCamelObject } from '@/lib/case'
import type { InfraestructuraRepository } from './contracts'

const BASE = '/api/v1'

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

async function solicitarCsv(path: string): Promise<string> {
  const response = await apiFetch(`${BASE}${path}`, {
    headers: { Accept: 'text/csv' },
  })

  if (!response.ok) {
    throw new Error(await apiErrorMessage(response))
  }

  return apiText(response)
}

function aEstadoConstructivo(back: unknown): EstadoConstructivo {
  const c = toCamelObject(back as Record<string, unknown>)
  return {
    id: Number(c.id),
    nombre: String(c.nombre ?? ''),
    habitable: Boolean(c.habitable),
  } as EstadoConstructivo
}

function aEdificioResumen(back: unknown): EdificioResumen {
  const c = toCamelObject(back as Record<string, unknown>)
  const estado: EstadoConstructivo = {
    id: 1,
    nombre: 'Sin clasificar',
    habitable: true,
  }
  return {
    id: Number(c.id),
    nombre: String(c.nombre ?? ''),
    estado,
    estadoSugerido: estado,
    estadoManual: false,
    observacionEstado: undefined,
    escaleras: 0,
    cuartos: 0,
    capacidad: 0,
    ocupados: 0,
    ocupacionPct: 0,
  } as EdificioResumen
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
      estado: { id: 1, nombre: c.habitable ? 'habitable' : 'no habitable', habitable: c.habitable },
      ocupados: 0,
      ocupacionPct: 0,
      tieneAlojamientos: false,
    })),
  )
  return {
    ...base,
    escalerasDetalle,
    cuartosDetalle,
  } as EdificioDetalle
}

export class HttpInfraestructuraRepository implements InfraestructuraRepository {
  async obtenerEstadosConstructivos(): Promise<EstadoConstructivo[]> {
    const datos = await solicitarJson<unknown[]>('/estados-constructivos')
    return datos.map((d) => aEstadoConstructivo(d))
  }

  async obtenerResumen(): Promise<InfraestructuraResumen> {
    throw new Error('Pendiente de backend: GET /api/v1/infraestructura/resumen')
  }

  async obtenerEdificios(): Promise<EdificioResumen[]> {
    const datos = await solicitarJson<unknown[]>('/edificios')
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
    const creado = await solicitarJson<unknown>('/edificios', {
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
    if (input.activo !== undefined) cambios.activo = input.activo
    const actualizado = await solicitarJson<unknown>(`/edificios/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(cambios),
    })
    return aEdificioResumen(actualizado)
  }

  async eliminarEdificio(id: number): Promise<void> {
    return solicitarVoid(`/edificios/${id}`, { method: 'DELETE' })
  }

  async crearEscalera(
    _edificioId: number,
    input: CrearEscaleraInput,
  ): Promise<EscaleraResumen> {
    const creado = await solicitarJson<unknown>('/escaleras', {
      method: 'POST',
      body: JSON.stringify({ nombre: input.nombre, edificio_id: _edificioId }),
    })
    const c = toCamelObject(creado as Record<string, unknown>)
    return {
      id: Number(c.id),
      nombre: String(c.nombre ?? ''),
    } as EscaleraResumen
  }

  async actualizarEscalera(
    id: number,
    input: ActualizarEscaleraInput,
  ): Promise<EscaleraResumen> {
    const cambios: Record<string, unknown> = {}
    if (input.nombre != null) cambios.nombre = input.nombre
    if (input.activo !== undefined) cambios.activo = input.activo
    const actualizado = await solicitarJson<unknown>(`/escaleras/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(cambios),
    })
    const c = toCamelObject(actualizado as Record<string, unknown>)
    return {
      id: Number(c.id),
      nombre: String(c.nombre ?? ''),
    } as EscaleraResumen
  }

  async eliminarEscalera(id: number): Promise<void> {
    return solicitarVoid(`/escaleras/${id}`, { method: 'DELETE' })
  }

  async crearCuarto(
    _escaleraId: number,
    input: CrearCuartoInput,
  ): Promise<CuartoResumen> {
    const creado = await solicitarJson<unknown>('/cuartos', {
      method: 'POST',
      body: JSON.stringify({
        nombre: input.nombre,
        capacidad_maxima: input.capacidadMaxima,
        escalera_id: _escaleraId,
        estado_constructivo_id: input.estadoConstructivoId,
      }),
    })
    const c = toCamelObject(creado as Record<string, unknown>)
    return {
      id: Number(c.id),
      nombre: String(c.nombre ?? ''),
      nombreCompleto: String(c.nombreCompleto ?? c.nombre ?? ''),
    } as CuartoResumen
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
    if (input.activo !== undefined) cambios.activo = input.activo
    const actualizado = await solicitarJson<unknown>(`/cuartos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(cambios),
    })
    const c = toCamelObject(actualizado as Record<string, unknown>)
    return {
      id: Number(c.id),
      nombre: String(c.nombre ?? ''),
      nombreCompleto: String(c.nombreCompleto ?? c.nombre ?? ''),
    } as CuartoResumen
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
