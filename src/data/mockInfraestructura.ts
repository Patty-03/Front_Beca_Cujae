import type { EstadoConstructivo } from '@/types/infraestructura'

export interface EdificioRecord {
  id: number
  nombre: string
  estadoConstructivoId: number
}

export interface EscaleraRecord {
  id: number
  nombre: string
  edificioId: number
}

export interface CuartoRecord {
  id: number
  nombre: string
  capacidadMaxima: number
  escaleraId: number
  estadoConstructivoId: number
}

export interface AlojamientoRecord {
  id: number
  cuartoId: number
  estudianteId: number
  desde: string
  hasta?: string
}

export interface EventoAuditoriaRecord {
  id: number
  usuario: string
  servicio: string
  funcionalidad: string
  fecha: string
}

export const estadosConstructivos: EstadoConstructivo[] = [
  { id: 1, nombre: 'Bueno', habitable: true },
  { id: 2, nombre: 'Regular', habitable: true },
  { id: 3, nombre: 'En Reparación', habitable: false },
  { id: 4, nombre: 'Mal Estado', habitable: false },
  { id: 5, nombre: 'Fuera de Servicio', habitable: false },
]

export const edificios: EdificioRecord[] = [
  { id: 1, nombre: 'Edificio A', estadoConstructivoId: 1 },
  { id: 2, nombre: 'Edificio B', estadoConstructivoId: 1 },
  { id: 3, nombre: 'Edificio C', estadoConstructivoId: 1 },
  { id: 4, nombre: 'Edificio D', estadoConstructivoId: 2 },
  { id: 5, nombre: 'Edificio E', estadoConstructivoId: 3 },
  { id: 6, nombre: 'Edificio F', estadoConstructivoId: 1 },
  { id: 7, nombre: 'Edificio G', estadoConstructivoId: 1 },
  { id: 8, nombre: 'Edificio H', estadoConstructivoId: 2 },
]

const nombresEscaleras = [
  'Escalera 1 - Ala Este',
  'Escalera 2 - Ala Central Este',
  'Escalera 3 - Ala Central Oeste',
  'Escalera 4 - Ala Oeste',
]

export const escaleras: EscaleraRecord[] = edificios.flatMap((edificio, edificioIndex) =>
  nombresEscaleras.map((nombre, escaleraIndex) => ({
    id: edificioIndex * nombresEscaleras.length + escaleraIndex + 1,
    nombre,
    edificioId: edificio.id,
  })),
)

const patronEstados = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 4]
const patronOcupacion = [4, 4, 3, 4, 4, 3, 3, 4, 2, 4, 4, 3, 4, 4, 0, 4, 4, 3, 4, 0]
const factoresOcupacion = [1, 0.75, 0.85, 0.6, 0.35, 0.9, 0.65, 0.5]

const fechaRelativa = (meses: number) => {
  const fecha = new Date()
  fecha.setMonth(fecha.getMonth() - meses)
  return fecha.toISOString().slice(0, 10)
}

const fechaIngreso = fechaRelativa(1)
const fechaSalida = fechaRelativa(8)
const fechaEgreso = fechaRelativa(2)

export const cuartos: CuartoRecord[] = []
export const alojamientos: AlojamientoRecord[] = []

let cuartoId = 1
let alojamientoId = 1

for (const escalera of escaleras) {
  const numeroEscalera = (escalera.id - 1) % nombresEscaleras.length + 1
  let creados = 0

  for (let piso = 1; piso <= 4 && creados < 15; piso++) {
    for (let posicion = 1; posicion <= 4 && creados < 15; posicion++) {
      const indice = cuartos.length
      const estadoConstructivoId = patronEstados[indice % patronEstados.length] ?? 1
      const ocupadosBase = patronOcupacion[indice % patronOcupacion.length] ?? 0
      const factorOcupacion = factoresOcupacion[escalera.edificioId - 1] ?? 1
      const ocupados = Math.min(4, Math.round(ocupadosBase * factorOcupacion))
      const nombre = `${numeroEscalera}${piso}0${posicion}`

      cuartos.push({
        id: cuartoId,
        nombre,
        capacidadMaxima: 4,
        escaleraId: escalera.id,
        estadoConstructivoId,
      })

      for (let cama = 0; cama < ocupados; cama++) {
        alojamientos.push({
          id: alojamientoId,
          cuartoId,
          estudianteId: 1000 + cuartoId * 10 + cama,
          desde: fechaIngreso,
        })
        alojamientoId++
      }

      if (ocupados > 0 && cuartoId % 5 === 0) {
        alojamientos.push({
          id: alojamientoId,
          cuartoId,
          estudianteId: 9000 + cuartoId,
          desde: fechaSalida,
          hasta: fechaEgreso,
        })
        alojamientoId++
      }

      cuartoId++
      creados++
    }
  }
}

export const eventosAuditoria: EventoAuditoriaRecord[] = [
  {
    id: 1,
    usuario: 'Ana Rodríguez',
    servicio: 'Infraestructura',
    funcionalidad: 'Actualización del estado del Edificio E',
    fecha: '2026-10-27T09:20:00',
  },
  {
    id: 2,
    usuario: 'Carlos Pérez',
    servicio: 'Infraestructura',
    funcionalidad: 'Alta de cuarto 2404 en Edificio C',
    fecha: '2026-10-26T15:05:00',
  },
  {
    id: 3,
    usuario: 'María Gómez',
    servicio: 'Infraestructura',
    funcionalidad: 'Registro de escalera 4 en Edificio F',
    fecha: '2026-10-26T11:40:00',
  },
  {
    id: 4,
    usuario: 'Luis Fernández',
    servicio: 'Infraestructura',
    funcionalidad: 'Actualización de capacidad del cuarto 1203',
    fecha: '2026-10-25T17:10:00',
  },
  {
    id: 5,
    usuario: 'Ana Rodríguez',
    servicio: 'Infraestructura',
    funcionalidad: 'Alta del Edificio H',
    fecha: '2026-10-24T10:00:00',
  },
  {
    id: 6,
    usuario: 'Carlos Pérez',
    servicio: 'Infraestructura',
    funcionalidad: 'Cambio de estado del cuarto 3302 a En Reparación',
    fecha: '2026-10-23T14:25:00',
  },
  {
    id: 7,
    usuario: 'María Gómez',
    servicio: 'Infraestructura',
    funcionalidad: 'Exportación del censo del Edificio A',
    fecha: '2026-10-22T09:15:00',
  },
  {
    id: 8,
    usuario: 'Luis Fernández',
    servicio: 'Infraestructura',
    funcionalidad: 'Actualización del estado del Edificio D',
    fecha: '2026-10-21T16:45:00',
  },
]
