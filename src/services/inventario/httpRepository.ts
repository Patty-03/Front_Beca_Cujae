import type {
  ActualizarMedioInput,
  CrearMedioInput,
  EstadoMedio,
  MedioDeCuarto,
  TipoMedio,
} from '@/types/inventario'
import { ETIQUETAS_TIPO_MEDIO } from '@/lib/inventario'
import { normalizarParaComparar } from '@/lib/validation'
import { apiErrorMessage, apiFetch, apiJson } from '@/lib/api'
import { toCamelObject } from '@/lib/case'
import type { InventarioRepository } from './contracts'

const API = '/api/v1'
const BASE = `${API}/medios`
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

async function solicitarVoid(path: string, init?: RequestInit): Promise<void> {
  const response = await apiFetch(`${BASE}${path}`, init)

  if (!response.ok) {
    throw new ErrorHttp(response.status, await apiErrorMessage(response))
  }
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

interface TipoMedioBack {
  id: number
  nombre: string
  activo: boolean
}

interface MedioBack {
  id: number
  nombre: string
  usable: boolean
  activo: boolean
  cuarto?: { id: number }
  tipoMedio?: { nombre?: string }
}

let tiposCache: Promise<TipoMedioBack[]> | null = null

async function cargarTipos(): Promise<TipoMedioBack[]> {
  if (tiposCache) return tiposCache

  tiposCache = (async () => {
    const response = await apiFetch(
      `${API}/tipos-medio?activo=true&limit=${TAMANO_PAGINA}&offset=0`,
    )
    if (!response.ok) {
      throw new ErrorHttp(response.status, await apiErrorMessage(response))
    }
    return apiJson<TipoMedioBack[]>(response)
  })()

  try {
    return await tiposCache
  } catch (caught) {
    tiposCache = null
    throw caught
  }
}

function singular(nombre: string): string {
  const normalizado = normalizarParaComparar(nombre)
  if (normalizado.endsWith('es')) return normalizado.slice(0, -2)
  if (normalizado.endsWith('s')) return normalizado.slice(0, -1)
  return normalizado
}

function tipoMedioFront(nombre: string | undefined): TipoMedio {
  const validos = Object.keys(ETIQUETAS_TIPO_MEDIO) as TipoMedio[]
  const normalizado = singular(nombre ?? '')

  return (
    validos.find((tipo) => singular(ETIQUETAS_TIPO_MEDIO[tipo]) === normalizado) ?? 'otro'
  )
}

async function buscarTipo(tipo: TipoMedio): Promise<TipoMedioBack> {
  const tipos = await cargarTipos()
  const etiqueta = singular(ETIQUETAS_TIPO_MEDIO[tipo])
  const encontrado = tipos.find(
    (item) => singular(item.nombre) === etiqueta || singular(item.nombre) === singular(tipo),
  )

  if (!encontrado) {
    throw new Error(
      `El tipo de medio "${ETIQUETAS_TIPO_MEDIO[tipo]}" no existe en el catálogo del backend.`,
    )
  }

  return encontrado
}

function estadoDesdeMedio(nombre: string, usable: boolean): EstadoMedio {
  if (normalizarParaComparar(nombre).includes('reparacion')) return 'reparacion'
  return usable ? 'bueno' : 'daniado'
}

function observacionesDesdeNombre(nombre: string): string | undefined {
  const partes = nombre.split(' - ')
  if (partes.length < 2) return undefined

  const observaciones = partes
    .slice(1)
    .join(' - ')
    .replace(/\[reparaci[oó]n\]/gi, '')
    .trim()

  return observaciones || undefined
}

function construirNombre(
  tipo: TipoMedio,
  estado: EstadoMedio,
  observaciones: string | undefined,
): string {
  let nombre = ETIQUETAS_TIPO_MEDIO[tipo]
  if (observaciones) nombre += ` - ${observaciones}`
  if (estado === 'reparacion') nombre += ' [reparación]'
  return nombre.slice(0, 60)
}

function aMedioDeCuarto(back: unknown): MedioDeCuarto {
  const c = toCamelObject(back as Record<string, unknown>) as unknown as MedioBack
  const tipo = tipoMedioFront(c.tipoMedio?.nombre)

  return {
    id: c.id,
    cuartoId: Number(c.cuarto?.id ?? 0),
    tipo,
    cantidad: 1,
    estado: estadoDesdeMedio(c.nombre, c.usable !== false),
    observaciones: observacionesDesdeNombre(c.nombre),
  }
}

export class HttpInventarioRepository implements InventarioRepository {
  async obtenerMediosCuarto(cuartoId: number): Promise<MedioDeCuarto[]> {
    const datos = await solicitarLista<Record<string, unknown>>(
      `?cuarto_id=${cuartoId}&activo=true`,
    )
    return datos.map((dato) => aMedioDeCuarto(dato))
  }

  async crearMedio(input: CrearMedioInput): Promise<MedioDeCuarto> {
    const tipo = await buscarTipo(input.tipo)
    const cantidad = Math.max(1, Math.trunc(input.cantidad))
    const nombre = construirNombre(input.tipo, input.estado, input.observaciones)
    const usable = input.estado === 'bueno'
    let primero: MedioDeCuarto | null = null

    for (let indice = 0; indice < cantidad; indice++) {
      const creado = await solicitarJson<Record<string, unknown>>('', {
        method: 'POST',
        body: JSON.stringify({
          nombre,
          tipo_medio_id: tipo.id,
          cuarto_id: input.cuartoId,
          usable,
        }),
      })
      primero ??= aMedioDeCuarto(creado)
    }

    if (!primero) {
      throw new Error('No se pudo registrar el medio.')
    }

    return { ...primero, cantidad }
  }

  async actualizarMedio(
    id: number,
    input: ActualizarMedioInput,
  ): Promise<MedioDeCuarto> {
    const tipo = await buscarTipo(input.tipo)
    const cantidad = Math.max(1, Math.trunc(input.cantidad))
    const nombre = construirNombre(input.tipo, input.estado, input.observaciones)
    const usable = input.estado === 'bueno'

    const actualizado = await solicitarJson<Record<string, unknown>>(`/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        nombre,
        tipo_medio_id: tipo.id,
        usable,
        activo: true,
      }),
    })

    const medio = aMedioDeCuarto(actualizado)
    if (cantidad > 1) {
      await this.crearMedio({
        cuartoId: medio.cuartoId,
        tipo: input.tipo,
        cantidad: cantidad - 1,
        estado: input.estado,
        observaciones: input.observaciones,
      })
    }

    return { ...medio, cantidad }
  }

  async eliminarMedio(id: number): Promise<void> {
    return solicitarVoid(`/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ activo: false }),
    })
  }
}
