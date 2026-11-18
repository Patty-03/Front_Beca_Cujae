import type {
  ConfiguracionActualizarInput,
  ConfiguracionCrearInput,
  ConfiguracionLeer,
  GenerarInput,
  HorarioLeer,
  PeriodoActualizarInput,
  PeriodoInput,
  PeriodoLeer,
  PlanCrearInput,
  PlanLeer,
  ResultadoGeneracion,
  TipoDeberLeer,
  UbicacionLeer,
} from '@/types/planificacion'
import type { PlanificacionRepository } from './contracts'

const delay = (ms = 180) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function clonar<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor)) as T
}

const TIPOS: TipoDeberLeer[] = [
  { id: 1, nombre: 'Cocina', activo: true },
  { id: 2, nombre: 'Limpieza', activo: true },
]

const HORARIOS: HorarioLeer[] = [
  { id: 1, inicio: '07:00:00', fin: '09:00:00', activo: true },
  { id: 2, inicio: '18:00:00', fin: '20:00:00', activo: true },
]

const UBICACIONES: UbicacionLeer[] = [
  { id: 1, nombre: 'Comedor', activo: true },
  { id: 2, nombre: 'Cocina piso 1', activo: true },
]

const periodos: PeriodoLeer[] = [
  {
    id: 1,
    inicio: '2026-09-01',
    fin: '2026-12-31',
    estado: 'BORRADOR',
    planes: 1,
    ocurrencias: 0,
    asignaciones: 0,
  },
]

const planes: PlanLeer[] = [
  {
    id: 1,
    periodoPlanificacionId: 1,
    tipoDeberId: 1,
    tipoDeber: 'Cocina',
    conjuntoReglaId: 3,
    conjunto: 'Rotación por año',
    conjuntoVersion: 1,
  },
]

const configuraciones: ConfiguracionLeer[] = [
  {
    id: 1,
    tipoDeberId: 1,
    tipoDeber: 'Cocina',
    nombre: 'Turno de desayuno',
    horarioId: 1,
    conjuntoReglaId: 3,
    modalidad: 'TURNADA',
    cantPersonas: 2,
    puntos: 1,
    frecuencia: 'DIARIA',
    intervalo: 1,
    fechaInicio: '2026-09-01',
    fechaFin: '2026-12-31',
    expandirPor: 'NINGUNO',
    diasSemana: [1, 2, 3, 4, 5, 6, 7],
    esUltima: true,
  },
]

let siguientePeriodoId = 2
let siguientePlanId = 2
let siguienteConfiguracionId = 2

function solicitarPeriodo(id: number): PeriodoLeer {
  const periodo = periodos.find((item) => item.id === id)
  if (!periodo) throw new Error('El período de planificación solicitado no existe.')
  return periodo
}

function solicitarPlan(periodoId: number, planId: number): PlanLeer {
  const plan = planes.find((item) => item.id === planId && item.periodoPlanificacionId === periodoId)
  if (!plan) throw new Error('El plan solicitado no existe.')
  return plan
}

function solicitarConfiguracion(id: number): ConfiguracionLeer {
  const configuracion = configuraciones.find((item) => item.id === id)
  if (!configuracion) throw new Error('La configuración solicitada no existe.')
  return configuracion
}

export async function listarPeriodos(filtros?: { estado?: string }): Promise<PeriodoLeer[]> {
  await delay()
  return periodos
    .filter((periodo) => !filtros?.estado || periodo.estado === filtros.estado)
    .map((periodo) => clonar(periodo))
}

export async function crearPeriodo(input: PeriodoInput): Promise<PeriodoLeer> {
  await delay()
  const periodo: PeriodoLeer = {
    id: siguientePeriodoId++,
    inicio: input.inicio,
    fin: input.fin,
    estado: 'BORRADOR',
    planes: 0,
    ocurrencias: 0,
    asignaciones: 0,
  }
  periodos.push(periodo)
  return clonar(periodo)
}

export async function actualizarPeriodo(
  id: number,
  input: PeriodoActualizarInput,
): Promise<PeriodoLeer> {
  await delay()
  const periodo = solicitarPeriodo(id)
  if (input.inicio != null) periodo.inicio = input.inicio
  if (input.fin != null) periodo.fin = input.fin
  return clonar(periodo)
}

