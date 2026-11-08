import type {
  ActualizarCuartoInput,
  ActualizarEdificioInput,
  ActualizarEscaleraInput,
  CrearCuartoInput,
  CrearEdificioInput,
  CrearEscaleraInput,
  CuartoResumen,
  DistribucionEstado,
  EdificioDetalle,
  EdificioResumen,
  EscaleraResumen,
  EstadoConstructivo,
  InfraestructuraResumen,
} from '@/types/infraestructura'
import { serializarCsv, type CsvCell } from '@/lib/csv'
import { calcularEstadoEdificio } from '@/lib/estadoConstructivoEdificio'
import { apiErrorMessage, apiFetch, apiJson } from '@/lib/api'
import { toCamelObject } from '@/lib/case'
import type { InfraestructuraRepository } from './contracts'

const API = '/api/v1'
const TAMANO_PAGINA = 200

class ErrorHttp extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function solicitarApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(`${API}${path}`, init)

  if (!response.ok) {
    throw new ErrorHttp(response.status, await apiErrorMessage(response))
  }

  return apiJson<T>(response)
}

async function solicitarApiVoid(path: string, init?: RequestInit): Promise<void> {
  const response = await apiFetch(`${API}${path}`, init)

  if (!response.ok) {
    throw new ErrorHttp(response.status, await apiErrorMessage(response))
  }
}

async function solicitarApiLista<T>(path: string): Promise<T[]> {
  const resultado: T[] = []

  for (let offset = 0; ; offset += TAMANO_PAGINA) {
    const separador = path.includes('?') ? '&' : '?'
    const pagina = await solicitarApi<T[]>(
      `${path}${separador}limit=${TAMANO_PAGINA}&offset=${offset}`,
    )
    resultado.push(...pagina)

    if (pagina.length < TAMANO_PAGINA) break
  }

  return resultado
}

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
  capacidadMaxima?: number
  activo?: boolean
  escalera?: { id: number; nombre?: string }
  edificio?: { id: number; nombre?: string }
  estadoConstructivo?: { id: number; nombre: string; habitable: boolean }
}

