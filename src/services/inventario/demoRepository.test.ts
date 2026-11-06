import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cuartos } from '@/data/mockInfraestructura'
import { medios, type MedioRecord } from '@/data/mockInventario'
import {
  actualizarMedio,
  crearMedio,
  eliminarMedio,
  obtenerMediosCuarto,
} from './demoRepository'

beforeEach(() => {
  setActivePinia(createPinia())
})

let snapshot: MedioRecord[]

beforeEach(() => {
  snapshot = medios.map((medio) => ({ ...medio }))
})

afterEach(() => {
  medios.splice(0, medios.length, ...snapshot)
})

const idPrimerCuarto = (): number => {
  const cuarto = cuartos[0]
  if (!cuarto) throw new Error('No hay cuartos presembrados en los datos demo.')
  return cuarto.id
}

describe('obtenerMediosCuarto', () => {
  it('devuelve los medios presembrados del cuarto', async () => {
    const cuartoId = idPrimerCuarto()
    const resultado = await obtenerMediosCuarto(cuartoId)

    expect(resultado.length).toBeGreaterThan(0)
    expect(resultado.every((medio) => medio.cuartoId === cuartoId)).toBe(true)
    const camas = resultado.filter((medio) => medio.tipo === 'cama')
    expect(camas).toHaveLength(1)
    expect(camas[0]?.cantidad).toBeGreaterThan(0)
  })

  it('rechaza cuartos inexistentes', async () => {
    await expect(obtenerMediosCuarto(999999)).rejects.toThrow('El cuarto solicitado no existe.')
  })
})

describe('crearMedio', () => {
  it('acumula la cantidad cuando existe el mismo tipo y estado', async () => {
    const cuartoId = idPrimerCuarto()
    const base = await obtenerMediosCuarto(cuartoId)
    const referencia = base.find((medio) => medio.tipo === 'taquilla' && medio.estado === 'bueno')
    expect(referencia).toBeTruthy()

    await crearMedio({ cuartoId, tipo: 'taquilla', cantidad: 3, estado: 'bueno' })

    const mediosActuales = await obtenerMediosCuarto(cuartoId)
    const actualizado = mediosActuales.find(
      (medio) => medio.tipo === 'taquilla' && medio.estado === 'bueno',
    )
    expect(actualizado?.cantidad).toBe((referencia?.cantidad ?? 0) + 3)
    expect(
      mediosActuales.filter((medio) => medio.tipo === 'taquilla' && medio.estado === 'bueno'),
    ).toHaveLength(1)
  })

  it('crea un registro nuevo para un tipo distinto y se puede eliminar', async () => {
    const cuartoId = idPrimerCuarto()

    const creado = await crearMedio({
      cuartoId,
      tipo: 'escritorio',
      cantidad: 2,
      estado: 'bueno',
      observaciones: 'Prueba',
    })

    expect(creado.tipo).toBe('escritorio')
    expect(creado.cantidad).toBe(2)
    expect(creado.observaciones).toBe('Prueba')

    expect(await obtenerMediosCuarto(cuartoId)).toContainEqual(
      expect.objectContaining({ id: creado.id, tipo: 'escritorio' }),
    )

    await eliminarMedio(creado.id)

    expect(await obtenerMediosCuarto(cuartoId)).not.toContainEqual(
      expect.objectContaining({ id: creado.id }),
    )
  })

  it('valida cantidad y tipo', async () => {
    const cuartoId = idPrimerCuarto()

    await expect(
      crearMedio({ cuartoId, tipo: 'cama', cantidad: 0, estado: 'bueno' }),
    ).rejects.toThrow('cantidad')

    await expect(
      crearMedio({ cuartoId, tipo: 'desconocido' as never, cantidad: 1, estado: 'bueno' }),
    ).rejects.toThrow('tipo de medio')
  })
})

describe('actualizarMedio', () => {
  it('edita cantidad, estado y observaciones', async () => {
    const cuartoId = idPrimerCuarto()
    const creado = await crearMedio({ cuartoId, tipo: 'silla', cantidad: 4, estado: 'bueno' })

    const actualizado = await actualizarMedio(creado.id, {
      tipo: 'silla',
      cantidad: 6,
      estado: 'daniado',
      observaciones: 'Dos sillas rotas',
    })

    expect(actualizado.cantidad).toBe(6)
    expect(actualizado.estado).toBe('daniado')
    expect(actualizado.observaciones).toBe('Dos sillas rotas')

    const listado = await obtenerMediosCuarto(cuartoId)
    expect(listado.find((medio) => medio.id === creado.id)?.estado).toBe('daniado')
  })

  it('rechaza medios inexistentes', async () => {
    await expect(
      actualizarMedio(999999, { tipo: 'cama', cantidad: 1, estado: 'bueno' }),
    ).rejects.toThrow('El medio solicitado no existe.')
  })
})