export async function eliminarPeriodo(id: number): Promise<void> {
  await delay()
  const indice = periodos.findIndex((periodo) => periodo.id === id)
  if (indice < 0) throw new Error('El período de planificación solicitado no existe.')
  periodos.splice(indice, 1)
}

export async function publicarPeriodo(id: number): Promise<PeriodoLeer> {
  await delay()
  const periodo = solicitarPeriodo(id)
  periodo.estado = 'PUBLICADO'
  return clonar(periodo)
}

export async function cerrarPeriodo(id: number): Promise<PeriodoLeer> {
  await delay()
  const periodo = solicitarPeriodo(id)
  periodo.estado = 'CERRADO'
  return clonar(periodo)
}

export async function listarPlanes(periodoId: number): Promise<PlanLeer[]> {
  await delay(120)
  solicitarPeriodo(periodoId)
  return planes
    .filter((plan) => plan.periodoPlanificacionId === periodoId)
    .map((plan) => clonar(plan))
}

export async function agregarPlan(
  periodoId: number,
  input: PlanCrearInput,
): Promise<PlanLeer> {
  await delay()
  const periodo = solicitarPeriodo(periodoId)
  const tipo = TIPOS.find((item) => item.id === input.tipoDeberId)
  if (!tipo) throw new Error('El tipo de deber seleccionado no existe.')

  const plan: PlanLeer = {
    id: siguientePlanId++,
    periodoPlanificacionId: periodoId,
    tipoDeberId: input.tipoDeberId,
    tipoDeber: tipo.nombre,
    conjuntoReglaId: input.conjuntoReglaId,
    conjunto: 'Conjunto de reglas',
    conjuntoVersion: 1,
  }
  planes.push(plan)
  periodo.planes = planes.filter(
    (item) => item.periodoPlanificacionId === periodoId,
  ).length
  return clonar(plan)
}

export async function actualizarPlan(
  periodoId: number,
  planId: number,
  input: PlanCrearInput,
): Promise<PlanLeer> {
  await delay()
  const plan = solicitarPlan(periodoId, planId)
  const tipo = TIPOS.find((item) => item.id === input.tipoDeberId)
  plan.tipoDeberId = input.tipoDeberId
  plan.tipoDeber = tipo?.nombre ?? plan.tipoDeber
  plan.conjuntoReglaId = input.conjuntoReglaId
  return clonar(plan)
}

export async function quitarPlan(periodoId: number, planId: number): Promise<void> {
  await delay()
  const periodo = solicitarPeriodo(periodoId)
  const indice = planes.findIndex(
    (plan) => plan.id === planId && plan.periodoPlanificacionId === periodoId,
  )
  if (indice < 0) throw new Error('El plan solicitado no existe.')
  planes.splice(indice, 1)
  periodo.planes = planes.filter(
    (item) => item.periodoPlanificacionId === periodoId,
  ).length
}

export async function generarPlanificacion(
  periodoId: number,
  input?: GenerarInput,
): Promise<ResultadoGeneracion> {
  await delay(700)
  const periodo = solicitarPeriodo(periodoId)
  const desde = input?.desde ?? periodo.inicio
  const hasta = input?.hasta ?? periodo.fin

  const resultado: ResultadoGeneracion = {
    desde,
    hasta,
    ocurrenciasCreadas: 30,
    ocurrenciasExistentes: 0,
    ocurrenciasRetiradas: 0,
    asignacionesCreadas: 60,
    asignacionesConservadas: 0,
    asignacionesRetiradas: 0,
    recuperaciones: 0,
    sinCubrir: [],
    algoritmo: input?.algoritmo ?? 'SECUENCIAL',
    estado: 'OPTIMO',
    tiempoSegundos: 0.48,
  }

  periodo.ocurrencias = resultado.ocurrenciasCreadas
  periodo.asignaciones = resultado.asignacionesCreadas
  return clonar(resultado)
}

export async function listarTiposDeber(): Promise<TipoDeberLeer[]> {
  await delay(80)
  return clonar(TIPOS)
}

export async function listarHorarios(): Promise<HorarioLeer[]> {
  await delay(80)
  return clonar(HORARIOS)
}

export async function listarUbicaciones(): Promise<UbicacionLeer[]> {
  await delay(80)
  return clonar(UBICACIONES)
}

