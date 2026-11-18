import type {
  AmbitoRegla,
  CondicionInput,
  ConjuntoCrearInput,
  ConjuntoVersionInput,
  PrioridadInput,
} from '@/types/reglas'
import { modoDemo } from '@/services/auth'
import { demoReglasRepository } from './demoRepository'
import { HttpReglasRepository } from './httpRepository'

const repositorio = modoDemo ? demoReglasRepository : new HttpReglasRepository()

export const listarConjuntos = (filtros?: {
  ambito?: AmbitoRegla
  vigente?: boolean
  nombre?: string
}) => repositorio.listarConjuntos(filtros)
export const obtenerConjunto = (id: number) => repositorio.obtenerConjunto(id)
export const crearConjunto = (input: ConjuntoCrearInput) => repositorio.crearConjunto(input)
export const crearVersionConjunto = (id: number, input: ConjuntoVersionInput) =>
  repositorio.crearVersionConjunto(id, input)
export const eliminarConjunto = (id: number) => repositorio.eliminarConjunto(id)

export const agregarCondicion = (conjuntoId: number, input: CondicionInput) =>
  repositorio.agregarCondicion(conjuntoId, input)
export const actualizarCondicion = (
  conjuntoId: number,
  condicionId: number,
  input: Partial<CondicionInput>,
) => repositorio.actualizarCondicion(conjuntoId, condicionId, input)
export const quitarCondicion = (conjuntoId: number, condicionId: number) =>
  repositorio.quitarCondicion(conjuntoId, condicionId)

export const agregarPrioridad = (conjuntoId: number, input: PrioridadInput) =>
  repositorio.agregarPrioridad(conjuntoId, input)
export const actualizarPrioridad = (
  conjuntoId: number,
  prioridadId: number,
  input: Partial<PrioridadInput>,
) => repositorio.actualizarPrioridad(conjuntoId, prioridadId, input)
export const quitarPrioridad = (conjuntoId: number, prioridadId: number) =>
  repositorio.quitarPrioridad(conjuntoId, prioridadId)

export const obtenerAtributosRegla = (ambito: AmbitoRegla) =>
  repositorio.obtenerAtributosRegla(ambito)
export const obtenerOperadoresRegla = () => repositorio.obtenerOperadoresRegla()
