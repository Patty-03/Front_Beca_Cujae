export type TipoMedio =
  | 'taquilla'
  | 'cama'
  | 'colchon'
  | 'almohada'
  | 'lampara'
  | 'mesilla'
  | 'ropero'
  | 'ventilador'
  | 'silla'
  | 'escritorio'
  | 'otro'

export type EstadoMedio = 'bueno' | 'daniado' | 'reparacion'

export interface MedioDeCuarto {
  id: number
  cuartoId: number
  tipo: TipoMedio
  cantidad: number
  estado: EstadoMedio
  observaciones?: string
}

export interface CrearMedioInput {
  cuartoId: number
  tipo: TipoMedio
  cantidad: number
  estado: EstadoMedio
  observaciones?: string
}

export type ActualizarMedioInput = Omit<CrearMedioInput, 'cuartoId'>