export async function listarConfiguraciones(): Promise<ConfiguracionLeer[]> {
  await delay(120)
  return configuraciones.map((configuracion) => clonar(configuracion))
}

export async function crearConfiguracion(
  input: ConfiguracionCrearInput,
): Promise<ConfiguracionLeer> {
  await delay()
  const tipo = TIPOS.find((item) => item.id === input.tipoDeberId)
  if (!tipo) throw new Error('El tipo de deber seleccionado no existe.')

  const configuracion: ConfiguracionLeer = {
    id: siguienteConfiguracionId++,
    tipoDeberId: input.tipoDeberId,
    tipoDeber: tipo.nombre,
    nombre: input.nombre,
    horarioId: input.horarioId ?? null,
    conjuntoReglaId: input.conjuntoReglaId ?? null,
    modalidad: input.modalidad,
    cantPersonas: input.cantPersonas ?? null,
    puntos: input.puntos ?? 1,
    frecuencia: input.frecuencia,
    intervalo: input.intervalo ?? 1,
    fechaInicio: input.fechaInicio,
    fechaFin: input.fechaFin ?? null,
    expandirPor: input.expandirPor ?? 'NINGUNO',
    diasSemana: input.diasSemana ?? [1, 2, 3, 4, 5, 6, 7],
    esUltima: true,
  }
  configuraciones.push(configuracion)
  return clonar(configuracion)
}

export async function actualizarConfiguracion(
  id: number,
  input: ConfiguracionActualizarInput,
): Promise<ConfiguracionLeer> {
  await delay()
  const configuracion = solicitarConfiguracion(id)

  if (input.tipoDeberId != null) {
    const tipo = TIPOS.find((item) => item.id === input.tipoDeberId)
    configuracion.tipoDeberId = input.tipoDeberId
    configuracion.tipoDeber = tipo?.nombre ?? configuracion.tipoDeber
  }
  if (input.nombre != null) configuracion.nombre = input.nombre
  if ('horarioId' in input) configuracion.horarioId = input.horarioId ?? null
  if ('conjuntoReglaId' in input) {
    configuracion.conjuntoReglaId = input.conjuntoReglaId ?? null
  }
  if (input.modalidad != null) configuracion.modalidad = input.modalidad
  if ('cantPersonas' in input) configuracion.cantPersonas = input.cantPersonas ?? null
  if (input.puntos != null) configuracion.puntos = input.puntos
  if (input.frecuencia != null) configuracion.frecuencia = input.frecuencia
  if (input.intervalo != null) configuracion.intervalo = input.intervalo
  if (input.fechaInicio != null) configuracion.fechaInicio = input.fechaInicio
  if ('fechaFin' in input) configuracion.fechaFin = input.fechaFin ?? null
  if (input.expandirPor != null) configuracion.expandirPor = input.expandirPor
  if (input.diasSemana != null) configuracion.diasSemana = input.diasSemana

  return clonar(configuracion)
}

export async function versionarConfiguracion(id: number): Promise<ConfiguracionLeer> {
  await delay()
  const anterior = solicitarConfiguracion(id)
  anterior.esUltima = false

  const version: ConfiguracionLeer = {
    ...clonar(anterior),
    id: siguienteConfiguracionId++,
    esUltima: true,
  }
  configuraciones.push(version)
  return clonar(version)
}

export async function eliminarConfiguracion(id: number): Promise<void> {
  await delay()
  const indice = configuraciones.findIndex((configuracion) => configuracion.id === id)
  if (indice < 0) throw new Error('La configuración solicitada no existe.')
  configuraciones.splice(indice, 1)
}

export const demoPlanificacionRepository: PlanificacionRepository = {
  listarPeriodos,
  crearPeriodo,
  actualizarPeriodo,
  eliminarPeriodo,
  publicarPeriodo,
  cerrarPeriodo,
  listarPlanes,
  agregarPlan,
  actualizarPlan,
  quitarPlan,
  generarPlanificacion,
  listarTiposDeber,
  listarHorarios,
  listarUbicaciones,
  listarConfiguraciones,
  crearConfiguracion,
  actualizarConfiguracion,
  versionarConfiguracion,
  eliminarConfiguracion,
}
