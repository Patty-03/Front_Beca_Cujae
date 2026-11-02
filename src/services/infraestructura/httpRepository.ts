import type {
  ActualizarCuartoInput,
  ActualizarEdificioInput,
  ActualizarEscaleraInput,
  CrearCuartoInput,
  CrearEdificioInput,
  CrearEscaleraInput,
  CuartoResumen,
  EdificioDetalle,
  EdificioResumen,
  EscaleraResumen,
  EstadoConstructivo,
  InfraestructuraResumen,
} from '@/types/infraestructura'
import { apiErrorMessage, apiFetch, apiJson, apiText } from '@/lib/api'
import type { InfraestructuraRepository } from './contracts'

const BASE = '/api/infraestructura'

async function solicitarJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(`${BASE}${path}`, init)

  if (!response.ok) {
    throw new Error(await apiErrorMessage(response))
  }

  return apiJson<T>(response)
}

async function solicitarVoid(path: string, init?: RequestInit): Promise<void> {
  const response = await apiFetch(`${BASE}${path}`, init)

  if (!response.ok) {
    throw new Error(await apiErrorMessage(response))
  }
}

async function solicitarCsv(path: string): Promise<string> {
  const response = await apiFetch(`${BASE}${path}`, {
    headers: { Accept: 'text/csv' },
  })

  if (!response.ok) {
    throw new Error(await apiErrorMessage(response))
  }

  return apiText(response)
}

export class HttpInfraestructuraRepository implements InfraestructuraRepository {
  obtenerEstadosConstructivos(): Promise<EstadoConstructivo[]> {
    return solicitarJson('/estados-constructivos')
  }

  obtenerResumen(): Promise<InfraestructuraResumen> {
    return solicitarJson('/resumen')
  }

  obtenerEdificios(): Promise<EdificioResumen[]> {
    return solicitarJson('/edificios')
  }

  obtenerEdificio(id: number): Promise<EdificioDetalle> {
    return solicitarJson(`/edificios/${id}`)
  }

  crearEdificio(input: CrearEdificioInput): Promise<EdificioResumen> {
    return solicitarJson('/edificios', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  actualizarEdificio(id: number, input: ActualizarEdificioInput): Promise<EdificioResumen> {
    return solicitarJson(`/edificios/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    })
  }

  eliminarEdificio(id: number): Promise<void> {
    return solicitarVoid(`/edificios/${id}`, { method: 'DELETE' })
  }

  crearEscalera(edificioId: number, input: CrearEscaleraInput): Promise<EscaleraResumen> {
    return solicitarJson(`/edificios/${edificioId}/escaleras`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  actualizarEscalera(id: number, input: ActualizarEscaleraInput): Promise<EscaleraResumen> {
    return solicitarJson(`/escaleras/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    })
  }

  eliminarEscalera(id: number): Promise<void> {
    return solicitarVoid(`/escaleras/${id}`, { method: 'DELETE' })
  }

  crearCuarto(escaleraId: number, input: CrearCuartoInput): Promise<CuartoResumen> {
    return solicitarJson(`/escaleras/${escaleraId}/cuartos`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  actualizarCuarto(id: number, input: ActualizarCuartoInput): Promise<CuartoResumen> {
    return solicitarJson(`/cuartos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    })
  }

  eliminarCuarto(id: number): Promise<void> {
    return solicitarVoid(`/cuartos/${id}`, { method: 'DELETE' })
  }

  exportarReporteGeneral(): Promise<string> {
    return solicitarCsv('/exportes/reporte')
  }

  exportarCenso(edificioId: number): Promise<string> {
    return solicitarCsv(`/exportes/censo/${edificioId}`)
  }
}
