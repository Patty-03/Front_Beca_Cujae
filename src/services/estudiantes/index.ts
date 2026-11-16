import { modoDemo } from '@/services/auth'
import type {
  AsignarCuartoInput,
  AsignarCuartosMasivosInput,
  AsignarCuartosMasivosResultado,
  AtributoDisponible,
  CondicionRegla,
  ConjuntoReglaCrear,
  EstudianteImportado,
  FiltrosEstudiante,
  OperadorDisponible,
  PrioridadRegla,
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

export const asignarCuartosMasivamente = (asignaciones: AsignarCuartosMasivosInput[]) =>
  repositorio.asignarCuartosMasivamente(asignaciones)

export const eliminarEstudiante = (id: number) => repositorio.eliminarEstudiante(id)

export const obtenerAtributos = () => repositorio.obtenerAtributos()
export const obtenerOperadores = () => repositorio.obtenerOperadores()
export const crearConjuntoRegla = (conjunto: ConjuntoReglaCrear) =>
  repositorio.crearConjuntoRegla(conjunto)
