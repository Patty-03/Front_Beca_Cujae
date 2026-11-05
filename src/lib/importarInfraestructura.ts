import type { EstadoConstructivo } from '@/types/infraestructura'

export interface FilaInfraestructuraImportada {
  edificio: string
  estadoEdificio: string
  escalera: string
  cuarto: string
  capacidad: number
  estadoCuarto: string
}

export interface FilaImportacionInfraestructura {
  fila: number
  datos: FilaInfraestructuraImportada | null
  errores: string[]
}

export interface PrevisualizacionImportacionInfraestructura {
  filas: FilaImportacionInfraestructura[]
  edificiosNuevos: number
  escalerasNuevas: number
  cuartosNuevos: number
}

export const COLUMNAS_INFRAESTRUCTURA = [
  { columna: 'A', encabezado: 'Edificio', requerido: true },
  { columna: 'B', encabezado: 'Estado Edificio', requerido: true },
  { columna: 'C', encabezado: 'Escalera', requerido: true },
  { columna: 'D', encabezado: 'Cuarto', requerido: true },
  { columna: 'E', encabezado: 'Capacidad Cuarto', requerido: true },
  { columna: 'F', encabezado: 'Estado Cuarto', requerido: true },
] as const

export function parsearFilasInfraestructura(
  brutas: unknown[][],
  estadosDisponibles: EstadoConstructivo[],
): PrevisualizacionImportacionInfraestructura {
  const filas: FilaImportacionInfraestructura[] = []
  const estadosMap = new Map(estadosDisponibles.map((e) => [e.nombre.toLowerCase().trim(), e]))

  const edificiosSet = new Set<string>()
  const escalerasSet = new Set<string>()
  let cuartosCount = 0

  const sinEncabezado = brutas.slice(1)

  for (let indice = 0; indice < sinEncabezado.length; indice++) {
    const numeroFila = indice + 2
    const raw = sinEncabezado[indice]
    if (!raw || raw.every((cell) => cell === null || cell === undefined || cell === '')) {
      continue
    }

    const errores: string[] = []
    const edificio = String(raw[0] ?? '').trim()
    const estadoEdificio = String(raw[1] ?? '').trim()
    const escalera = String(raw[2] ?? '').trim()
    const cuarto = String(raw[3] ?? '').trim()
    const capacidadRaw = raw[4]
    const estadoCuarto = String(raw[5] ?? '').trim()

    if (!edificio) errores.push('El edificio es obligatorio.')
    if (!estadoEdificio) errores.push('El estado del edificio es obligatorio.')
    else if (!estadosMap.has(estadoEdificio.toLowerCase())) {
      errores.push(`Estado de edificio desconocido: "${estadoEdificio}".`)
    }

    if (!escalera) errores.push('La escalera es obligatoria.')
    if (!cuarto) errores.push('El cuarto es obligatorio.')

    const capacidad = Number(capacidadRaw)
    if (isNaN(capacidad) || capacidad <= 0 || capacidad > 20) {
      errores.push('La capacidad debe ser un número entero entre 1 y 20.')
    }

    if (!estadoCuarto) errores.push('El estado del cuarto es obligatorio.')
    else if (!estadosMap.has(estadoCuarto.toLowerCase())) {
      errores.push(`Estado de cuarto desconocido: "${estadoCuarto}".`)
    }

    let datos: FilaInfraestructuraImportada | null = null
    if (errores.length === 0) {
      datos = {
        edificio,
        estadoEdificio,
        escalera,
        cuarto,
        capacidad,
        estadoCuarto,
      }
      edificiosSet.add(edificio.toLowerCase())
      escalerasSet.add(`${edificio.toLowerCase()}___${escalera.toLowerCase()}`)
      cuartosCount++
    }

    filas.push({
      fila: numeroFila,
      datos,
      errores,
    })
  }

  return {
    filas,
    edificiosNuevos: edificiosSet.size,
    escalerasNuevas: escalerasSet.size,
    cuartosNuevos: cuartosCount,
  }
}
