import type { CuartoResumen, EstadoConstructivo } from '@/types/infraestructura'

export function calcularEstadoEdificio(
  cuartos: CuartoResumen[],
  estadosDisponibles: EstadoConstructivo[],
  pctBueno: number,
  pctRegular: number,
): EstadoConstructivo {
  const fallback: EstadoConstructivo = estadosDisponibles[0] ?? { id: 1, nombre: 'Bueno', habitable: true }
  if (cuartos.length === 0) {
    return fallback
  }

  const estadoBueno =
    estadosDisponibles.find((e) => e.nombre.toLowerCase() === 'bueno') ?? fallback
  const estadoRegular =
    estadosDisponibles.find((e) => e.nombre.toLowerCase() === 'regular') ?? estadoBueno
  const estadoMal =
    estadosDisponibles.find((e) => e.nombre.toLowerCase() === 'mal estado' || e.nombre.toLowerCase() === 'malo') ?? estadoRegular

  const cuartosBuenos = cuartos.filter(
    (c) => c.estado.nombre.toLowerCase() === 'bueno',
  ).length

  const pctBuenos = (cuartosBuenos / cuartos.length) * 100

  if (pctBuenos >= pctBueno) {
    return estadoBueno
  }

  if (pctBuenos >= pctRegular) {
    return estadoRegular
  }

  return estadoMal
}