interface EscaleraBack {
  id: number
  nombre: string
  edificio?: EdificioBack
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

const estadoSinClasificar: EstadoConstructivo = {
  id: 0,
  nombre: 'Sin clasificar',
  habitable: true,
}

function aEstadoConstructivo(back: unknown): EstadoConstructivo {
  const c = toCamelObject(back as Record<string, unknown>) as unknown as EstadoConstructivoBack
  return {
    id: c.id,
    nombre: c.nombre,
    habitable: c.habitable,
  }
}

function aCuartoResumen(back: unknown, estados: EstadoConstructivo[] = []): CuartoResumen {
  const c = toCamelObject(back as Record<string, unknown>) as unknown as CuartoBack
  const estado = c.estadoConstructivo
    ? {
        id: c.estadoConstructivo.id,
        nombre: c.estadoConstructivo.nombre,
        habitable: c.estadoConstructivo.habitable,
      }
    : (estados[0] ?? estadoSinClasificar)

  return {
    id: c.id,
    nombre: c.nombre,
    capacidadMaxima: c.capacidadMaxima ?? 0,
    escaleraId: c.escalera?.id ?? 0,
    estado,
    ocupados: 0,
    ocupacionPct: 0,
    tieneAlojamientos: false,
  }
}

function aEdificioResumen(
  arbol: EdificioArbol,
  estados: EstadoConstructivo[],
  cuartos: CuartoResumen[],
): EdificioResumen {
  const estado = calcularEstadoEdificio(cuartos, estados, 100, 75)
  const capacidad = cuartos.reduce((total, cuarto) => total + cuarto.capacidadMaxima, 0)

  return {
    id: arbol.id,
    nombre: arbol.nombre,
    estado,
    estadoSugerido: estado,
    estadoManual: false,
    observacionEstado: undefined,
    escaleras: arbol.escaleras.length,
    cuartos: cuartos.length,
    capacidad,
    ocupados: 0,
    ocupacionPct: 0,
  }
}

function aEdificioDetalle(
  arbol: EdificioArbol,
  estados: EstadoConstructivo[],
  cuartos: CuartoResumen[],
): EdificioDetalle {
  const base = aEdificioResumen(arbol, estados, cuartos)
  const escalerasDetalle: EscaleraResumen[] = arbol.escaleras.map((escalera) => {
    const propios = cuartos.filter((cuarto) => cuarto.escaleraId === escalera.id)
    const capacidad = propios.reduce((total, cuarto) => total + cuarto.capacidadMaxima, 0)
    return {
      id: escalera.id,
      nombre: escalera.nombre,
      cuartos: propios.length,
      capacidad,
      ocupados: 0,
      ocupacionPct: 0,
    }
  })

  return {
    ...base,
    escalerasDetalle,
    cuartosDetalle: cuartos,
  }
}

async function cargarInfraestructura(): Promise<{
  arbol: EdificioArbol[]
  estados: EstadoConstructivo[]
  edificios: EdificioResumen[]
  cuartos: CuartoResumen[]
}> {
  const [arbol, estadosBack, cuartosBack] = await Promise.all([
    solicitarApi<EdificioArbol[]>('/estructura/arbol'),
    solicitarApi<EstadoConstructivoBack[]>('/estados-constructivos'),
    solicitarApiLista<Record<string, unknown>>('/cuartos?activo=true'),
  ])

  const estados = estadosBack.map((estado) => aEstadoConstructivo(estado))
  const cuartos = cuartosBack.map((cuarto) => aCuartoResumen(cuarto, estados))
  const cuartosPorEdificio = new Map<number, CuartoResumen[]>()

  for (const back of cuartosBack) {
    const c = toCamelObject(back as Record<string, unknown>) as unknown as CuartoBack
    const edificioId = Number(c.edificio?.id ?? 0)
    const cuarto = aCuartoResumen(back, estados)
    const actuales = cuartosPorEdificio.get(edificioId) ?? []
    actuales.push(cuarto)
    cuartosPorEdificio.set(edificioId, actuales)
  }

  const edificios = arbol.map((edificio) =>
    aEdificioResumen(edificio, estados, cuartosPorEdificio.get(edificio.id) ?? []),
  )

  return { arbol, estados, edificios, cuartos }
}

function aEdificioResumenCreado(back: unknown): EdificioResumen {
  const c = toCamelObject(back as Record<string, unknown>) as unknown as EdificioBack
  return {
    id: c.id,
    nombre: c.nombre,
    estado: estadoSinClasificar,
    estadoSugerido: estadoSinClasificar,
    estadoManual: false,
    observacionEstado: undefined,
    escaleras: 0,
    cuartos: 0,
    capacidad: 0,
    ocupados: 0,
    ocupacionPct: 0,
  }
}

function aEscaleraResumen(back: unknown): EscaleraResumen {
  const c = toCamelObject(back as Record<string, unknown>) as unknown as EscaleraBack
  return {
    id: c.id,
    nombre: c.nombre,
    cuartos: 0,
    capacidad: 0,
    ocupados: 0,
    ocupacionPct: 0,
  }
}

export class HttpInfraestructuraRepository implements InfraestructuraRepository {
  async obtenerEstadosConstructivos(): Promise<EstadoConstructivo[]> {
    const datos = await solicitarApi<EstadoConstructivoBack[]>('/estados-constructivos')
    return datos.map((dato) => aEstadoConstructivo(dato))
  }

  async obtenerResumen(): Promise<InfraestructuraResumen> {
    const { estados, edificios, cuartos } = await cargarInfraestructura()
    const capacidadTotal = cuartos.reduce((total, cuarto) => total + cuarto.capacidadMaxima, 0)
    const distribucion = new Map<number, DistribucionEstado>()

    for (const cuarto of cuartos) {
      const actual = distribucion.get(cuarto.estado.id)
      if (actual) {
        actual.cuartos++
      } else {
        distribucion.set(cuarto.estado.id, { estado: cuarto.estado, cuartos: 1 })
      }
    }

    const estadosConCuartos = estados
      .map((estado) => ({
        estado,
        cuartos: distribucion.get(estado.id)?.cuartos ?? 0,
      }))
      .filter((item) => item.cuartos > 0)

    return {
      totalEdificios: edificios.length,
      totalEscaleras: edificios.reduce((total, edificio) => total + edificio.escaleras, 0),
      totalCuartos: cuartos.length,
      capacidadTotal,
      ocupados: 0,
      ocupacionPct: 0,
      estados: estadosConCuartos,
      edificios,
      eventos: [],
    }
  }

  async obtenerEdificios(): Promise<EdificioResumen[]> {
    const { edificios } = await cargarInfraestructura()
    return edificios
  }

