import type { EstadoSolicitudMedio } from '@/types/solicitud-medio'

export const ESTADOS_SOLICITUD_MEDIO: EstadoSolicitudMedio[] = [
  'pendiente',
  'aprobada',
  'rechazada',
]

export const ETIQUETAS_ESTADO_SOLICITUD_MEDIO: Record<EstadoSolicitudMedio, string> = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
}

export function esEstadoSolicitudMedio(value: unknown): value is EstadoSolicitudMedio {
  return (
    typeof value === 'string' && ESTADOS_SOLICITUD_MEDIO.includes(value as EstadoSolicitudMedio)
  )
}

export function esSolicitudResuelta(estado: EstadoSolicitudMedio): boolean {
  return estado !== 'pendiente'
}
