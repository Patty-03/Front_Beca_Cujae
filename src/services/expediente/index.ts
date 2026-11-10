import type {
  CrearEvaluacionInput,
  Evaluacion,
  ExpedienteEstudiante,
  FiltrosEvaluacion,
  HistorialAlojamiento,
} from '@/types/expediente'
import { HttpExpedienteRepository } from './httpRepository'

const repositorio = new HttpExpedienteRepository()

export const obtenerExpediente = (estudianteId: number) =>
  repositorio.obtenerExpediente(estudianteId)

export const obtenerEvaluaciones = (
  estudianteId: number,
  filtros?: FiltrosEvaluacion
) => repositorio.obtenerEvaluaciones(estudianteId, filtros)

export const crearEvaluacion = (datos: CrearEvaluacionInput) =>
  repositorio.crearEvaluacion(datos)

export const obtenerHistorialAlojamiento = (estudianteId: number) =>
  repositorio.obtenerHistorialAlojamiento(estudianteId)
