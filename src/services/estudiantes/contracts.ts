import type {
  AsignarCuartoInput,
  AsignarCuartosMasivosInput,
  AsignarCuartosMasivosResultado,
  AsignacionCuarto,
  AtributoDisponible,
  CondicionRegla,
  ConjuntoReglaCrear,
  Estudiante,
  EstudianteImportado,
  EstudianteResumen,
  FiltrosEstudiante,
  OperadorDisponible,
  PrioridadRegla,
  ResultadoImportacion,
  Sexo,
  SugerenciaCuarto,
  TipoIngreso,
} from '@/types/estudiante'

export interface EstudiantesRepository {
  obtenerEstudiantes(filtros?: FiltrosEstudiante): Promise<EstudianteResumen[]>
  obtenerEstudiante(id: number): Promise<Estudiante>
  importarEstudiantes(estudiantes: EstudianteImportado[]): Promise<ResultadoImportacion>
  sugerirCuartos(estudianteId: number): Promise<SugerenciaCuarto[]>
  asignarCuarto(estudianteId: number, input: AsignarCuartoInput): Promise<AsignacionCuarto>
  asignarCuartosMasivamente(
    asignaciones: AsignarCuartosMasivosInput[],
  ): Promise<AsignarCuartosMasivosResultado>
  eliminarEstudiante(id: number): Promise<void>
  obtenerAtributos(): Promise<AtributoDisponible[]>
  obtenerOperadores(): Promise<OperadorDisponible[]>
  crearConjuntoRegla(conjunto: ConjuntoReglaCrear): Promise<{ id: number }>
}
