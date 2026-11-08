export function formatCurrency(value: number): string {
  return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(value)} CUP`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(value)
}

export function formatPercent(value: number, fractionDigits = 0): string {
  return `${new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)} %`
}

function parseFecha(value: string | null | undefined): Date | null {
  if (!value || value.trim() === '') return null

  const texto = value.trim()

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    const anio = Number(texto.slice(0, 4))
    const mes = Number(texto.slice(5, 7)) - 1
    const dia = Number(texto.slice(8, 10))
    const fecha = new Date(anio, mes, dia)
    const valida =
      fecha.getFullYear() === anio && fecha.getMonth() === mes && fecha.getDate() === dia
    return valida ? fecha : null
  }

  const fecha = new Date(texto)
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

export function formatDate(
  value: string | null | undefined,
  fallback = 'No registrada',
): string {
  const fecha = parseFecha(value)
  if (!fecha) return fallback

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(fecha)
}

export function formatDateTime(
  value: string | null | undefined,
  fallback = 'No registrada',
): string {
  const fecha = parseFecha(value)
  if (!fecha) return fallback

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fecha)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}
