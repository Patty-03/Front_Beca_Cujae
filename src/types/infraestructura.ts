export interface EstadoConstructivo {
  id: number
  nombre: string
  habitable: boolean
}

export interface EdificioResumen {
  id: number
  nombre: string
  estado: EstadoConstructivo
  escaleras: number
  cuartos: number
  capacidad: number
  ocupados: number
  ocupacionPct: number
}

export interface EscaleraResumen {
  id: number
  nombre: string
  cuartos: number
  capacidad: number
  ocupados: number
  ocupacionPct: number
}

export interface CuartoResumen {
  id: number
  nombre: string
  capacidadMaxima: number
  escaleraId: number
  estado: EstadoConstructivo
  ocupados: number
  ocupacionPct: number
  tieneAlojamientos: boolean
}

export interface DistribucionEstado {
  estado: EstadoConstructivo
  cuartos: number
}

export interface EventoAuditoria {
  id: number
  usuario: string
  servicio: string
  funcionalidad: string
  fecha: string
}

export interface InfraestructuraResumen {
  totalEdificios: number
  totalEscaleras: number
  totalCuartos: number
  capacidadTotal: number
  ocupados: number
  ocupacionPct: number
  estados: DistribucionEstado[]
  edificios: EdificioResumen[]
  eventos: EventoAuditoria[]
}

export interface EdificioDetalle extends EdificioResumen {
  escalerasDetalle: EscaleraResumen[]
  cuartosDetalle: CuartoResumen[]
}

export interface CrearEdificioInput {
  nombre: string
  estadoConstructivoId: number
}

export type ActualizarEdificioInput = CrearEdificioInput

export interface CrearEscaleraInput {
  nombre: string
}

export type ActualizarEscaleraInput = CrearEscaleraInput

export interface CrearCuartoInput {
  nombre: string
  capacidadMaxima: number
  estadoConstructivoId: number
}

export type ActualizarCuartoInput = CrearCuartoInput
