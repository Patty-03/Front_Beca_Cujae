import { aIso, hoyIso } from './planificacion'

export interface DiaCalendario {
  fecha: string
  dia: number
  esDelMes: boolean
  esHoy: boolean
}

export function nombreMes(anio: number, mes: number): string {
  const texto = new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(anio, mes - 1, 1))
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function sumarMes(
  anio: number,
  mes: number,
  delta: number,
): { anio: number; mes: number } {
  const fecha = new Date(anio, mes - 1 + delta, 1)
  return { anio: fecha.getFullYear(), mes: fecha.getMonth() + 1 }
}

export function rangoMes(anio: number, mes: number): { desde: string; hasta: string } {
  return {
    desde: aIso(new Date(anio, mes - 1, 1)),
    hasta: aIso(new Date(anio, mes, 0)),
  }
}

export function diasDelMes(anio: number, mes: number): DiaCalendario[] {
  const primero = new Date(anio, mes - 1, 1)
  const desplazamiento = (primero.getDay() + 6) % 7
  const inicio = new Date(anio, mes - 1, 1 - desplazamiento)
  const hoy = hoyIso()

  return Array.from({ length: 42 }, (_, indice) => {
    const fecha = new Date(inicio)
    fecha.setDate(inicio.getDate() + indice)
    return {
      fecha: aIso(fecha),
      dia: fecha.getDate(),
      esDelMes: fecha.getMonth() === mes - 1,
      esHoy: aIso(fecha) === hoy,
    }
  })
}
