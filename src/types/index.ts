export type EstadoSolicitud = 'aprobada' | 'pendiente' | 'revisando' | 'rechazada'

export interface User {
  id: string
  name: string
  email: string
  role: string
}

export interface Beca {
  id: string
  nombre: string
  descripcion: string
  monto: number
  cupos: number
  solicitantes: number
  fechaCierre: string
  categoria: string
  requisitos: string[]
}

export interface Solicitud {
  id: string
  estudiante: string
  email: string
  carrera: string
  beca: string
  monto: number
  fecha: string
  estado: EstadoSolicitud
}
