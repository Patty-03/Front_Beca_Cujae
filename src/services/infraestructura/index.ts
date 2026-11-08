import type {
  ActualizarCuartoInput,
  ActualizarEdificioInput,
  ActualizarEscaleraInput,
  CrearCuartoInput,
  CrearEdificioInput,
  CrearEscaleraInput,
} from '@/types/infraestructura'
import { modoDemo } from '@/services/auth'
import { demoInfraestructuraRepository } from './demoRepository'
import { HttpInfraestructuraRepository } from './httpRepository'

const repositorio = modoDemo
  ? demoInfraestructuraRepository
  : new HttpInfraestructuraRepository()

export const obtenerEstadosConstructivos = () => repositorio.obtenerEstadosConstructivos()
export const obtenerResumen = () => repositorio.obtenerResumen()
export const obtenerEdificios = () => repositorio.obtenerEdificios()
export const obtenerEdificio = (id: number) => repositorio.obtenerEdificio(id)

export const crearEdificio = (input: CrearEdificioInput) => repositorio.crearEdificio(input)
export const actualizarEdificio = (id: number, input: ActualizarEdificioInput) =>
  repositorio.actualizarEdificio(id, input)
export const eliminarEdificio = (id: number) => repositorio.eliminarEdificio(id)

export const crearEscalera = (edificioId: number, input: CrearEscaleraInput) =>
  repositorio.crearEscalera(edificioId, input)
export const actualizarEscalera = (id: number, input: ActualizarEscaleraInput) =>
  repositorio.actualizarEscalera(id, input)
export const eliminarEscalera = (id: number) => repositorio.eliminarEscalera(id)

export const crearCuarto = (escaleraId: number, input: CrearCuartoInput) =>
  repositorio.crearCuarto(escaleraId, input)
export const actualizarCuarto = (id: number, input: ActualizarCuartoInput) =>
  repositorio.actualizarCuarto(id, input)
export const eliminarCuarto = (id: number) => repositorio.eliminarCuarto(id)

export const exportarReporteGeneral = () => repositorio.exportarReporteGeneral()
export const exportarCenso = (edificioId: number) => repositorio.exportarCenso(edificioId)
