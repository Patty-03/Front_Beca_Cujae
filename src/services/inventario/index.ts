import type { ActualizarMedioInput, CrearMedioInput } from '@/types/inventario'
import { modoDemo } from '@/services/auth'
import { demoInventarioRepository } from './demoRepository'
import { HttpInventarioRepository } from './httpRepository'

const repositorio = modoDemo ? demoInventarioRepository : new HttpInventarioRepository()

export const obtenerMediosCuarto = (cuartoId: number) =>
  repositorio.obtenerMediosCuarto(cuartoId)

export const crearMedio = (input: CrearMedioInput) => repositorio.crearMedio(input)

export const actualizarMedio = (id: number, input: ActualizarMedioInput) =>
  repositorio.actualizarMedio(id, input)

export const eliminarMedio = (id: number) => repositorio.eliminarMedio(id)
