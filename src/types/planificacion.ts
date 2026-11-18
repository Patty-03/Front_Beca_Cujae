export type EstadoPeriodo = 'BORRADOR' | 'PUBLICADO' | 'CERRADO'

export type EstadoCumplimiento =
  | 'PLANIFICADA'
  | 'CUMPLIDA'
  | 'INCUMPLIDA'
  | 'JUSTIFICADA'
  | 'PERMUTADA'

export type ModalidadDeber = 'TURNADA' | 'TODOS_LOS_ELEGIBLES' | 'MANUAL'

export type FrecuenciaDeber = 'UNICA' | 'DIARIA' | 'SEMANAL' | 'MENSUAL' | 'ANUAL'

export type ExpandirPor = 'NINGUNO' | 'EDIFICIO' | 'ESCALERA' | 'CUARTO'

export type AlgoritmoGeneracion = 'SECUENCIAL' | 'CPSAT' | 'CPSAT_SECUENCIAL'

export interface PeriodoLeer {
  id: number
  inicio: string
  fin: string
  estado: string
  planes: number
  ocurrencias: number
  asignaciones: number
}

export interface PeriodoInput {
  inicio: string
  fin: string
}

export interface PeriodoActualizarInput {
  inicio?: string
  fin?: string
}

export interface PlanLeer {
  id: number
  periodoPlanificacionId: number
  tipoDeberId: number
  tipoDeber: string
  conjuntoReglaId: number
  conjunto: string
  conjuntoVersion: number
}

export interface PlanCrearInput {
  tipoDeberId: number
  conjuntoReglaId: number
}

export interface PlanActualizarInput {
  conjuntoReglaId: number
}

export interface GenerarInput {
  desde?: string
  hasta?: string
  tipoDeberIds?: number[]
  algoritmo?: AlgoritmoGeneracion
  tiempoMaximo?: number
  metaPorMes?: number | null
}

export interface SinCubrir {
  ocurrenciaId: number
  fecha: string
  configuracion: string
  lugar: string | null
  faltan: number
}

export interface ResultadoGeneracion {
  desde: string
  hasta: string
  ocurrenciasCreadas: number
  ocurrenciasExistentes: number
  ocurrenciasRetiradas: number
  asignacionesCreadas: number
  asignacionesConservadas: number
  asignacionesRetiradas: number
  recuperaciones: number
  sinCubrir: SinCubrir[]
  algoritmo: string
  estado: string
  tiempoSegundos: number
}

export interface OcurrenciaLeer {
  id: number
  fecha: string
  cancelada: boolean
  motivoCancelacion: string | null
  configuracionDeberId: number
  configuracion: string
  tipoDeberId: number
  tipoDeber: string
  horario: string | null
  modalidad: string
  cantPersonas: number | null
  periodoPlanificacionId: number
  lugarNivel: string | null
  lugarId: number | null
  lugar: string | null
  asignados: number
}

export interface OcurrenciaFiltros {
  periodoPlanificacionId?: number
  desde?: string
  hasta?: string
  tipoDeberId?: number
  configuracionDeberId?: number
  limit?: number
  offset?: number
}

export interface AsignacionLeer {
  id: number
  estudianteId: number
  estudiante: string
  ocurrenciaDeberId: number
  fecha: string
  configuracion: string
  tipoDeberId: number
  tipoDeber: string
  horario: string | null
  lugar: string | null
  estado: string
  puntosCarga: number
  bloqueada: boolean
  asignacionOrigenId: number | null
  cancelada: boolean
}

export interface AsignacionFiltros {
  periodoPlanificacionId?: number
  estudianteId?: number
  ocurrenciaDeberId?: number
  desde?: string
  hasta?: string
  estado?: string
  tipoDeberId?: number
  limit?: number
  offset?: number
}

export interface AsignacionCrearInput {
  estudianteId: number
  bloqueada?: boolean
}

export interface AsignacionActualizarInput {
  bloqueada: boolean
}

export interface CancelarInput {
  motivo: string
}

export interface ItemCumplimiento {
  asignacionId: number
  estado: Exclude<EstadoCumplimiento, 'PERMUTADA'>
}

export interface CumplimientoInput {
  items: ItemCumplimiento[]
}

export interface ResultadoCumplimiento {
  actualizadas: number
}

export interface RecuperacionInput {
  ocurrenciaDeberId: number
  bloqueada?: boolean
}

export interface DeudaFiltros {
  estudianteId?: number
  tipoDeberId?: number
}

export interface TipoDeberLeer {
  id: number
  nombre: string
  activo: boolean
}

export interface TipoDeberCrearInput {
  nombre: string
}

export interface TipoDeberActualizarInput {
  nombre?: string
  activo?: boolean
}

export interface HorarioLeer {
  id: number
  inicio: string
  fin: string
  activo: boolean
}

export interface HorarioCrearInput {
  inicio: string
  fin: string
}

export interface HorarioActualizarInput {
  inicio?: string
  fin?: string
  activo?: boolean
}

export interface UbicacionLeer {
  id: number
  nombre: string
  activo: boolean
}

export interface UbicacionCrearInput {
  nombre: string
}

export interface UbicacionActualizarInput {
  nombre?: string
  activo?: boolean
}

export interface ConfiguracionLeer {
  id: number
  tipoDeberId: number
  tipoDeber: string
  nombre: string
  horarioId: number | null
  horario: string | null
  conjuntoReglaId: number | null
  conjunto: string | null
  modalidad: string
  cantPersonas: number | null
  puntos: number
  frecuencia: string
  intervalo: number
  fechaInicio: string
  fechaFin: string | null
  expandirPor: string
  diasSemana: number[]
  versionAnteriorId: number | null
  vigente: boolean
  esUltima: boolean
  enUso: boolean
}

export interface ConfiguracionFiltros {
  tipoDeberId?: number
  vigente?: boolean
  soloUltimas?: boolean
}

export interface ConfiguracionCrearInput {
  tipoDeberId: number
  nombre: string
  horarioId?: number | null
  conjuntoReglaId?: number | null
  modalidad: ModalidadDeber
  cantPersonas?: number | null
  puntos?: number
  frecuencia: FrecuenciaDeber
  intervalo?: number
  fechaInicio: string
  fechaFin?: string | null
  expandirPor?: ExpandirPor
  diasSemana?: number[]
}

export type ConfiguracionActualizarInput = Partial<ConfiguracionCrearInput>

export interface DiaSinDeberesLeer {
  id: number
  desde: string
  hasta: string
  motivo: string
  tipoDeberId: number | null
  tipoDeber: string | null
  ocurrenciasCanceladas: number
}

export interface DiaSinDeberesFiltros {
  desde?: string
  hasta?: string
  tipoDeberId?: number
}

export interface DiaSinDeberesCrearInput {
  desde: string
  hasta: string
  motivo: string
  tipoDeberId?: number | null
  cancelarOcurrencias?: boolean
}

export interface DiaSinDeberesActualizarInput {
  desde?: string
  hasta?: string
  motivo?: string
}

export interface ExencionLeer {
  id: number
  estudianteId: number
  estudiante: string
  tipoDeberId: number | null
  tipoDeber: string | null
  desde: string
  hasta: string | null
  motivo: string | null
  vigente: boolean
}

export interface ExencionFiltros {
  estudianteId?: number
  tipoDeberId?: number
  vigente?: boolean
}

export interface ExencionCrearInput {
  estudianteId: number
  tipoDeberId?: number | null
  desde: string
  hasta?: string | null
  motivo?: string | null
}

export interface ExencionActualizarInput {
  hasta?: string | null
  motivo?: string | null
}
