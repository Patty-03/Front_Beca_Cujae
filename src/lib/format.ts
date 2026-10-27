export function formatCurrency(value: number): string {
  return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(value)} CUP`
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}
