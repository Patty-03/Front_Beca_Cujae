import { modoDemo } from '@/services/auth'
import type {
  AsignarCuartoInput,
  EstudianteImportado,
  FiltrosEstudiante,
} from '@/types/estudiante'
import { demoEstudiantesRepository } from './demoRepository'
import { HttpEstudiantesRepository } from './httpRepository'

const repositorio = modoDemo
  ? demoEstudiantesRepository
  : new HttpEstudiantesRepository()

export const obtenerEstudiantes = (filtros?: FiltrosEstudiante) =>
  repositorio.obtenerEstudiantes(filtros)

export const obtenerEstudiante = (id: number) => repositorio.obtenerEstudiante(id)

export const importarEstudiantes = (estudiantes: EstudianteImportado[]) =>
  repositorio.importarEstudiantes(estudiantes)

export const sugerirCuartos = (estudianteId: number) =>
  repositorio.sugerirCuartos(estudianteId)

export const asignarCuarto = (estudianteId: number, input: AsignarCuartoInput) =>
  repositorio.asignarCuarto(estudianteId, input)
