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
import { apiErrorMessage, apiFetch, apiJson } from '@/lib/api'
import type { EstudiantesRepository } from './contracts'

const BASE = '/api/estudiantes'

async function solicitarJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(`${BASE}${path}`, init)

  if (!response.ok) {
    throw new Error(await apiErrorMessage(response))
  }

  return apiJson<T>(response)
}

function construirQuery(filtros: FiltrosEstudiante): string {
  const params = new URLSearchParams()

  if (filtros.texto) params.set('texto', filtros.texto)
  if (filtros.carrera) params.set('carrera', filtros.carrera)
  if (filtros.especialidad) params.set('especialidad', filtros.especialidad)
  if (filtros.edificioId != null) params.set('edificioId', String(filtros.edificioId))
  if (filtros.tipoIngreso) params.set('tipoIngreso', filtros.tipoIngreso)
  if (filtros.estadoBeca) params.set('estadoBeca', filtros.estadoBeca)

  const query = params.toString()
  return query ? `?${query}` : ''
}

export class HttpEstudiantesRepository implements EstudiantesRepository {
  obtenerEstudiantes(filtros: FiltrosEstudiante = {}): Promise<EstudianteResumen[]> {
    return solicitarJson(construirQuery(filtros))
  }

  obtenerEstudiante(id: number): Promise<Estudiante> {
    return solicitarJson(`/${id}`)
  }

  importarEstudiantes(estudiantes: EstudianteImportado[]): Promise<ResultadoImportacion> {
    return solicitarJson('/importar', {
      method: 'POST',
      body: JSON.stringify({ estudiantes }),
    })
  }

  sugerirCuartos(estudianteId: number): Promise<SugerenciaCuarto[]> {
    return solicitarJson(`/${estudianteId}/sugerencias-cuarto`)
  }

  asignarCuarto(
    estudianteId: number,
    input: AsignarCuartoInput,
  ): Promise<AsignacionCuarto> {
    return solicitarJson(`/${estudianteId}/asignacion-cuarto`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }
}
