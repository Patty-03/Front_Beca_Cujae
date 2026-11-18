import type {
  AsignacionLeer,
  EstadoCumplimiento,
  OcurrenciaLeer,
  PeriodoLeer,
} from '@/types/planificacion'

export type VarianteBadge = 'default' | 'secondary' | 'destructive' | 'outline'

export function aIso(fecha: Date): string {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

export function hoyIso(): string {
  return aIso(new Date())
}

export function parseFecha(fecha: string): Date {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return new Date(anio ?? 0, (mes ?? 1) - 1, dia ?? 1)
}

export function sumarDias(fecha: string, dias: number): string {
  const base = parseFecha(fecha)
  base.setDate(base.getDate() + dias)
  return aIso(base)
}

export function maxFecha(...fechas: string[]): string {
  return fechas.filter(Boolean).sort().at(-1) ?? ''
}

export function minFecha(...fechas: string[]): string {
  return fechas.filter(Boolean).sort()[0] ?? ''
}

export function rangoPorDefecto(periodo: PeriodoLeer): { desde: string; hasta: string } {
  const hoy = hoyIso()
  const desde = hoy > periodo.fin ? periodo.inicio : hoy < periodo.inicio ? periodo.inicio : hoy
  return { desde, hasta: periodo.fin }
}

export function puedePublicarPeriodo(periodo: PeriodoLeer): boolean {
  return periodo.estado === 'BORRADOR' && periodo.planes > 0
}

export function puedeEliminarPeriodo(periodo: PeriodoLeer): boolean {
  return periodo.estado === 'BORRADOR' && periodo.ocurrencias === 0
}

export function etiquetaEstadoPeriodo(estado: string): string {
  const mapa: Record<string, string> = {
    BORRADOR: 'Borrador',
    PUBLICADO: 'Publicado',
    CERRADO: 'Cerrado',
  }
  return mapa[estado] ?? estado
}

export function varianteEstadoPeriodo(estado: string): VarianteBadge {
  if (estado === 'PUBLICADO') return 'default'
  if (estado === 'CERRADO') return 'secondary'
  return 'outline'
}

export function etiquetaEstadoAsignacion(estado: string): string {
  const mapa: Record<string, string> = {
    PLANIFICADA: 'Planificada',
    CUMPLIDA: 'Cumplida',
    INCUMPLIDA: 'Incumplida',
    JUSTIFICADA: 'Justificada',
    PERMUTADA: 'Permutada',
  }
  return mapa[estado] ?? estado
}

export function varianteEstadoAsignacion(estado: string): VarianteBadge {
  if (estado === 'CUMPLIDA') return 'default'
  if (estado === 'INCUMPLIDA') return 'destructive'
  if (estado === 'JUSTIFICADA') return 'secondary'
  if (estado === 'PERMUTADA') return 'outline'
  return 'outline'
}

export function ocurrenciaBajoCupo(ocurrencia: OcurrenciaLeer): boolean {
  return (
    !ocurrencia.cancelada &&
    ocurrencia.cantPersonas != null &&
    ocurrencia.asignados < ocurrencia.cantPersonas
  )
}

export function ocurrenciaCompleta(ocurrencia: OcurrenciaLeer): boolean {
  return (
    ocurrencia.cantPersonas != null && ocurrencia.asignados >= ocurrencia.cantPersonas
  )
}

export function esFechaFutura(fecha: string, hoy = hoyIso()): boolean {
  return fecha > hoy
}

export function estadosPermitidos(
  asignacion: AsignacionLeer,
  hoy = hoyIso(),
): Exclude<EstadoCumplimiento, 'PERMUTADA'>[] {
  if (asignacion.estado === 'PERMUTADA') return []
  if (esFechaFutura(asignacion.fecha, hoy)) return ['PLANIFICADA']
  return ['PLANIFICADA', 'CUMPLIDA', 'INCUMPLIDA', 'JUSTIFICADA']
}

export function puedeRecuperar(asignacion: AsignacionLeer): boolean {
  return (
    asignacion.estado === 'INCUMPLIDA' || asignacion.estado === 'JUSTIFICADA'
  )
}

export function formatearRango(inicio: string, fin: string): string {
  return `${inicio} a ${fin}`
}
