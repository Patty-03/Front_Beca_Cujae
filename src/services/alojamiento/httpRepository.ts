import type {
  BloquearInput,
  ConfirmarInput,
  EjecutarInput,
  NoAlojado,
  PeriodoRegistro,
  PreasignacionActualizarInput,
  PreasignacionCrearInput,
  PreasignacionLeer,
  ProcesoCrearInput,
  ProcesoLeer,
  ResultadoConfirmacion,
  ResultadoEjecucion,
  ResultadoRestricciones,
  RestriccionCrearInput,
  RestriccionLeer,
} from '@/types/alojamiento'
import { apiErrorMessage, apiFetch, apiJson } from '@/lib/api'
import type { ApiFetchOptions } from '@/lib/api'
import { toCamelObject, toSnakeObject } from '@/lib/case'
import type { AlojamientoRepository } from './contracts'

const API = '/api/v1'
const EJECUCION_TIMEOUT_MS = 180000

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

async function solicitarApi<T>(path: string, init?: ApiFetchOptions): Promise<T> {
  const response = await apiFetch(`${API}${path}`, init)

  if (!response.ok) {
    throw new ErrorHttp(response.status, await apiErrorMessage(response))
  }

  return apiJson<T>(response)
}

async function solicitarApiVoid(path: string, init?: ApiFetchOptions): Promise<void> {
  const response = await apiFetch(`${API}${path}`, init)

  if (!response.ok) {
    throw new ErrorHttp(response.status, await apiErrorMessage(response))
  }
}

export class HttpAlojamientoRepository implements AlojamientoRepository {
  async listarProcesos(filtros?: {
    estado?: string
    periodoRegistroId?: number
  }): Promise<ProcesoLeer[]> {
    const params = new URLSearchParams()
    if (filtros?.estado) params.set('estado', filtros.estado)
    if (filtros?.periodoRegistroId != null) {
      params.set('periodo_registro_id', String(filtros.periodoRegistroId))
    }
    const query = params.toString()

    const datos = await solicitarApi<unknown>(
      `/procesos-alojamiento${query ? `?${query}` : ''}`,
    )
    return aCamel<ProcesoLeer[]>(datos)
  }

  async obtenerProceso(id: number): Promise<ProcesoLeer> {
    return aCamel<ProcesoLeer>(await solicitarApi<unknown>(`/procesos-alojamiento/${id}`))
  }

  async crearProceso(input: ProcesoCrearInput): Promise<ProcesoLeer> {
    return aCamel<ProcesoLeer>(
      await solicitarApi<unknown>('/procesos-alojamiento', {
        method: 'POST',
        body: aCuerpo(input),
      }),
    )
  }

  async listarRestricciones(procesoId: number): Promise<RestriccionLeer[]> {
    return aCamel<RestriccionLeer[]>(
      await solicitarApi<unknown>(`/procesos-alojamiento/${procesoId}/restricciones`),
    )
  }

  async agregarRestricciones(
    procesoId: number,
    input: RestriccionCrearInput,
  ): Promise<ResultadoRestricciones> {
    return aCamel<ResultadoRestricciones>(
      await solicitarApi<unknown>(`/procesos-alojamiento/${procesoId}/restricciones`, {
        method: 'POST',
        body: aCuerpo(input),
      }),
    )
  }

  async quitarRestriccion(procesoId: number, restriccionId: number): Promise<void> {
    return solicitarApiVoid(
      `/procesos-alojamiento/${procesoId}/restricciones/${restriccionId}`,
      { method: 'DELETE' },
    )
  }

  async ejecutarProceso(
    procesoId: number,
    input?: EjecutarInput,
  ): Promise<ResultadoEjecucion> {
    return aCamel<ResultadoEjecucion>(
      await solicitarApi<unknown>(`/procesos-alojamiento/${procesoId}/ejecutar`, {
        method: 'POST',
        body: input ? aCuerpo(input) : undefined,
        timeoutMs: EJECUCION_TIMEOUT_MS,
      }),
    )
  }

  async listarPreasignaciones(procesoId: number): Promise<PreasignacionLeer[]> {
    return aCamel<PreasignacionLeer[]>(
      await solicitarApi<unknown>(`/procesos-alojamiento/${procesoId}/preasignaciones`),
    )
  }

  async listarNoAlojados(procesoId: number): Promise<NoAlojado[]> {
    return aCamel<NoAlojado[]>(
      await solicitarApi<unknown>(`/procesos-alojamiento/${procesoId}/no-alojados`),
    )
  }

  async agregarPreasignacion(
    procesoId: number,
    input: PreasignacionCrearInput,
  ): Promise<PreasignacionLeer> {
    return aCamel<PreasignacionLeer>(
      await solicitarApi<unknown>(`/procesos-alojamiento/${procesoId}/preasignaciones`, {
        method: 'POST',
        body: aCuerpo(input),
      }),
    )
  }

  async actualizarPreasignacion(
    procesoId: number,
    estudianteId: number,
    input: PreasignacionActualizarInput,
  ): Promise<PreasignacionLeer> {
    return aCamel<PreasignacionLeer>(
      await solicitarApi<unknown>(
        `/procesos-alojamiento/${procesoId}/preasignaciones/${estudianteId}`,
        { method: 'PATCH', body: aCuerpo(input) },
      ),
    )
  }

  async quitarPreasignacion(procesoId: number, estudianteId: number): Promise<void> {
    return solicitarApiVoid(
      `/procesos-alojamiento/${procesoId}/preasignaciones/${estudianteId}`,
      { method: 'DELETE' },
    )
  }

  async bloquearPreasignaciones(
    procesoId: number,
    input: BloquearInput,
  ): Promise<{ cambiadas: number }> {
    return aCamel<{ cambiadas: number }>(
      await solicitarApi<unknown>(`/procesos-alojamiento/${procesoId}/bloquear`, {
        method: 'POST',
        body: aCuerpo(input),
      }),
    )
  }

  async descartarProceso(procesoId: number): Promise<ProcesoLeer> {
    return aCamel<ProcesoLeer>(
      await solicitarApi<unknown>(`/procesos-alojamiento/${procesoId}/descartar`, {
        method: 'POST',
      }),
    )
  }

  async confirmarProceso(
    procesoId: number,
    input?: ConfirmarInput,
  ): Promise<ResultadoConfirmacion> {
    return aCamel<ResultadoConfirmacion>(
      await solicitarApi<unknown>(`/procesos-alojamiento/${procesoId}/confirmar`, {
        method: 'POST',
        body: input ? aCuerpo(input) : undefined,
      }),
    )
  }

  async listarPeriodosRegistro(): Promise<PeriodoRegistro[]> {
    return aCamel<PeriodoRegistro[]>(await solicitarApi<unknown>('/periodos-registro'))
  }
}
