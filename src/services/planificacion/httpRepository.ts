import type {
  ConfiguracionActualizarInput,
  ConfiguracionCrearInput,
  ConfiguracionLeer,
  GenerarInput,
  HorarioLeer,
  PeriodoActualizarInput,
  PeriodoInput,
  PeriodoLeer,
  PlanCrearInput,
  PlanLeer,
  ResultadoGeneracion,
  TipoDeberLeer,
  UbicacionLeer,
} from '@/types/planificacion'
import { apiErrorMessage, apiFetch, apiJson } from '@/lib/api'
import { toCamelObject, toSnakeObject } from '@/lib/case'
import type { PlanificacionRepository } from './contracts'

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

const PERIODOS = '/periodos-planificacion'

export class HttpPlanificacionRepository implements PlanificacionRepository {
  async listarPeriodos(filtros?: { estado?: string }): Promise<PeriodoLeer[]> {
    const query = filtros?.estado ? `?estado=${filtros.estado}` : ''
    return aCamel<PeriodoLeer[]>(await solicitarApi<unknown>(`${PERIODOS}${query}`))
  }

  async crearPeriodo(input: PeriodoInput): Promise<PeriodoLeer> {
    return aCamel<PeriodoLeer>(
      await solicitarApi<unknown>(PERIODOS, {
        method: 'POST',
        body: aCuerpo(input),
      }),
    )
  }

  async actualizarPeriodo(
    id: number,
    input: PeriodoActualizarInput,
  ): Promise<PeriodoLeer> {
    return aCamel<PeriodoLeer>(
      await solicitarApi<unknown>(`${PERIODOS}/${id}`, {
        method: 'PATCH',
        body: aCuerpo(input),
      }),
    )
  }

  async eliminarPeriodo(id: number): Promise<void> {
    return solicitarApiVoid(`${PERIODOS}/${id}`, { method: 'DELETE' })
  }

  async publicarPeriodo(id: number): Promise<PeriodoLeer> {
    return aCamel<PeriodoLeer>(
      await solicitarApi<unknown>(`${PERIODOS}/${id}/publicar`, { method: 'POST' }),
    )
  }

  async cerrarPeriodo(id: number): Promise<PeriodoLeer> {
    return aCamel<PeriodoLeer>(
      await solicitarApi<unknown>(`${PERIODOS}/${id}/cerrar`, { method: 'POST' }),
    )
  }

  async listarPlanes(periodoId: number): Promise<PlanLeer[]> {
    return aCamel<PlanLeer[]>(
      await solicitarApi<unknown>(`${PERIODOS}/${periodoId}/planes`),
    )
  }

  async agregarPlan(periodoId: number, input: PlanCrearInput): Promise<PlanLeer> {
    return aCamel<PlanLeer>(
      await solicitarApi<unknown>(`${PERIODOS}/${periodoId}/planes`, {
        method: 'POST',
        body: aCuerpo(input),
      }),
    )
  }

  async actualizarPlan(
    periodoId: number,
    planId: number,
    input: PlanCrearInput,
  ): Promise<PlanLeer> {
    return aCamel<PlanLeer>(
      await solicitarApi<unknown>(`${PERIODOS}/${periodoId}/planes/${planId}`, {
        method: 'PATCH',
        body: aCuerpo(input),
      }),
    )
  }

  async quitarPlan(periodoId: number, planId: number): Promise<void> {
    return solicitarApiVoid(`${PERIODOS}/${periodoId}/planes/${planId}`, {
      method: 'DELETE',
    })
  }

  async generarPlanificacion(
    periodoId: number,
    input?: GenerarInput,
  ): Promise<ResultadoGeneracion> {
    return aCamel<ResultadoGeneracion>(
      await solicitarApi<unknown>(`${PERIODOS}/${periodoId}/generar`, {
        method: 'POST',
        body: input ? aCuerpo(input) : undefined,
      }),
    )
  }

  async listarTiposDeber(): Promise<TipoDeberLeer[]> {
    return aCamel<TipoDeberLeer[]>(await solicitarApi<unknown>('/tipos-deber'))
  }

  async listarHorarios(): Promise<HorarioLeer[]> {
    return aCamel<HorarioLeer[]>(await solicitarApi<unknown>('/horarios'))
  }

  async listarUbicaciones(): Promise<UbicacionLeer[]> {
    return aCamel<UbicacionLeer[]>(await solicitarApi<unknown>('/ubicaciones'))
  }

  async listarConfiguraciones(): Promise<ConfiguracionLeer[]> {
    return aCamel<ConfiguracionLeer[]>(
      await solicitarApi<unknown>('/configuraciones-deber'),
    )
  }

  async crearConfiguracion(input: ConfiguracionCrearInput): Promise<ConfiguracionLeer> {
    return aCamel<ConfiguracionLeer>(
      await solicitarApi<unknown>('/configuraciones-deber', {
        method: 'POST',
        body: aCuerpo(input),
      }),
    )
  }

  async actualizarConfiguracion(
    id: number,
    input: ConfiguracionActualizarInput,
  ): Promise<ConfiguracionLeer> {
    return aCamel<ConfiguracionLeer>(
      await solicitarApi<unknown>(`/configuraciones-deber/${id}`, {
        method: 'PATCH',
        body: aCuerpo(input),
      }),
    )
  }

  async versionarConfiguracion(id: number): Promise<ConfiguracionLeer> {
    return aCamel<ConfiguracionLeer>(
      await solicitarApi<unknown>(`/configuraciones-deber/${id}/versiones`, {
        method: 'POST',
        body: '{}',
      }),
    )
  }

  async eliminarConfiguracion(id: number): Promise<void> {
    return solicitarApiVoid(`/configuraciones-deber/${id}`, { method: 'DELETE' })
  }
}
