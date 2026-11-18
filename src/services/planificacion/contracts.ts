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

export interface PlanificacionRepository {
  listarPeriodos(filtros?: { estado?: string }): Promise<PeriodoLeer[]>
  crearPeriodo(input: PeriodoInput): Promise<PeriodoLeer>
  actualizarPeriodo(id: number, input: PeriodoActualizarInput): Promise<PeriodoLeer>
  eliminarPeriodo(id: number): Promise<void>
  publicarPeriodo(id: number): Promise<PeriodoLeer>
  cerrarPeriodo(id: number): Promise<PeriodoLeer>
  listarPlanes(periodoId: number): Promise<PlanLeer[]>
  agregarPlan(periodoId: number, input: PlanCrearInput): Promise<PlanLeer>
  actualizarPlan(periodoId: number, planId: number, input: PlanCrearInput): Promise<PlanLeer>
  quitarPlan(periodoId: number, planId: number): Promise<void>
  generarPlanificacion(periodoId: number, input?: GenerarInput): Promise<ResultadoGeneracion>
  listarTiposDeber(): Promise<TipoDeberLeer[]>
  listarHorarios(): Promise<HorarioLeer[]>
  listarUbicaciones(): Promise<UbicacionLeer[]>
  listarConfiguraciones(): Promise<ConfiguracionLeer[]>
  crearConfiguracion(input: ConfiguracionCrearInput): Promise<ConfiguracionLeer>
  actualizarConfiguracion(
    id: number,
    input: ConfiguracionActualizarInput,
  ): Promise<ConfiguracionLeer>
  versionarConfiguracion(id: number): Promise<ConfiguracionLeer>
  eliminarConfiguracion(id: number): Promise<void>
}
