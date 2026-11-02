export type Sexo = 'F' | 'M'

export type TipoIngreso =
  | 'extranjero_convenio'
  | 'extranjero_autofinanciado'
  | 'residente_provincia'
  | 'caso_excepcional'
  | 'lejania'
  | 'traslado'

export type EstadoBeca = 'activo' | 'condicional' | 'baja'

export type TipoDeber =
  | 'guardia'
  | 'limpieza_areas_verdes'
  | 'limpieza_escaleras'
  | 'limpieza_cuarto'

export type EstadoDeber = 'pendiente' | 'cumplido' | 'incumplido'

export interface AsignacionCuarto {
  id: number
  edificioId: number
  edificioNombre: string
  escaleraId: number
  escaleraNombre: string
  cuartoId: number
  cuartoNombre: string
  desde: string
  hasta?: string
  taquilla?: string
  llaveEntregada: boolean
  llaveTaquillaEntregada: boolean
}

export interface DeberEstudiante {
  id: number
  tipo: TipoDeber
  descripcion: string
  fecha: string
  turno?: string
  estado: EstadoDeber
  cuartoNombre?: string
}

export interface EstudianteResumen {
  id: number
  carnet: string
  nombre: string
  sexo: Sexo
  provincia: string
  municipio: string
  facultad: string
  carrera: string
  especialidad: string
  anioAcademico: number
  grupo?: string
  tipoIngreso: TipoIngreso
  estadoBeca: EstadoBeca
  telefono: string
  asignacion: AsignacionCuarto | null
  deberesPendientes: number
  deberesIncumplidos: number
}

export interface Estudiante extends EstudianteResumen {
  fechaNacimiento: string
  pais: string
  preuniversitario?: string
  fechaIngreso: string
  direccionParticular: string
  padecimiento?: string
  madre?: string
  padre?: string
  telefonoMadre?: string
  telefonoPadre?: string
  militancia?: string
  observaciones?: string
  zonaProcedencia?: string
  universidadOrigen?: string
  deberes: DeberEstudiante[]
}

export type EstudianteImportado = Omit<
  Estudiante,
  'id' | 'asignacion' | 'deberes' | 'deberesPendientes' | 'deberesIncumplidos'
>

export interface FiltrosEstudiante {
  texto?: string
  carrera?: string
  especialidad?: string
  edificioId?: number | null
  tipoIngreso?: TipoIngreso | ''
  estadoBeca?: EstadoBeca | ''
}

export interface FilaImportacionEstudiante {
  fila: number
  datos: EstudianteImportado | null
  errores: string[]
  omision?: string
}

export interface ResumenImportacion {
  total: number
  validas: number
  omitidas: number
  rechazadas: number
}

export interface PrevisualizacionImportacion {
  filas: FilaImportacionEstudiante[]
  resumen: ResumenImportacion
  encabezados: string[]
}

export interface ResultadoImportacion {
  resumen: ResumenImportacion
  importadas: EstudianteResumen[]
}

export interface SugerenciaCuarto {
  cuartoId: number
  cuartoNombre: string
  edificioId: number
  edificioNombre: string
  escaleraId: number
  escaleraNombre: string
  capacidadMaxima: number
  ocupados: number
  disponibles: number
  puntuacion: number
  motivos: string[]
}

export interface AsignarCuartoInput {
  cuartoId: number
  desde?: string
  taquilla?: string
  llaveEntregada?: boolean
  llaveTaquillaEntregada?: boolean
}
