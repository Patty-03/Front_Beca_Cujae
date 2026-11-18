export interface ProcesoLeer {
  id: number
  nombre: string
  tipo: string
  estado: string
  periodoRegistroId: number
  cursoId: number
  curso: string
  conjuntoReglaId: number
  conjunto: string
  conjuntoVersion: number
  procesoOrigenId: number | null
  creadoPor: number
  creadoEn: string
  confirmadoPor: number | null
  confirmadoEn: string | null
  preasignaciones: number
  restricciones: number
}

export interface RestriccionLeer {
  id: number
  cuartoId: number
  cuarto: string
  conjuntoReglaId: number
  conjunto: string
  conjuntoVersion: number
  relajable: boolean
  exclusiva: boolean
}

export interface RestriccionCrearInput {
  conjuntoReglaId: number
  cuartoIds?: number[]
  escaleraId?: number | null
  edificioId?: number | null
  relajable?: boolean
  exclusiva?: boolean
}

export interface ResultadoRestricciones {
  creadas: number
  yaExistian: number
}

export interface ProcesoCrearInput {
  nombre: string
  tipo: 'MASIVO' | 'INDIVIDUAL'
  periodoRegistroId: number
  conjuntoReglaId: number
  procesoOrigenId?: number | null
}

export interface EjecutarInput {
  base?: 'FIJANDO_BLOQUEADAS' | 'DESDE_CERO'
  estudianteIds?: number[] | null
  relajarRestricciones?: number[]
  tiempoMaximo?: number
  algoritmo?: 'VORAZ' | 'VORAZ_REPARADO' | 'CPSAT' | 'CPSAT_VORAZ'
}

export interface NoAlojado {
  estudianteId: number
  estudiante: string
  motivo: string
  detalle: string
  seResolveriaRelajando: boolean
}

export interface Omitido {
  estudianteId: number
  estudiante: string
  motivo: string
  detalle: string
}

export interface MetricaPreferencia {
  preferencia: string
  valor: number
}

export interface ResultadoEjecucion {
  estadoSolver: string
  tiempoSegundos: number
  candidatos: number
  alojados: number
  fijadas: number
  noAlojados: NoAlojado[]
  omitidos: Omitido[]
  metricas: MetricaPreferencia[]
  restriccionesRelajadas: number[]
}

export interface PreasignacionLeer {
  id: number
  estudianteId: number
  estudiante: string
  cuartoId: number
  cuarto: string
  puntaje: number | null
  bloqueada: boolean
  estado: string
}

export interface PreasignacionCrearInput {
  estudianteId: number
  cuartoId: number
  bloqueada?: boolean
}

export interface PreasignacionActualizarInput {
  cuartoId?: number
  bloqueada?: boolean
}

export interface BloquearInput {
  bloqueada?: boolean
  estudianteIds?: number[]
}

export interface ConfirmarInput {
  excluirEstudianteIds?: number[]
}

export interface ResultadoConfirmacion {
  reservas: number
  excluidos: number
}

export interface PeriodoRegistro {
  id: number
  inicio: string
  fin: string
}
