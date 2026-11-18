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

export interface PlanificacionRepository {
  listarPeriodos(filtros?: { estado?: string }): Promise<PeriodoLeer[]>
  leerPeriodo(id: number): Promise<PeriodoLeer>
  crearPeriodo(input: PeriodoInput): Promise<PeriodoLeer>
  actualizarPeriodo(id: number, input: PeriodoActualizarInput): Promise<PeriodoLeer>
  eliminarPeriodo(id: number): Promise<void>
  publicarPeriodo(id: number): Promise<PeriodoLeer>
  cerrarPeriodo(id: number): Promise<PeriodoLeer>
  listarPlanes(periodoId: number): Promise<PlanLeer[]>
  agregarPlan(periodoId: number, input: PlanCrearInput): Promise<PlanLeer>
  actualizarPlan(
    periodoId: number,
    planId: number,
    input: PlanActualizarInput,
  ): Promise<PlanLeer>
  quitarPlan(periodoId: number, planId: number): Promise<void>
  generarPlanificacion(periodoId: number, input?: GenerarInput): Promise<ResultadoGeneracion>

  listarTiposDeber(activo?: boolean): Promise<TipoDeberLeer[]>
  crearTipoDeber(input: TipoDeberCrearInput): Promise<TipoDeberLeer>
  actualizarTipoDeber(id: number, input: TipoDeberActualizarInput): Promise<TipoDeberLeer>
  listarHorarios(activo?: boolean): Promise<HorarioLeer[]>
  crearHorario(input: HorarioCrearInput): Promise<HorarioLeer>
  actualizarHorario(id: number, input: HorarioActualizarInput): Promise<HorarioLeer>
  listarUbicaciones(activo?: boolean): Promise<UbicacionLeer[]>
  crearUbicacion(input: UbicacionCrearInput): Promise<UbicacionLeer>
  actualizarUbicacion(id: number, input: UbicacionActualizarInput): Promise<UbicacionLeer>

  listarConfiguraciones(filtros?: ConfiguracionFiltros): Promise<ConfiguracionLeer[]>
  crearConfiguracion(input: ConfiguracionCrearInput): Promise<ConfiguracionLeer>
  actualizarConfiguracion(
    id: number,
    input: ConfiguracionActualizarInput,
  ): Promise<ConfiguracionLeer>
  versionarConfiguracion(
    id: number,
    input?: ConfiguracionActualizarInput,
  ): Promise<ConfiguracionLeer>
  eliminarConfiguracion(id: number): Promise<void>

  listarDiasSinDeberes(filtros?: DiaSinDeberesFiltros): Promise<DiaSinDeberesLeer[]>
  crearDiaSinDeberes(input: DiaSinDeberesCrearInput): Promise<DiaSinDeberesLeer>
  actualizarDiaSinDeberes(
    id: number,
    input: DiaSinDeberesActualizarInput,
  ): Promise<DiaSinDeberesLeer>
  eliminarDiaSinDeberes(id: number): Promise<void>

  listarExenciones(filtros?: ExencionFiltros): Promise<ExencionLeer[]>
  crearExencion(input: ExencionCrearInput): Promise<ExencionLeer>
  actualizarExencion(id: number, input: ExencionActualizarInput): Promise<ExencionLeer>
  eliminarExencion(id: number): Promise<void>

  listarOcurrencias(filtros?: OcurrenciaFiltros): Promise<OcurrenciaLeer[]>
  leerOcurrencia(id: number): Promise<OcurrenciaLeer>
  cancelarOcurrencia(id: number, input: CancelarInput): Promise<OcurrenciaLeer>
  reactivarOcurrencia(id: number): Promise<OcurrenciaLeer>
  asignarManual(ocurrenciaId: number, input: AsignacionCrearInput): Promise<AsignacionLeer>

  listarAsignaciones(filtros?: AsignacionFiltros): Promise<AsignacionLeer[]>
  actualizarAsignacion(
    id: number,
    input: AsignacionActualizarInput,
  ): Promise<AsignacionLeer>
  quitarAsignacion(id: number): Promise<void>
  registrarCumplimiento(input: CumplimientoInput): Promise<ResultadoCumplimiento>
  recuperar(asignacionId: number, input: RecuperacionInput): Promise<AsignacionLeer>
  listarDeudas(filtros?: DeudaFiltros): Promise<AsignacionLeer[]>
}
