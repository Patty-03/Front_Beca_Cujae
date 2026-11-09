export type EstadoSolicitudMedio = 'pendiente' | 'aprobada' | 'rechazada'

export interface TipoMedioSolicitud {
  id: number
  codigo: string
  nombre: string
  activo: boolean
}

export interface SolicitudMedio {
  id: number
  estudianteId: number
  estudianteNombre: string
  tipoMedioId: number
  tipoMedioNombre: string
  cantidad: number
  motivo: string
  estado: EstadoSolicitudMedio
  fechaSolicitud: string
  fechaResolucion: string | null
  resueltoPor: number | null
  observacionesResolucion: string | null
}

export interface CrearSolicitudMedioInput {
  tipoMedioId: number
  cantidad: number
  motivo: string
}

export interface ResolverSolicitudMedioInput {
  observacionesResolucion?: string
}
