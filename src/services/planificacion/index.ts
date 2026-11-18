import type {
  ConfiguracionActualizarInput,
  ConfiguracionCrearInput,
  GenerarInput,
  PeriodoActualizarInput,
  PeriodoInput,
  PlanCrearInput,
} from '@/types/planificacion'
import { modoDemo } from '@/services/auth'
import { demoPlanificacionRepository } from './demoRepository'
import { HttpPlanificacionRepository } from './httpRepository'

const repositorio = modoDemo
  ? demoPlanificacionRepository
  : new HttpPlanificacionRepository()

export const listarPeriodos = (filtros?: { estado?: string }) =>
  repositorio.listarPeriodos(filtros)
export const crearPeriodo = (input: PeriodoInput) => repositorio.crearPeriodo(input)
export const actualizarPeriodo = (id: number, input: PeriodoActualizarInput) =>
  repositorio.actualizarPeriodo(id, input)
export const eliminarPeriodo = (id: number) => repositorio.eliminarPeriodo(id)
export const publicarPeriodo = (id: number) => repositorio.publicarPeriodo(id)
export const cerrarPeriodo = (id: number) => repositorio.cerrarPeriodo(id)

export const listarPlanes = (periodoId: number) => repositorio.listarPlanes(periodoId)
export const agregarPlan = (periodoId: number, input: PlanCrearInput) =>
  repositorio.agregarPlan(periodoId, input)
export const actualizarPlan = (periodoId: number, planId: number, input: PlanCrearInput) =>
  repositorio.actualizarPlan(periodoId, planId, input)
export const quitarPlan = (periodoId: number, planId: number) =>
  repositorio.quitarPlan(periodoId, planId)

export const generarPlanificacion = (periodoId: number, input?: GenerarInput) =>
  repositorio.generarPlanificacion(periodoId, input)

export const listarTiposDeber = () => repositorio.listarTiposDeber()
export const listarHorarios = () => repositorio.listarHorarios()
export const listarUbicaciones = () => repositorio.listarUbicaciones()

export const listarConfiguraciones = () => repositorio.listarConfiguraciones()
export const crearConfiguracion = (input: ConfiguracionCrearInput) =>
  repositorio.crearConfiguracion(input)
export const actualizarConfiguracion = (
  id: number,
  input: ConfiguracionActualizarInput,
) => repositorio.actualizarConfiguracion(id, input)
export const versionarConfiguracion = (id: number) => repositorio.versionarConfiguracion(id)
export const eliminarConfiguracion = (id: number) => repositorio.eliminarConfiguracion(id)
