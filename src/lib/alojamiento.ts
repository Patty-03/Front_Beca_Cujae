import type { PeriodoRegistro, ProcesoLeer } from '@/types/alojamiento'

export type VarianteBadge = 'default' | 'secondary' | 'destructive' | 'outline'

export function etiquetaEstadoProceso(estado: string): string {
  const mapa: Record<string, string> = {
    BORRADOR: 'Borrador',
    EN_REVISION: 'En revisión',
    CONFIRMADO: 'Confirmado',
    DESCARTADO: 'Descartado',
  }
  return mapa[estado] ?? estado
}

export function varianteEstadoProceso(estado: string): VarianteBadge {
  if (estado === 'CONFIRMADO') return 'default'
  if (estado === 'EN_REVISION') return 'secondary'
  if (estado === 'DESCARTADO') return 'outline'
  return 'outline'
}

export function etiquetaTipoProceso(tipo: string): string {
  if (tipo === 'MASIVO') return 'Masivo'
  if (tipo === 'INDIVIDUAL') return 'Individual'
  return tipo
}

export function puedeEditarProceso(estado: string): boolean {
  return estado === 'BORRADOR' || estado === 'EN_REVISION'
}

export function puedeEjecutarProceso(estado: string): boolean {
  return estado === 'BORRADOR' || estado === 'EN_REVISION'
}

export function puedeRevisarProceso(estado: string): boolean {
  return estado === 'BORRADOR' || estado === 'EN_REVISION'
}

export function puedeConfirmarProceso(proceso: ProcesoLeer | null, tienePreasignaciones: boolean): boolean {
  return !!proceso && proceso.estado === 'EN_REVISION' && tienePreasignaciones
}

export function puedeDescartarProceso(estado: string): boolean {
  return estado !== 'CONFIRMADO' && estado !== 'DESCARTADO'
}

export function esSoloLecturaProceso(estado: string): boolean {
  return estado === 'CONFIRMADO' || estado === 'DESCARTADO'
}

export function etiquetaPeriodoRegistro(periodos: PeriodoRegistro[], id: number): string {
  const p = periodos.find((x) => x.id === id)
  return p ? `${p.inicio} – ${p.fin}` : `#${id}`
}
