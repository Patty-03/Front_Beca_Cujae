import type {
  AsignacionActualizarInput,
  AsignacionCrearInput,
  AsignacionFiltros,
  AsignacionLeer,
  CancelarInput,
  ConfiguracionActualizarInput,
  ConfiguracionCrearInput,
  ConfiguracionFiltros,
  ConfiguracionLeer,
  CumplimientoInput,
  DeudaFiltros,
  DiaSinDeberesActualizarInput,
  DiaSinDeberesCrearInput,
  DiaSinDeberesFiltros,
  DiaSinDeberesLeer,
  ExencionActualizarInput,
  ExencionCrearInput,
  ExencionFiltros,
  ExencionLeer,
  GenerarInput,
  HorarioActualizarInput,
  HorarioCrearInput,
  HorarioLeer,
  OcurrenciaFiltros,
  OcurrenciaLeer,
  PeriodoActualizarInput,
  PeriodoInput,
  PeriodoLeer,
  PlanActualizarInput,
  PlanCrearInput,
  PlanLeer,
  RecuperacionInput,
  ResultadoCumplimiento,
  ResultadoGeneracion,
  TipoDeberActualizarInput,
  TipoDeberCrearInput,
  TipoDeberLeer,
  UbicacionActualizarInput,
  UbicacionCrearInput,
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

type QueryValue = string | number | boolean | null | undefined

function query(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const texto = search.toString()
  return texto ? `?${texto}` : ''
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
const CONFIGURACIONES = '/configuraciones-deber'
const OCURRENCIAS = '/ocurrencias-deber'
const ASIGNACIONES = '/asignaciones-deber'

export class HttpPlanificacionRepository implements PlanificacionRepository {
  async listarPeriodos(filtros?: { estado?: string }): Promise<PeriodoLeer[]> {
    const q = query({ estado: filtros?.estado })
    return aCamel<PeriodoLeer[]>(await solicitarApi<unknown>(`${PERIODOS}${q}`))
  }

  async leerPeriodo(id: number): Promise<PeriodoLeer> {
    return aCamel<PeriodoLeer>(await solicitarApi<unknown>(`${PERIODOS}/${id}`))
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
    input: PlanActualizarInput,
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

  async listarTiposDeber(activo?: boolean): Promise<TipoDeberLeer[]> {
    const q = query({ activo })
    return aCamel<TipoDeberLeer[]>(await solicitarApi<unknown>(`/tipos-deber${q}`))
  }

  async crearTipoDeber(input: TipoDeberCrearInput): Promise<TipoDeberLeer> {
    return aCamel<TipoDeberLeer>(
      await solicitarApi<unknown>('/tipos-deber', {
        method: 'POST',
        body: aCuerpo(input),
      }),
    )
  }

  async actualizarTipoDeber(
    id: number,
    input: TipoDeberActualizarInput,
  ): Promise<TipoDeberLeer> {
    return aCamel<TipoDeberLeer>(
      await solicitarApi<unknown>(`/tipos-deber/${id}`, {
        method: 'PATCH',
        body: aCuerpo(input),
      }),
    )
  }

  async listarHorarios(activo?: boolean): Promise<HorarioLeer[]> {
    const q = query({ activo })
    return aCamel<HorarioLeer[]>(await solicitarApi<unknown>(`/horarios${q}`))
  }

  async crearHorario(input: HorarioCrearInput): Promise<HorarioLeer> {
    return aCamel<HorarioLeer>(
      await solicitarApi<unknown>('/horarios', {
        method: 'POST',
        body: aCuerpo(input),
      }),
    )
  }

  async actualizarHorario(
    id: number,
    input: HorarioActualizarInput,
  ): Promise<HorarioLeer> {
    return aCamel<HorarioLeer>(
      await solicitarApi<unknown>(`/horarios/${id}`, {
        method: 'PATCH',
        body: aCuerpo(input),
      }),
    )
  }

  async listarUbicaciones(activo?: boolean): Promise<UbicacionLeer[]> {
    const q = query({ activo })
    return aCamel<UbicacionLeer[]>(await solicitarApi<unknown>(`/ubicaciones${q}`))
  }

  async crearUbicacion(input: UbicacionCrearInput): Promise<UbicacionLeer> {
    return aCamel<UbicacionLeer>(
      await solicitarApi<unknown>('/ubicaciones', {
        method: 'POST',
        body: aCuerpo(input),
      }),
    )
  }

  async actualizarUbicacion(
    id: number,
    input: UbicacionActualizarInput,
  ): Promise<UbicacionLeer> {
    return aCamel<UbicacionLeer>(
      await solicitarApi<unknown>(`/ubicaciones/${id}`, {
        method: 'PATCH',
        body: aCuerpo(input),
      }),
    )
  }

  async listarConfiguraciones(
    filtros?: ConfiguracionFiltros,
  ): Promise<ConfiguracionLeer[]> {
    const q = query({
      tipo_deber_id: filtros?.tipoDeberId,
      vigente: filtros?.vigente,
      solo_ultimas: filtros?.soloUltimas,
    })
    return aCamel<ConfiguracionLeer[]>(
      await solicitarApi<unknown>(`${CONFIGURACIONES}${q}`),
    )
  }

  async crearConfiguracion(input: ConfiguracionCrearInput): Promise<ConfiguracionLeer> {
    return aCamel<ConfiguracionLeer>(
      await solicitarApi<unknown>(CONFIGURACIONES, {
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
      await solicitarApi<unknown>(`${CONFIGURACIONES}/${id}`, {
        method: 'PATCH',
        body: aCuerpo(input),
      }),
    )
  }

  async versionarConfiguracion(
    id: number,
    input?: ConfiguracionActualizarInput,
  ): Promise<ConfiguracionLeer> {
    return aCamel<ConfiguracionLeer>(
      await solicitarApi<unknown>(`${CONFIGURACIONES}/${id}/versiones`, {
        method: 'POST',
        body: input ? aCuerpo(input) : '{}',
      }),
    )
  }

  async eliminarConfiguracion(id: number): Promise<void> {
    return solicitarApiVoid(`${CONFIGURACIONES}/${id}`, { method: 'DELETE' })
  }

  async listarDiasSinDeberes(
    filtros?: DiaSinDeberesFiltros,
  ): Promise<DiaSinDeberesLeer[]> {
    const q = query({
      desde: filtros?.desde,
      hasta: filtros?.hasta,
      tipo_deber_id: filtros?.tipoDeberId,
    })
    return aCamel<DiaSinDeberesLeer[]>(
      await solicitarApi<unknown>(`/dias-sin-deberes${q}`),
    )
  }

  async crearDiaSinDeberes(
    input: DiaSinDeberesCrearInput,
  ): Promise<DiaSinDeberesLeer> {
    return aCamel<DiaSinDeberesLeer>(
      await solicitarApi<unknown>('/dias-sin-deberes', {
        method: 'POST',
        body: aCuerpo(input),
      }),
    )
  }

  async actualizarDiaSinDeberes(
    id: number,
    input: DiaSinDeberesActualizarInput,
  ): Promise<DiaSinDeberesLeer> {
    return aCamel<DiaSinDeberesLeer>(
      await solicitarApi<unknown>(`/dias-sin-deberes/${id}`, {
        method: 'PATCH',
        body: aCuerpo(input),
      }),
    )
  }

  async eliminarDiaSinDeberes(id: number): Promise<void> {
    return solicitarApiVoid(`/dias-sin-deberes/${id}`, { method: 'DELETE' })
  }

  async listarExenciones(filtros?: ExencionFiltros): Promise<ExencionLeer[]> {
    const q = query({
      estudiante_id: filtros?.estudianteId,
      tipo_deber_id: filtros?.tipoDeberId,
      vigente: filtros?.vigente,
    })
    return aCamel<ExencionLeer[]>(await solicitarApi<unknown>(`/exenciones${q}`))
  }

  async crearExencion(input: ExencionCrearInput): Promise<ExencionLeer> {
    return aCamel<ExencionLeer>(
      await solicitarApi<unknown>('/exenciones', {
        method: 'POST',
        body: aCuerpo(input),
      }),
    )
  }

  async actualizarExencion(
    id: number,
    input: ExencionActualizarInput,
  ): Promise<ExencionLeer> {
    return aCamel<ExencionLeer>(
      await solicitarApi<unknown>(`/exenciones/${id}`, {
        method: 'PATCH',
        body: aCuerpo(input),
      }),
    )
  }

  async eliminarExencion(id: number): Promise<void> {
    return solicitarApiVoid(`/exenciones/${id}`, { method: 'DELETE' })
  }

  async listarOcurrencias(filtros?: OcurrenciaFiltros): Promise<OcurrenciaLeer[]> {
    const q = query({
      periodo_planificacion_id: filtros?.periodoPlanificacionId,
      desde: filtros?.desde,
      hasta: filtros?.hasta,
      tipo_deber_id: filtros?.tipoDeberId,
      configuracion_deber_id: filtros?.configuracionDeberId,
      limit: filtros?.limit,
      offset: filtros?.offset,
    })
    return aCamel<OcurrenciaLeer[]>(await solicitarApi<unknown>(`${OCURRENCIAS}${q}`))
  }

  async leerOcurrencia(id: number): Promise<OcurrenciaLeer> {
    return aCamel<OcurrenciaLeer>(await solicitarApi<unknown>(`${OCURRENCIAS}/${id}`))
  }

  async cancelarOcurrencia(id: number, input: CancelarInput): Promise<OcurrenciaLeer> {
    return aCamel<OcurrenciaLeer>(
      await solicitarApi<unknown>(`${OCURRENCIAS}/${id}/cancelar`, {
        method: 'POST',
        body: aCuerpo(input),
      }),
    )
  }

  async reactivarOcurrencia(id: number): Promise<OcurrenciaLeer> {
    return aCamel<OcurrenciaLeer>(
      await solicitarApi<unknown>(`${OCURRENCIAS}/${id}/reactivar`, { method: 'POST' }),
    )
  }

  async asignarManual(
    ocurrenciaId: number,
    input: AsignacionCrearInput,
  ): Promise<AsignacionLeer> {
    return aCamel<AsignacionLeer>(
      await solicitarApi<unknown>(`${OCURRENCIAS}/${ocurrenciaId}/asignaciones`, {
        method: 'POST',
        body: aCuerpo(input),
      }),
    )
  }

  async listarAsignaciones(filtros?: AsignacionFiltros): Promise<AsignacionLeer[]> {
    const q = query({
      periodo_planificacion_id: filtros?.periodoPlanificacionId,
      estudiante_id: filtros?.estudianteId,
      ocurrencia_deber_id: filtros?.ocurrenciaDeberId,
      desde: filtros?.desde,
      hasta: filtros?.hasta,
      estado: filtros?.estado,
      tipo_deber_id: filtros?.tipoDeberId,
      limit: filtros?.limit,
      offset: filtros?.offset,
    })
    return aCamel<AsignacionLeer[]>(
      await solicitarApi<unknown>(`${ASIGNACIONES}${q}`),
    )
  }

  async actualizarAsignacion(
    id: number,
    input: AsignacionActualizarInput,
  ): Promise<AsignacionLeer> {
    return aCamel<AsignacionLeer>(
      await solicitarApi<unknown>(`${ASIGNACIONES}/${id}`, {
        method: 'PATCH',
        body: aCuerpo(input),
      }),
    )
  }

  async quitarAsignacion(id: number): Promise<void> {
    return solicitarApiVoid(`${ASIGNACIONES}/${id}`, { method: 'DELETE' })
  }

  async registrarCumplimiento(
    input: CumplimientoInput,
  ): Promise<ResultadoCumplimiento> {
    return aCamel<ResultadoCumplimiento>(
      await solicitarApi<unknown>(`${ASIGNACIONES}/cumplimiento`, {
        method: 'POST',
        body: aCuerpo(input),
      }),
    )
  }

  async recuperar(
    asignacionId: number,
    input: RecuperacionInput,
  ): Promise<AsignacionLeer> {
    return aCamel<AsignacionLeer>(
      await solicitarApi<unknown>(`${ASIGNACIONES}/${asignacionId}/recuperacion`, {
        method: 'POST',
        body: aCuerpo(input),
      }),
    )
  }

  async listarDeudas(filtros?: DeudaFiltros): Promise<AsignacionLeer[]> {
    const q = query({
      estudiante_id: filtros?.estudianteId,
      tipo_deber_id: filtros?.tipoDeberId,
    })
    return aCamel<AsignacionLeer[]>(await solicitarApi<unknown>(`/deudas${q}`))
  }
}
