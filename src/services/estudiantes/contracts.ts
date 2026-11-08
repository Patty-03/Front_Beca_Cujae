import type {
  AsignarCuartoInput,
  AsignacionCuarto,
  Estudiante,
  EstudianteImportado,
  EstudianteResumen,
  FiltrosEstudiante,
  ResultadoImportacion,
  SugerenciaCuarto,
} from '@/types/estudiante'

export interface EstudiantesRepository {
  obtenerEstudiantes(filtros?: FiltrosEstudiante): Promise<EstudianteResumen[]>
  obtenerEstudiante(id: number): Promise<Estudiante>
  importarEstudiantes(estudiantes: EstudianteImportado[]): Promise<ResultadoImportacion>
  sugerirCuartos(estudianteId: number): Promise<SugerenciaCuarto[]>
  asignarCuarto(estudianteId: number, input: AsignarCuartoInput): Promise<AsignacionCuarto>
  eliminarEstudiante(id: number): Promise<void>
}
