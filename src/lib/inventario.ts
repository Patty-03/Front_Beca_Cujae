import type { EstadoMedio, TipoMedio } from '@/types/inventario'

export const TIPOS_MEDIO: TipoMedio[] = [
  'taquilla',
  'cama',
  'colchon',
  'almohada',
  'lampara',
  'mesilla',
  'ropero',
  'ventilador',
  'silla',
  'escritorio',
  'otro',
]

export const ETIQUETAS_TIPO_MEDIO: Record<TipoMedio, string> = {
  taquilla: 'Taquilla',
  cama: 'Cama',
  colchon: 'Colchón',
  almohada: 'Almohada',
  lampara: 'Lámpara',
  mesilla: 'Mesilla',
  ropero: 'Ropero',
  ventilador: 'Ventilador',
  silla: 'Silla',
  escritorio: 'Escritorio',
  otro: 'Otro',
}

export const ESTADOS_MEDIO: EstadoMedio[] = ['bueno', 'daniado', 'reparacion']

export const ETIQUETAS_ESTADO_MEDIO: Record<EstadoMedio, string> = {
  bueno: 'Bueno',
  daniado: 'Dañado',
  reparacion: 'En reparación',
}

export const esTipoMedio = (valor: unknown): valor is TipoMedio =>
  typeof valor === 'string' && TIPOS_MEDIO.includes(valor as TipoMedio)

export const esEstadoMedio = (valor: unknown): valor is EstadoMedio =>
  typeof valor === 'string' && ESTADOS_MEDIO.includes(valor as EstadoMedio)
