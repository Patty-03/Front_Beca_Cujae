import type {
  CrearEvaluacionInput,
  Evaluacion,
  ExpedienteEstudiante,
  FiltrosEvaluacion,
  HistorialAlojamiento,
} from '@/types/expediente'
import { apiErrorMessage, apiFetch, apiJson } from '@/lib/api'
import type { ExpedientesRepository } from './contracts'

const BASE = '/api/v1/estudiantes'

async function solicitarJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(`${BASE}${path}`, init)

  if (!response.ok) {
    throw new Error(await apiErrorMessage(response))
  }

  return apiJson<T>(response)
}

export class HttpExpedienteRepository implements ExpedientesRepository {
  async obtenerExpediente(estudianteId: number): Promise<ExpedienteEstudiante> {
    return solicitarJson<ExpedienteEstudiante>(`/${estudianteId}/expediente`)
  }

  async obtenerEvaluaciones(
    estudianteId: number,
    filtros: FiltrosEvaluacion = {}
  ): Promise<Evaluacion[]> {
    const params = new URLSearchParams()

    if (filtros.tipo_evaluacion) params.set('tipo_evaluacion', filtros.tipo_evaluacion)
    if (filtros.fecha_desde) params.set('fecha_desde', filtros.fecha_desde)
    if (filtros.fecha_hasta) params.set('fecha_hasta', filtros.fecha_hasta)

    const query = params.toString()
    const path = `/${estudianteId}/evaluaciones${query ? `?${query}` : ''}`

    return solicitarJson<Evaluacion[]>(path)
  }

  async crearEvaluacion(datos: CrearEvaluacionInput): Promise<Evaluacion> {
    return solicitarJson<Evaluacion>(`/${datos.estudiante_id}/evaluaciones`, {
      method: 'POST',
      body: JSON.stringify(datos),
    })
  }

  async obtenerHistorialAlojamiento(estudianteId: number): Promise<HistorialAlojamiento[]> {
    return solicitarJson<HistorialAlojamiento[]>(`/${estudianteId}/alojamiento-historial`)
  }
}
