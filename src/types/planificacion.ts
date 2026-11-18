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

export interface GenerarInput {
  desde?: string
  hasta?: string
  tipoDeberIds?: number[]
  algoritmo?: 'SECUENCIAL' | 'CPSAT' | 'CPSAT_SECUENCIAL'
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

export interface TipoDeberLeer {
  id: number
  nombre: string
  activo: boolean
}

export interface HorarioLeer {
  id: number
  inicio: string
  fin: string
  activo: boolean
}

export interface UbicacionLeer {
  id: number
  nombre: string
  activo: boolean
}

export interface ConfiguracionLeer {
  id: number
  tipoDeberId: number
  tipoDeber: string
  nombre: string
  horarioId: number | null
  conjuntoReglaId: number | null
  modalidad: string
  cantPersonas: number | null
  puntos: number
  frecuencia: string
  intervalo: number
  fechaInicio: string
  fechaFin: string | null
  expandirPor: string
  diasSemana: number[]
  esUltima: boolean
}

export interface ConfiguracionCrearInput {
  tipoDeberId: number
  nombre: string
  horarioId?: number | null
  conjuntoReglaId?: number | null
  modalidad: 'TURNADA' | 'TODOS_LOS_ELEGIBLES' | 'MANUAL'
  cantPersonas?: number | null
  puntos?: number
  frecuencia: 'UNICA' | 'DIARIA' | 'SEMANAL' | 'MENSUAL' | 'ANUAL'
  intervalo?: number
  fechaInicio: string
  fechaFin?: string | null
  expandirPor?: 'NINGUNO' | 'EDIFICIO' | 'ESCALERA' | 'CUARTO'
  diasSemana?: number[]
}

export type ConfiguracionActualizarInput = Partial<ConfiguracionCrearInput>
