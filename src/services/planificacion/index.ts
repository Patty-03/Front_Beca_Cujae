import type {
  AsignacionActualizarInput,
  AsignacionCrearInput,
  AsignacionFiltros,
  CancelarInput,
  ConfiguracionActualizarInput,
  ConfiguracionCrearInput,
  ConfiguracionFiltros,
  CumplimientoInput,
  DeudaFiltros,
  DiaSinDeberesActualizarInput,
  DiaSinDeberesCrearInput,
  DiaSinDeberesFiltros,
  ExencionActualizarInput,
  ExencionCrearInput,
  ExencionFiltros,
  GenerarInput,
  HorarioActualizarInput,
  HorarioCrearInput,
  OcurrenciaFiltros,
  PeriodoActualizarInput,
  PeriodoInput,
  PlanActualizarInput,
  PlanCrearInput,
  RecuperacionInput,
  TipoDeberActualizarInput,
  TipoDeberCrearInput,
  UbicacionActualizarInput,
  UbicacionCrearInput,
} from '@/types/planificacion'
import { modoDemo } from '@/services/auth'
import { demoPlanificacionRepository } from './demoRepository'
import { HttpPlanificacionRepository } from './httpRepository'

const repositorio = modoDemo
  ? demoPlanificacionRepository
  : new HttpPlanificacionRepository()

export const listarPeriodos = (filtros?: { estado?: string }) =>
  repositorio.listarPeriodos(filtros)
export const leerPeriodo = (id: number) => repositorio.leerPeriodo(id)
export const crearPeriodo = (input: PeriodoInput) => repositorio.crearPeriodo(input)
export const actualizarPeriodo = (id: number, input: PeriodoActualizarInput) =>
  repositorio.actualizarPeriodo(id, input)
export const eliminarPeriodo = (id: number) => repositorio.eliminarPeriodo(id)
export const publicarPeriodo = (id: number) => repositorio.publicarPeriodo(id)
export const cerrarPeriodo = (id: number) => repositorio.cerrarPeriodo(id)

export const listarPlanes = (periodoId: number) => repositorio.listarPlanes(periodoId)
export const agregarPlan = (periodoId: number, input: PlanCrearInput) =>
  repositorio.agregarPlan(periodoId, input)
export const actualizarPlan = (
  periodoId: number,
  planId: number,
  input: PlanActualizarInput,
) => repositorio.actualizarPlan(periodoId, planId, input)
export const quitarPlan = (periodoId: number, planId: number) =>
  repositorio.quitarPlan(periodoId, planId)

export const generarPlanificacion = (periodoId: number, input?: GenerarInput) =>
  repositorio.generarPlanificacion(periodoId, input)

export const listarTiposDeber = (activo?: boolean) =>
  repositorio.listarTiposDeber(activo)
export const crearTipoDeber = (input: TipoDeberCrearInput) =>
  repositorio.crearTipoDeber(input)
export const actualizarTipoDeber = (id: number, input: TipoDeberActualizarInput) =>
  repositorio.actualizarTipoDeber(id, input)

export const listarHorarios = (activo?: boolean) => repositorio.listarHorarios(activo)
export const crearHorario = (input: HorarioCrearInput) => repositorio.crearHorario(input)
export const actualizarHorario = (id: number, input: HorarioActualizarInput) =>
  repositorio.actualizarHorario(id, input)

export const listarUbicaciones = (activo?: boolean) =>
  repositorio.listarUbicaciones(activo)
export const crearUbicacion = (input: UbicacionCrearInput) =>
  repositorio.crearUbicacion(input)
export const actualizarUbicacion = (id: number, input: UbicacionActualizarInput) =>
  repositorio.actualizarUbicacion(id, input)

export const listarConfiguraciones = (filtros?: ConfiguracionFiltros) =>
  repositorio.listarConfiguraciones(filtros)
export const crearConfiguracion = (input: ConfiguracionCrearInput) =>
  repositorio.crearConfiguracion(input)
export const actualizarConfiguracion = (
  id: number,
  input: ConfiguracionActualizarInput,
) => repositorio.actualizarConfiguracion(id, input)
export const versionarConfiguracion = (
  id: number,
  input?: ConfiguracionActualizarInput,
) => repositorio.versionarConfiguracion(id, input)
export const eliminarConfiguracion = (id: number) =>
  repositorio.eliminarConfiguracion(id)

export const listarDiasSinDeberes = (filtros?: DiaSinDeberesFiltros) =>
  repositorio.listarDiasSinDeberes(filtros)
export const crearDiaSinDeberes = (input: DiaSinDeberesCrearInput) =>
  repositorio.crearDiaSinDeberes(input)
export const actualizarDiaSinDeberes = (
  id: number,
  input: DiaSinDeberesActualizarInput,
) => repositorio.actualizarDiaSinDeberes(id, input)
export const eliminarDiaSinDeberes = (id: number) =>
  repositorio.eliminarDiaSinDeberes(id)

export const listarExenciones = (filtros?: ExencionFiltros) =>
  repositorio.listarExenciones(filtros)
export const crearExencion = (input: ExencionCrearInput) =>
  repositorio.crearExencion(input)
export const actualizarExencion = (id: number, input: ExencionActualizarInput) =>
  repositorio.actualizarExencion(id, input)
export const eliminarExencion = (id: number) => repositorio.eliminarExencion(id)

export const listarOcurrencias = (filtros?: OcurrenciaFiltros) =>
  repositorio.listarOcurrencias(filtros)
export const leerOcurrencia = (id: number) => repositorio.leerOcurrencia(id)
export const cancelarOcurrencia = (id: number, input: CancelarInput) =>
  repositorio.cancelarOcurrencia(id, input)
export const reactivarOcurrencia = (id: number) => repositorio.reactivarOcurrencia(id)
export const asignarManual = (ocurrenciaId: number, input: AsignacionCrearInput) =>
  repositorio.asignarManual(ocurrenciaId, input)

export const listarAsignaciones = (filtros?: AsignacionFiltros) =>
  repositorio.listarAsignaciones(filtros)
export const actualizarAsignacion = (
  id: number,
  input: AsignacionActualizarInput,
) => repositorio.actualizarAsignacion(id, input)
export const quitarAsignacion = (id: number) => repositorio.quitarAsignacion(id)
export const registrarCumplimiento = (input: CumplimientoInput) =>
  repositorio.registrarCumplimiento(input)
export const recuperar = (asignacionId: number, input: RecuperacionInput) =>
  repositorio.recuperar(asignacionId, input)
export const listarDeudas = (filtros?: DeudaFiltros) =>
  repositorio.listarDeudas(filtros)