  async obtenerEdificio(id: number): Promise<EdificioDetalle> {
    const [arbol, estadosBack, cuartosBack] = await Promise.all([
      solicitarApi<EdificioArbol[]>('/estructura/arbol'),
      solicitarApi<EstadoConstructivoBack[]>('/estados-constructivos'),
      solicitarApiLista<Record<string, unknown>>(`/cuartos?edificio_id=${id}&activo=true`),
    ])

    const encontrado = arbol.find((edificio) => edificio.id === id)
    if (!encontrado) {
      throw new Error(`El edificio ${id} no existe.`)
    }

    const estados = estadosBack.map((estado) => aEstadoConstructivo(estado))
    const cuartos = cuartosBack.map((cuarto) => aCuartoResumen(cuarto, estados))
    return aEdificioDetalle(encontrado, estados, cuartos)
  }

  async crearEdificio(input: CrearEdificioInput): Promise<EdificioResumen> {
    const creado = await solicitarApi<Record<string, unknown>>('/edificios', {
      method: 'POST',
      body: JSON.stringify({ nombre: input.nombre }),
    })
    return aEdificioResumenCreado(creado)
  }

  async actualizarEdificio(
    id: number,
    input: ActualizarEdificioInput,
  ): Promise<EdificioResumen> {
    const cambios: Record<string, unknown> = {}
    if (input.nombre != null) cambios.nombre = input.nombre
    const actualizado = await solicitarApi<Record<string, unknown>>(`/edificios/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(cambios),
    })
    return aEdificioResumenCreado(actualizado)
  }

  async eliminarEdificio(id: number): Promise<void> {
    return solicitarApiVoid(`/edificios/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ activo: false }),
    })
  }

  async crearEscalera(
    edificioId: number,
    input: CrearEscaleraInput,
  ): Promise<EscaleraResumen> {
    const creado = await solicitarApi<Record<string, unknown>>('/escaleras', {
      method: 'POST',
      body: JSON.stringify({ nombre: input.nombre, edificio_id: edificioId }),
    })
    return aEscaleraResumen(creado)
  }

  async actualizarEscalera(
    id: number,
    input: ActualizarEscaleraInput,
  ): Promise<EscaleraResumen> {
    const cambios: Record<string, unknown> = {}
    if (input.nombre != null) cambios.nombre = input.nombre
    const actualizado = await solicitarApi<Record<string, unknown>>(`/escaleras/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(cambios),
    })
    return aEscaleraResumen(actualizado)
  }

  async eliminarEscalera(id: number): Promise<void> {
    return solicitarApiVoid(`/escaleras/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ activo: false }),
    })
  }

  async crearCuarto(
    escaleraId: number,
    input: CrearCuartoInput,
  ): Promise<CuartoResumen> {
    const creado = await solicitarApi<Record<string, unknown>>('/cuartos', {
      method: 'POST',
      body: JSON.stringify({
        nombre: input.nombre,
        capacidad_maxima: input.capacidadMaxima,
        escalera_id: escaleraId,
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
    const actualizado = await solicitarApi<Record<string, unknown>>(`/cuartos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(cambios),
    })
    return aCuartoResumen(actualizado)
  }

  async eliminarCuarto(id: number): Promise<void> {
    return solicitarApiVoid(`/cuartos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ activo: false }),
    })
  }

  async exportarReporteGeneral(): Promise<string> {
    const resumen = await this.obtenerResumen()
    const filas: CsvCell[][] = [
      ['Edificio', 'Escaleras', 'Cuartos', 'Capacidad', 'Ocupados', 'Ocupación (%)'],
      ...resumen.edificios.map((edificio) => [
        edificio.nombre,
        edificio.escaleras,
        edificio.cuartos,
        edificio.capacidad,
        edificio.ocupados,
        edificio.ocupacionPct,
      ]),
      [
        'Total',
        resumen.totalEscaleras,
        resumen.totalCuartos,
        resumen.capacidadTotal,
        resumen.ocupados,
        resumen.ocupacionPct,
      ],
    ]

    return serializarCsv(filas)
  }

  async exportarCenso(edificioId: number): Promise<string> {
    const edificio = await this.obtenerEdificio(edificioId)
    const filas: CsvCell[][] = [
      ['Edificio', 'Escalera', 'Cuarto', 'Capacidad', 'Ocupados', 'Estado'],
    ]

    for (const cuarto of edificio.cuartosDetalle) {
      const escalera = edificio.escalerasDetalle.find(
        (item) => item.id === cuarto.escaleraId,
      )
      filas.push([
        edificio.nombre,
        escalera?.nombre ?? 'Sin escalera',
        cuarto.nombre,
        cuarto.capacidadMaxima,
        cuarto.ocupados,
        cuarto.estado.nombre,
      ])
    }

    return serializarCsv(filas)
  }
}
