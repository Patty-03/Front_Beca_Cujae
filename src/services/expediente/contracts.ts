import type {
  CrearEvaluacionInput,
  Evaluacion,
  ExpedienteEstudiante,
  FiltrosEvaluacion,
  HistorialAlojamiento,
} from '@/types/expediente'

export interface ExpedientesRepository {
  obtenerExpediente(estudianteId: number): Promise<ExpedienteEstudiante>
  obtenerEvaluaciones(estudianteId: number, filtros?: FiltrosEvaluacion): Promise<Evaluacion[]>
  crearEvaluacion(datos: CrearEvaluacionInput): Promise<Evaluacion>
  obtenerHistorialAlojamiento(estudianteId: number): Promise<HistorialAlojamiento[]>
}
