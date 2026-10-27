const normalizar = (nombre: string) =>
  nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

const estilos: Record<string, { badge: string; color: string }> = {
  bueno: {
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    color: '#10b981',
  },
  regular: {
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    color: '#f59e0b',
  },
  'en reparacion': {
    badge: 'border-orange-200 bg-orange-50 text-orange-700',
    color: '#f97316',
  },
  'mal estado': {
    badge: 'border-red-200 bg-red-50 text-red-700',
    color: '#ef4444',
  },
  'fuera de servicio': {
    badge: 'border-slate-300 bg-slate-100 text-slate-700',
    color: '#64748b',
  },
}

export function clasesEstadoConstructivo(nombre: string): string {
  return (
    estilos[normalizar(nombre)]?.badge ??
    'border-border bg-muted text-muted-foreground'
  )
}

export function colorEstadoConstructivo(nombre: string): string {
  return estilos[normalizar(nombre)]?.color ?? '#64748b'
}
