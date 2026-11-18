import type {
  AmbitoRegla,
  AtributoDisponible,
  CondicionInput,
  ConjuntoCrearInput,
  ConjuntoLeer,
  ConjuntoResumen,
  ConjuntoVersionInput,
  OperadorDisponible,
  PrioridadInput,
} from '@/types/reglas'
import { apiErrorMessage, apiFetch, apiJson } from '@/lib/api'
import { toCamelObject, toSnakeObject } from '@/lib/case'
import type { ReglasRepository } from './contracts'

const API = '/api/v1'

class ErrorHttp extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function aCamel<T>(value: unknown): T {
  return toCamelObject(value as Record<string, unknown>) as unknown as T
}

function aCuerpo(value: unknown): string {
  return JSON.stringify(toSnakeObject(value as Record<string, unknown>))
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

interface AtributoBack {
  id: number
  nombre: string
  tipoDato?: { id: number; nombre: string }
  almacenado?: boolean
  activo?: boolean
  valoresPermitidos?: Array<{ id: number; valor: string }>
}

interface OperadorBack {
  id: number
  simbolo: string
  nombre: string
  soloOrdenables: boolean
}

export class HttpReglasRepository implements ReglasRepository {
  async listarConjuntos(filtros?: {
    ambito?: AmbitoRegla
    vigente?: boolean
    nombre?: string
  }): Promise<ConjuntoResumen[]> {
    const params = new URLSearchParams()
    if (filtros?.ambito) params.set('ambito', filtros.ambito)
    if (filtros?.vigente != null) params.set('vigente', String(filtros.vigente))
    if (filtros?.nombre) params.set('nombre', filtros.nombre)
    const query = params.toString()

    const datos = await solicitarApi<unknown>(`/conjuntos-regla${query ? `?${query}` : ''}`)
    return aCamel<ConjuntoResumen[]>(datos)
  }

  async obtenerConjunto(id: number): Promise<ConjuntoLeer> {
    return aCamel<ConjuntoLeer>(await solicitarApi<unknown>(`/conjuntos-regla/${id}`))
  }

  async crearConjunto(input: ConjuntoCrearInput): Promise<ConjuntoLeer> {
    return aCamel<ConjuntoLeer>(
      await solicitarApi<unknown>('/conjuntos-regla', {
        method: 'POST',
        body: aCuerpo(input),
      }),
    )
  }

  async crearVersionConjunto(id: number, input: ConjuntoVersionInput): Promise<ConjuntoLeer> {
    return aCamel<ConjuntoLeer>(
      await solicitarApi<unknown>(`/conjuntos-regla/${id}/versiones`, {
        method: 'POST',
        body: aCuerpo(input),
      }),
    )
  }

  async eliminarConjunto(id: number): Promise<void> {
    return solicitarApiVoid(`/conjuntos-regla/${id}`, { method: 'DELETE' })
  }

  async agregarCondicion(conjuntoId: number, input: CondicionInput): Promise<ConjuntoLeer> {
    return aCamel<ConjuntoLeer>(
      await solicitarApi<unknown>(`/conjuntos-regla/${conjuntoId}/condiciones`, {
        method: 'POST',
        body: aCuerpo(input),
      }),
    )
  }

  async actualizarCondicion(
    conjuntoId: number,
    condicionId: number,
    input: Partial<CondicionInput>,
  ): Promise<ConjuntoLeer> {
    return aCamel<ConjuntoLeer>(
      await solicitarApi<unknown>(
        `/conjuntos-regla/${conjuntoId}/condiciones/${condicionId}`,
        {
          method: 'PATCH',
          body: aCuerpo(input),
        },
      ),
    )
  }

  async quitarCondicion(conjuntoId: number, condicionId: number): Promise<void> {
    return solicitarApiVoid(`/conjuntos-regla/${conjuntoId}/condiciones/${condicionId}`, {
      method: 'DELETE',
    })
  }

  async agregarPrioridad(conjuntoId: number, input: PrioridadInput): Promise<ConjuntoLeer> {
    return aCamel<ConjuntoLeer>(
      await solicitarApi<unknown>(`/conjuntos-regla/${conjuntoId}/prioridades`, {
        method: 'POST',
        body: aCuerpo(input),
      }),
    )
  }

  async actualizarPrioridad(
    conjuntoId: number,
    prioridadId: number,
    input: Partial<PrioridadInput>,
  ): Promise<ConjuntoLeer> {
    return aCamel<ConjuntoLeer>(
      await solicitarApi<unknown>(
        `/conjuntos-regla/${conjuntoId}/prioridades/${prioridadId}`,
        {
          method: 'PATCH',
          body: aCuerpo(input),
        },
      ),
    )
  }

  async quitarPrioridad(conjuntoId: number, prioridadId: number): Promise<void> {
    return solicitarApiVoid(`/conjuntos-regla/${conjuntoId}/prioridades/${prioridadId}`, {
      method: 'DELETE',
    })
  }

  async obtenerAtributosRegla(ambito: AmbitoRegla): Promise<AtributoDisponible[]> {
    const datos = await solicitarApi<unknown>(`/atributos?ambito=${ambito}`)
    const atributos = aCamel<AtributoBack[]>(datos)

    return atributos.map((atributo) => ({
      id: atributo.id,
      nombre: atributo.nombre,
      tipoDatoId: atributo.tipoDato?.id ?? 0,
      tipoDatoNombre: atributo.tipoDato?.nombre ?? '',
      almacenado: atributo.almacenado ?? false,
      activo: atributo.activo ?? true,
      valoresPermitidos: (atributo.valoresPermitidos ?? []).map((valor) => ({
        id: valor.id,
        valor: valor.valor,
      })),
    }))
  }

  async obtenerOperadoresRegla(): Promise<OperadorDisponible[]> {
    const datos = await solicitarApi<unknown>('/operadores')
    return aCamel<OperadorBack[]>(datos).map((operador) => ({
      id: operador.id,
      simbolo: operador.simbolo,
      nombre: operador.nombre,
      soloOrdenables: operador.soloOrdenables,
    }))
  }
}
