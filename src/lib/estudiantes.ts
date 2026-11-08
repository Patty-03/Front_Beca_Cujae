import type {
  EstadoBeca,
  EstadoDeber,
  Sexo,
  TipoDeber,
  TipoIngreso,
} from '@/types/estudiante'

export const PROVINCIAS_CUBA = [
  'Pinar del Río',
  'Artemisa',
  'La Habana',
  'Mayabeque',
  'Matanzas',
  'Cienfuegos',
  'Villa Clara',
  'Sancti Spíritus',
  'Ciego de Ávila',
  'Camagüey',
  'Las Tunas',
  'Holguín',
  'Granma',
  'Santiago de Cuba',
  'Guantánamo',
  'Isla de la Juventud',
] as const

export const TIPOS_INGRESO: TipoIngreso[] = [
  'extranjero_convenio',
  'extranjero_autofinanciado',
  'residente_provincia',
  'caso_excepcional',
  'lejania',
  'traslado',
]

export const ESTADOS_BECA: EstadoBeca[] = ['activo', 'condicional', 'baja']

export const SEXOS: Sexo[] = ['F', 'M']

export const ETIQUETAS_TIPO_INGRESO: Record<TipoIngreso, string> = {
  extranjero_convenio: 'Extranjero por convenio',
  extranjero_autofinanciado: 'Extranjero autofinanciado',
  residente_provincia: 'Residente en provincia',
  caso_excepcional: 'Caso excepcional',
  lejania: 'Lejanía',
  traslado: 'Traslado',
}

export const ETIQUETAS_ESTADO_BECA: Record<EstadoBeca, string> = {
  activo: 'Activo',
  condicional: 'Condicional',
  baja: 'Baja',
}

export const ETIQUETAS_SEXO: Record<Sexo, string> = {
  F: 'Femenino',
  M: 'Masculino',
}

export const ETIQUETAS_TIPO_DEBER: Record<TipoDeber, string> = {
  guardia: 'Guardia',
  limpieza_areas_verdes: 'Limpieza de áreas verdes',
  limpieza_escaleras: 'Limpieza de escaleras',
  limpieza_cuarto: 'Limpieza de cuarto',
}

export const ETIQUETAS_ESTADO_DEBER: Record<EstadoDeber, string> = {
  pendiente: 'Pendiente',
  cumplido: 'Cumplido',
  incumplido: 'Incumplido',
}

export function normalizarClave(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function esTipoIngreso(value: unknown): value is TipoIngreso {
  return typeof value === 'string' && TIPOS_INGRESO.includes(value as TipoIngreso)
}

export function esEstadoBeca(value: unknown): value is EstadoBeca {
  return typeof value === 'string' && ESTADOS_BECA.includes(value as EstadoBeca)
}

export function esSexo(value: unknown): value is Sexo {
  return typeof value === 'string' && SEXOS.includes(value as Sexo)
}

export function esProvinciaDeCuba(value: string): boolean {
  return PROVINCIAS_CUBA.some(
    (provincia) => normalizarClave(provincia) === normalizarClave(value),
  )
}

export function esProvinciaImportable(value: string): boolean {
  const provincia = normalizarClave(value)
  return provincia !== '' && provincia !== normalizarClave('La Habana')
}
