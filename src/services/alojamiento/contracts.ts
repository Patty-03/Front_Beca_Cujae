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

export interface AlojamientoRepository {
  listarProcesos(filtros?: {
    estado?: string
    periodoRegistroId?: number
  }): Promise<ProcesoLeer[]>
  obtenerProceso(id: number): Promise<ProcesoLeer>
  crearProceso(input: ProcesoCrearInput): Promise<ProcesoLeer>
  listarRestricciones(procesoId: number): Promise<RestriccionLeer[]>
  agregarRestricciones(
    procesoId: number,
    input: RestriccionCrearInput,
  ): Promise<ResultadoRestricciones>
  quitarRestriccion(procesoId: number, restriccionId: number): Promise<void>
  ejecutarProceso(procesoId: number, input?: EjecutarInput): Promise<ResultadoEjecucion>
  listarPreasignaciones(procesoId: number): Promise<PreasignacionLeer[]>
  listarNoAlojados(procesoId: number): Promise<NoAlojado[]>
  agregarPreasignacion(
    procesoId: number,
    input: PreasignacionCrearInput,
  ): Promise<PreasignacionLeer>
  actualizarPreasignacion(
    procesoId: number,
    estudianteId: number,
    input: PreasignacionActualizarInput,
  ): Promise<PreasignacionLeer>
  quitarPreasignacion(procesoId: number, estudianteId: number): Promise<void>
  bloquearPreasignaciones(
    procesoId: number,
    input: BloquearInput,
  ): Promise<{ cambiadas: number }>
  descartarProceso(procesoId: number): Promise<ProcesoLeer>
  confirmarProceso(
    procesoId: number,
    input?: ConfirmarInput,
  ): Promise<ResultadoConfirmacion>
  listarPeriodosRegistro(): Promise<PeriodoRegistro[]>
}
