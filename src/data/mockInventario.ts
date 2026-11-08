import { cuartos } from '@/data/mockInfraestructura'
import type { EstadoMedio, TipoMedio } from '@/types/inventario'

export interface MedioRecord {
  id: number
  cuartoId: number
  tipo: TipoMedio
  cantidad: number
  estado: EstadoMedio
  observaciones?: string
}

export const medios: MedioRecord[] = []

let medioId = 1

const agregar = (
  cuartoId: number,
  tipo: TipoMedio,
  cantidad: number,
  estado: EstadoMedio,
  observaciones?: string,
) => {
  medios.push({ id: medioId++, cuartoId, tipo, cantidad, estado, observaciones })
}

for (const cuarto of cuartos) {
  const capacidad = cuarto.capacidadMaxima
  const inhabitable = cuarto.estadoConstructivoId === 3 || cuarto.estadoConstructivoId === 4
  const colchonReparacion = cuarto.id % 29 === 0
  const colchonDaniado = cuarto.id % 17 === 0
  const taquillaDaniada = cuarto.id % 23 === 0
  const ventiladorDaniado = cuarto.id % 11 === 0

  const estadoBase: EstadoMedio = inhabitable ? 'daniado' : 'bueno'
  let estadoColchon: EstadoMedio = estadoBase
  if (!inhabitable && colchonReparacion) estadoColchon = 'reparacion'
  if (!inhabitable && colchonDaniado && !colchonReparacion) estadoColchon = 'daniado'

  agregar(cuarto.id, 'cama', capacidad, estadoBase)
  agregar(cuarto.id, 'colchon', capacidad, estadoColchon)
  agregar(cuarto.id, 'taquilla', capacidad, inhabitable || taquillaDaniada ? 'daniado' : 'bueno')

  if (!inhabitable) {
    agregar(cuarto.id, 'ventilador', 1, ventiladorDaniado ? 'daniado' : 'bueno')
    agregar(cuarto.id, 'lampara', 1, 'bueno')
  }
}
