import type {
  CrearSolicitudMedioInput,
  EstadoSolicitudMedio,
  ResolverSolicitudMedioInput,
  SolicitudMedio,
  TipoMedioSolicitud,
} from '@/types/solicitud-medio'
import { apiErrorMessage, apiFetch, apiJson } from '@/lib/api'
import { toCamelObject } from '@/lib/case'
import type { SolicitudesMediosRepository } from './contracts'

const API = '/api/v1'
const BASE = `${API}/solicitudes-medios`
const TAMANO_PAGINA = 200

class ErrorHttp extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function solicitarJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(`${BASE}${path}`, init)

  if (!response.ok) {
    throw new ErrorHttp(response.status, await apiErrorMessage(response))
  }

  return apiJson<T>(response)
}

async function solicitarLista<T>(path: string): Promise<T[]> {
  const resultado: T[] = []

  for (let offset = 0; ; offset += TAMANO_PAGINA) {
    const separador = path.includes('?') ? '&' : '?'
    const response = await apiFetch(
      `${BASE}${path}${separador}limit=${TAMANO_PAGINA}&offset=${offset}`,
    )

    if (!response.ok) {
      throw new ErrorHttp(response.status, await apiErrorMessage(response))
    }

    const pagina = await apiJson<T[]>(response)
    resultado.push(...pagina)

    if (pagina.length < TAMANO_PAGINA) break
  }

  return resultado
}

interface SolicitudMedioBack {
  id: number
  estudianteId: number
  estudianteNombre: string
  tipoMedioId: number
  tipoMedioNombre: string
  cantidad: number
  motivo: string
  estado: EstadoSolicitudMedio
  fechaSolicitud: string
  fechaResolucion: string | null
  resueltoPor: number | null
  observacionesResolucion: string | null
}

interface TipoMedioBack {
  id: number
  codigo: string
  nombre: string
  activo: boolean
}

function aSolicitud(back: unknown): SolicitudMedio {
  const c = toCamelObject(back as Record<string, unknown>) as unknown as SolicitudMedioBack

  return {
    id: Number(c.id),
    estudianteId: Number(c.estudianteId),
    estudianteNombre: c.estudianteNombre,
    tipoMedioId: Number(c.tipoMedioId),
    tipoMedioNombre: c.tipoMedioNombre,
    cantidad: Number(c.cantidad),
    motivo: c.motivo,
    estado: c.estado,
    fechaSolicitud: c.fechaSolicitud,
    fechaResolucion: c.fechaResolucion,
    resueltoPor: c.resueltoPor === null ? null : Number(c.resueltoPor),
    observacionesResolucion: c.observacionesResolucion,
  }
}

function aTipoMedio(back: unknown): TipoMedioSolicitud {
  const c = toCamelObject(back as Record<string, unknown>) as unknown as TipoMedioBack

  return {
    id: Number(c.id),
    codigo: c.codigo,
    nombre: c.nombre,
    activo: c.activo !== false,
  }
}

async function resolver(
  id: number,
  accion: 'aprobar' | 'rechazar',
  estado: EstadoSolicitudMedio,
  input?: ResolverSolicitudMedioInput,
): Promise<SolicitudMedio> {
  const creada = await solicitarJson<Record<string, unknown>>(`/${id}/${accion}`, {
    method: 'POST',
    body: JSON.stringify({
      estado,
      observaciones_resolucion: input?.observacionesResolucion ?? null,
    }),
  })

  return aSolicitud(creada)
}

export class HttpSolicitudesMediosRepository implements SolicitudesMediosRepository {
  async obtenerTiposMedio(): Promise<TipoMedioSolicitud[]> {
    const response = await apiFetch(
      `${BASE}/tipos?limit=${TAMANO_PAGINA}&offset=0`,
    )

    if (!response.ok) {
      throw new ErrorHttp(response.status, await apiErrorMessage(response))
    }

    const datos = await apiJson<Record<string, unknown>[]>(response)
    return datos.map((dato) => aTipoMedio(dato))
  }

  async crearSolicitud(input: CrearSolicitudMedioInput): Promise<SolicitudMedio> {
    const creada = await solicitarJson<Record<string, unknown>>('', {
      method: 'POST',
      body: JSON.stringify({
        tipo_medio_id: input.tipoMedioId,
        cantidad: input.cantidad,
        motivo: input.motivo,
      }),
    })

    return aSolicitud(creada)
  }

  async obtenerMisSolicitudes(): Promise<SolicitudMedio[]> {
    const datos = await solicitarLista<Record<string, unknown>>('/mis-solicitudes')
    return datos.map((dato) => aSolicitud(dato))
  }

  async obtenerSolicitudes(): Promise<SolicitudMedio[]> {
    const datos = await solicitarLista<Record<string, unknown>>('')
    return datos.map((dato) => aSolicitud(dato))
  }

  async obtenerSolicitud(id: number): Promise<SolicitudMedio> {
    const dato = await solicitarJson<Record<string, unknown>>(`/${id}`)
    return aSolicitud(dato)
  }

  async aprobarSolicitud(
    id: number,
    input?: ResolverSolicitudMedioInput,
  ): Promise<SolicitudMedio> {
    return resolver(id, 'aprobar', 'aprobada', input)
  }

  async rechazarSolicitud(
    id: number,
    input?: ResolverSolicitudMedioInput,
  ): Promise<SolicitudMedio> {
    return resolver(id, 'rechazar', 'rechazada', input)
  }
}
