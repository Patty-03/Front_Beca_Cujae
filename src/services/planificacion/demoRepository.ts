import type {
  AsignacionActualizarInput,
  AsignacionCrearInput,
  AsignacionFiltros,
  AsignacionLeer,
  CancelarInput,
  ConfiguracionActualizarInput,
  ConfiguracionCrearInput,
  ConfiguracionFiltros,
  ConfiguracionLeer,
  CumplimientoInput,
  DeudaFiltros,
  DiaSinDeberesActualizarInput,
  DiaSinDeberesCrearInput,
  DiaSinDeberesFiltros,
  DiaSinDeberesLeer,
  ExencionActualizarInput,
  ExencionCrearInput,
  ExencionFiltros,
  ExencionLeer,
  GenerarInput,
  HorarioActualizarInput,
  HorarioCrearInput,
  HorarioLeer,
  OcurrenciaFiltros,
  OcurrenciaLeer,
  PeriodoActualizarInput,
  PeriodoInput,
  PeriodoLeer,
  PlanActualizarInput,
  PlanCrearInput,
  PlanLeer,
  RecuperacionInput,
  ResultadoCumplimiento,
  ResultadoGeneracion,
  TipoDeberActualizarInput,
  TipoDeberCrearInput,
  TipoDeberLeer,
  UbicacionActualizarInput,
  UbicacionCrearInput,
  UbicacionLeer,
} from '@/types/planificacion'
import { hoyIso, maxFecha, parseFecha, sumarDias } from '@/lib/planificacion'
import type { PlanificacionRepository } from './contracts'

const delay = (ms = 180) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function clonar<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor)) as T
}

const ESTUDIANTES: Record<number, string> = {
  1: 'Ana Pérez',
  2: 'Luis Gómez',
  3: 'Marta Ruiz',
}

const TIPOS: TipoDeberLeer[] = [
  { id: 1, nombre: 'Cocina', activo: true },
  { id: 2, nombre: 'Limpieza', activo: true },
  { id: 3, nombre: 'Comedor', activo: false },
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
    ocurrencias: 4,
    asignaciones: 4,
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
    horario: '07:00 - 09:00',
    conjuntoReglaId: 3,
    conjunto: 'Rotación por año',
    modalidad: 'TURNADA',
    cantPersonas: 2,
    puntos: 1,
    frecuencia: 'DIARIA',
    intervalo: 1,
    fechaInicio: '2026-09-01',
    fechaFin: '2026-12-31',
    expandirPor: 'NINGUNO',
    diasSemana: [1, 2, 3, 4, 5, 6, 7],
    versionAnteriorId: null,
    vigente: true,
    esUltima: true,
    enUso: true,
  },
]

const diasSinDeberes: DiaSinDeberesLeer[] = []

const exenciones: ExencionLeer[] = [
  {
    id: 1,
    estudianteId: 2,
    estudiante: 'Luis Gómez',
    tipoDeberId: 2,
    tipoDeber: 'Limpieza',
    desde: '2026-11-15',
    hasta: '2026-11-30',
    motivo: 'Lesión',
    vigente: true,
  },
]

const ocurrencias: OcurrenciaLeer[] = [
  {
    id: 1,
    fecha: '2026-11-18',
    cancelada: false,
    motivoCancelacion: null,
    configuracionDeberId: 1,
    configuracion: 'Turno de desayuno',
    tipoDeberId: 1,
    tipoDeber: 'Cocina',
    horario: '07:00 - 09:00',
    modalidad: 'TURNADA',
    cantPersonas: 2,
    periodoPlanificacionId: 1,
    lugarNivel: null,
    lugarId: 1,
    lugar: 'Comedor',
    asignados: 2,
  },
  {
    id: 2,
    fecha: '2026-11-19',
    cancelada: false,
    motivoCancelacion: null,
    configuracionDeberId: 1,
    configuracion: 'Turno de desayuno',
    tipoDeberId: 1,
    tipoDeber: 'Cocina',
    horario: '07:00 - 09:00',
    modalidad: 'TURNADA',
    cantPersonas: 2,
    periodoPlanificacionId: 1,
    lugarNivel: null,
    lugarId: 1,
    lugar: 'Comedor',
    asignados: 1,
  },
  {
    id: 3,
    fecha: '2026-11-20',
    cancelada: false,
    motivoCancelacion: null,
    configuracionDeberId: 1,
    configuracion: 'Turno de desayuno',
    tipoDeberId: 1,
    tipoDeber: 'Cocina',
    horario: '07:00 - 09:00',
    modalidad: 'TURNADA',
    cantPersonas: 1,
    periodoPlanificacionId: 1,
    lugarNivel: null,
    lugarId: 2,
    lugar: 'Cocina piso 1',
    asignados: 1,
  },
  {
    id: 4,
    fecha: '2026-11-21',
    cancelada: true,
    motivoCancelacion: 'Feriado',
    configuracionDeberId: 1,
    configuracion: 'Turno de desayuno',
    tipoDeberId: 1,
    tipoDeber: 'Cocina',
    horario: '07:00 - 09:00',
    modalidad: 'TURNADA',
    cantPersonas: 2,
    periodoPlanificacionId: 1,
    lugarNivel: null,
    lugarId: 1,
    lugar: 'Comedor',
    asignados: 0,
  },
]

const asignaciones: AsignacionLeer[] = [
  {
    id: 1,
    estudianteId: 1,
    estudiante: 'Ana Pérez',
    ocurrenciaDeberId: 1,
    fecha: '2026-11-18',
    configuracion: 'Turno de desayuno',
    tipoDeberId: 1,
    tipoDeber: 'Cocina',
    horario: '07:00 - 09:00',
    lugar: 'Comedor',
    estado: 'PLANIFICADA',
    puntosCarga: 1,
    bloqueada: true,
    asignacionOrigenId: null,
    cancelada: false,
  },
  {
    id: 2,
    estudianteId: 2,
    estudiante: 'Luis Gómez',
    ocurrenciaDeberId: 1,
    fecha: '2026-11-18',
    configuracion: 'Turno de desayuno',
    tipoDeberId: 1,
    tipoDeber: 'Cocina',
    horario: '07:00 - 09:00',
    lugar: 'Comedor',
    estado: 'INCUMPLIDA',
    puntosCarga: 1,
    bloqueada: false,
    asignacionOrigenId: null,
    cancelada: false,
  },
  {
    id: 3,
    estudianteId: 3,
    estudiante: 'Marta Ruiz',
    ocurrenciaDeberId: 2,
    fecha: '2026-11-19',
    configuracion: 'Turno de desayuno',
    tipoDeberId: 1,
    tipoDeber: 'Cocina',
    horario: '07:00 - 09:00',
    lugar: 'Comedor',
    estado: 'PLANIFICADA',
    puntosCarga: 1,
    bloqueada: true,
    asignacionOrigenId: null,
    cancelada: false,
  },
  {
    id: 4,
    estudianteId: 1,
    estudiante: 'Ana Pérez',
    ocurrenciaDeberId: 3,
    fecha: '2026-11-20',
    configuracion: 'Turno de desayuno',
    tipoDeberId: 1,
    tipoDeber: 'Cocina',
    horario: '07:00 - 09:00',
    lugar: 'Cocina piso 1',
    estado: 'CUMPLIDA',
    puntosCarga: 1,
    bloqueada: false,
    asignacionOrigenId: null,
    cancelada: false,
  },
]

let siguientePeriodoId = 2
let siguientePlanId = 2
let siguienteConfiguracionId = 2
let siguienteDiaId = 1
let siguienteExencionId = 2
let siguienteOcurrenciaId = 5
let siguienteAsignacionId = 5

function solicitarPeriodo(id: number): PeriodoLeer {
  const periodo = periodos.find((item) => item.id === id)
  if (!periodo) throw new Error('El período de planificación solicitado no existe.')
  return periodo
}

function solicitarPlan(periodoId: number, planId: number): PlanLeer {
  const plan = planes.find(
    (item) => item.id === planId && item.periodoPlanificacionId === periodoId,
  )
  if (!plan) throw new Error('El plan solicitado no existe.')
  return plan
}

function solicitarConfiguracion(id: number): ConfiguracionLeer {
  const configuracion = configuraciones.find((item) => item.id === id)
  if (!configuracion) throw new Error('La configuración solicitada no existe.')
  return configuracion
}

function solicitarOcurrencia(id: number): OcurrenciaLeer {
  const ocurrencia = ocurrencias.find((item) => item.id === id)
  if (!ocurrencia) throw new Error('La ocurrencia solicitada no existe.')
  return ocurrencia
}

function solicitarAsignacion(id: number): AsignacionLeer {
  const asignacion = asignaciones.find((item) => item.id === id)
  if (!asignacion) throw new Error('La asignación solicitada no existe.')
  return asignacion
}

function solicitarDia(id: number): DiaSinDeberesLeer {
  const dia = diasSinDeberes.find((item) => item.id === id)
  if (!dia) throw new Error('El día sin deberes solicitado no existe.')
  return dia
}

function solicitarExencion(id: number): ExencionLeer {
  const exencion = exenciones.find((item) => item.id === id)
  if (!exencion) throw new Error('La exención solicitada no existe.')
  return exencion
}

function nombreTipo(id: number): string {
  return TIPOS.find((item) => item.id === id)?.nombre ?? `Tipo ${id}`
}

function nombreHorario(id: number | null): string | null {
  const horario = HORARIOS.find((item) => item.id === id)
  return horario ? `${horario.inicio.slice(0, 5)} - ${horario.fin.slice(0, 5)}` : null
}

function nombreConjunto(id: number | null): string | null {
  return id == null ? null : `Conjunto de reglas #${id}`
}

function sincronizarOcurrencia(id: number) {
  const ocurrencia = solicitarOcurrencia(id)
  ocurrencia.asignados = asignaciones.filter(
    (item) => item.ocurrenciaDeberId === id && !item.cancelada,
  ).length
}

function sincronizarPeriodo(id: number) {
  const periodo = solicitarPeriodo(id)
  periodo.planes = planes.filter((item) => item.periodoPlanificacionId === id).length
  periodo.ocurrencias = ocurrencias.filter(
    (item) => item.periodoPlanificacionId === id,
  ).length
  const ids = new Set(
    ocurrencias.filter((item) => item.periodoPlanificacionId === id).map((item) => item.id),
  )
  periodo.asignaciones = asignaciones.filter((item) => ids.has(item.ocurrenciaDeberId)).length
}

function estaVigente(desde: string, hasta: string | null): boolean {
  const hoy = hoyIso()
  return desde <= hoy && (hasta === null || hasta >= hoy)
}

function rangoDias(desde: string, hasta: string, maximo = 31): string[] {
  const dias: string[] = []
  let actual = desde
  while (actual <= hasta && dias.length < maximo) {
    dias.push(actual)
    actual = sumarDias(actual, 1)
  }
  return dias
}

function aplicaFrecuencia(configuracion: ConfiguracionLeer, fecha: string): boolean {
  if (configuracion.frecuencia === 'UNICA') return fecha === configuracion.fechaInicio
  const inicio = parseFecha(configuracion.fechaInicio)
  const actual = parseFecha(fecha)
  const dias = Math.round((actual.getTime() - inicio.getTime()) / 86400000)
  if (dias < 0) return false
  if (configuracion.frecuencia === 'DIARIA') return dias % configuracion.intervalo === 0
  if (configuracion.frecuencia === 'SEMANAL') {
    return configuracion.diasSemana.includes(actual.getDay() === 0 ? 7 : actual.getDay())
  }
  if (configuracion.frecuencia === 'MENSUAL') {
    return actual.getDate() === inicio.getDate() && dias % (30 * configuracion.intervalo) === 0
  }
  return (
    actual.getDate() === inicio.getDate() &&
    actual.getMonth() === inicio.getMonth() &&
    dias % (365 * configuracion.intervalo) === 0
  )
}

export async function listarPeriodos(filtros?: { estado?: string }): Promise<PeriodoLeer[]> {
  await delay()
  return periodos
    .filter((periodo) => !filtros?.estado || periodo.estado === filtros.estado)
    .map((periodo) => clonar(periodo))
}

export async function leerPeriodo(id: number): Promise<PeriodoLeer> {
  await delay(100)
  return clonar(solicitarPeriodo(id))
}

export async function crearPeriodo(input: PeriodoInput): Promise<PeriodoLeer> {
  await delay()
  if (input.fin < input.inicio) throw new Error('La fecha fin no puede ser anterior al inicio.')
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
  if (periodo.estado !== 'BORRADOR') {
    throw new Error('Solo se puede editar un período en BORRADOR.')
  }
  if (input.inicio != null) periodo.inicio = input.inicio
  if (input.fin != null) periodo.fin = input.fin
  if (periodo.fin < periodo.inicio) {
    throw new Error('La fecha fin no puede ser anterior al inicio.')
  }
  return clonar(periodo)
}

export async function eliminarPeriodo(id: number): Promise<void> {
  await delay()
  const periodo = solicitarPeriodo(id)
  if (periodo.estado !== 'BORRADOR') throw new Error('Solo se elimina un período en BORRADOR.')
  if (periodo.ocurrencias > 0) {
    throw new Error('El período ya tiene ocurrencias generadas: no se puede eliminar.')
  }
  const indice = periodos.findIndex((item) => item.id === id)
  periodos.splice(indice, 1)
  for (let i = planes.length - 1; i >= 0; i -= 1) {
    if (planes[i]?.periodoPlanificacionId === id) planes.splice(i, 1)
  }
}

export async function publicarPeriodo(id: number): Promise<PeriodoLeer> {
  await delay()
  const periodo = solicitarPeriodo(id)
  if (periodo.estado !== 'BORRADOR') throw new Error('Solo se publica un período en BORRADOR.')
  if (periodo.planes === 0) throw new Error('Un período sin planes no se publica.')
  periodo.estado = 'PUBLICADO'
  return clonar(periodo)
}

export async function cerrarPeriodo(id: number): Promise<PeriodoLeer> {
  await delay()
  const periodo = solicitarPeriodo(id)
  if (periodo.estado !== 'PUBLICADO') throw new Error('Solo se cierra un período PUBLICADO.')
  const hoy = hoyIso()
  const ids = new Set(
    ocurrencias.filter((item) => item.periodoPlanificacionId === id).map((item) => item.id),
  )
  const pendientes = asignaciones.filter(
    (item) =>
      ids.has(item.ocurrenciaDeberId) && item.estado === 'PLANIFICADA' && item.fecha < hoy,
  ).length
  if (pendientes > 0) {
    throw new Error(
      `Faltan ${pendientes} deberes pasados por marcar como cumplidos, incumplidos o justificados.`,
    )
  }
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
  if (periodo.estado === 'CERRADO') throw new Error('El período está cerrado.')
  if (!TIPOS.some((item) => item.id === input.tipoDeberId)) {
    throw new Error('El tipo de deber seleccionado no existe.')
  }
  if (
    planes.some(
      (item) =>
        item.periodoPlanificacionId === periodoId &&
        item.tipoDeberId === input.tipoDeberId,
    )
  ) {
    throw new Error('Ese tipo de deber ya tiene un plan en el período.')
  }
  const plan: PlanLeer = {
    id: siguientePlanId++,
    periodoPlanificacionId: periodoId,
    tipoDeberId: input.tipoDeberId,
    tipoDeber: nombreTipo(input.tipoDeberId),
    conjuntoReglaId: input.conjuntoReglaId,
    conjunto: nombreConjunto(input.conjuntoReglaId) ?? 'Conjunto de reglas',
    conjuntoVersion: 1,
  }
  planes.push(plan)
  sincronizarPeriodo(periodoId)
  return clonar(plan)
}

export async function actualizarPlan(
  periodoId: number,
  planId: number,
  input: PlanActualizarInput,
): Promise<PlanLeer> {
  await delay()
  const periodo = solicitarPeriodo(periodoId)
  if (periodo.estado === 'CERRADO') throw new Error('El período está cerrado.')
  const plan = solicitarPlan(periodoId, planId)
  plan.conjuntoReglaId = input.conjuntoReglaId
  plan.conjunto = nombreConjunto(input.conjuntoReglaId) ?? 'Conjunto de reglas'
  return clonar(plan)
}

export async function quitarPlan(periodoId: number, planId: number): Promise<void> {
  await delay()
  const periodo = solicitarPeriodo(periodoId)
  if (periodo.estado === 'CERRADO') throw new Error('El período está cerrado.')
  const indice = planes.findIndex(
    (plan) => plan.id === planId && plan.periodoPlanificacionId === periodoId,
  )
  if (indice < 0) throw new Error('El plan solicitado no existe.')
  planes.splice(indice, 1)
  sincronizarPeriodo(periodoId)
}

function estaExento(estudianteId: number, tipoDeberId: number, fecha: string): boolean {
  return exenciones.some(
    (exencion) =>
      exencion.estudianteId === estudianteId &&
      (exencion.tipoDeberId === null || exencion.tipoDeberId === tipoDeberId) &&
      exencion.desde <= fecha &&
      (exencion.hasta === null || exencion.hasta >= fecha),
  )
}

function estudiantesElegibles(tipoDeberId: number, fecha: string): number[] {
  return Object.keys(ESTUDIANTES)
    .map(Number)
    .filter((id) => !estaExento(id, tipoDeberId, fecha))
    .sort((a, b) => a - b)
}

function cargaEstudiante(estudianteId: number, tipoDeberId: number): number {
  return asignaciones.filter(
    (asignacion) =>
      asignacion.estudianteId === estudianteId &&
      asignacion.tipoDeberId === tipoDeberId &&
      !asignacion.cancelada,
  ).length
}

function tieneDeberEseDia(
  estudianteId: number,
  fecha: string,
  ocurrenciaId: number,
): boolean {
  return asignaciones.some(
    (asignacion) =>
      asignacion.estudianteId === estudianteId &&
      asignacion.fecha === fecha &&
      !asignacion.cancelada &&
      asignacion.ocurrenciaDeberId !== ocurrenciaId,
  )
}

function crearAsignacionGenerada(
  ocurrencia: OcurrenciaLeer,
  configuracion: ConfiguracionLeer,
  estudianteId: number,
): AsignacionLeer {
  const asignacion: AsignacionLeer = {
    id: siguienteAsignacionId++,
    estudianteId,
    estudiante: ESTUDIANTES[estudianteId] ?? `Estudiante ${estudianteId}`,
    ocurrenciaDeberId: ocurrencia.id,
    fecha: ocurrencia.fecha,
    configuracion: ocurrencia.configuracion,
    tipoDeberId: ocurrencia.tipoDeberId,
    tipoDeber: ocurrencia.tipoDeber,
    horario: ocurrencia.horario,
    lugar: ocurrencia.lugar,
    estado: 'PLANIFICADA',
    puntosCarga: configuracion.puntos,
    bloqueada: false,
    asignacionOrigenId: null,
    cancelada: false,
  }
  asignaciones.push(asignacion)
  return asignacion
}

export async function generarPlanificacion(
  periodoId: number,
  input?: GenerarInput,
): Promise<ResultadoGeneracion> {
  await delay(600)
  const periodo = solicitarPeriodo(periodoId)
  if (periodo.estado === 'CERRADO') throw new Error('El período está cerrado.')
  const desde = input?.desde ?? (hoyIso() > periodo.fin ? periodo.inicio : maxFecha(hoyIso(), periodo.inicio))
  const hasta = input?.hasta ?? periodo.fin
  if (desde > hasta) throw new Error('La fecha desde no puede ser posterior a la hasta.')
  if (desde < periodo.inicio || hasta > periodo.fin) {
    throw new Error('El rango debe estar dentro del período.')
  }
  const tipos = input?.tipoDeberIds?.length
    ? input.tipoDeberIds
    : planes
        .filter((plan) => plan.periodoPlanificacionId === periodoId)
        .map((plan) => plan.tipoDeberId)
  if (tipos.length === 0) throw new Error('El período no tiene planes.')
  const faltantes = tipos.filter(
    (tipo) => !planes.some((plan) => plan.periodoPlanificacionId === periodoId && plan.tipoDeberId === tipo),
  )
  if (faltantes.length) throw new Error('Hay tipos de deber sin plan en este período.')

  const fechas = rangoDias(desde, hasta, 14)
  const configuracionesAplicables = configuraciones.filter(
    (configuracion) =>
      tipos.includes(configuracion.tipoDeberId) &&
      configuracion.fechaInicio <= hasta &&
      (configuracion.fechaFin === null || configuracion.fechaFin >= desde),
  )
  const conservadas = asignaciones.filter(
    (item) =>
      item.estado === 'PLANIFICADA' &&
      ocurrencias.some(
        (ocurrencia) =>
          ocurrencia.id === item.ocurrenciaDeberId &&
          ocurrencia.periodoPlanificacionId === periodoId,
      ),
  ).length
  let creadas = 0
  let existentes = 0
  for (const configuracion of configuracionesAplicables) {
    for (const fecha of fechas) {
      if (!aplicaFrecuencia(configuracion, fecha)) continue
      const existente = ocurrencias.find(
        (item) =>
          item.periodoPlanificacionId === periodoId &&
          item.configuracionDeberId === configuracion.id &&
          item.fecha === fecha,
      )
      if (existente) {
        existentes += 1
        continue
      }
      const diaSinDeber = diasSinDeberes.some(
        (dia) =>
          fecha >= dia.desde &&
          fecha <= dia.hasta &&
          (dia.tipoDeberId === null || dia.tipoDeberId === configuracion.tipoDeberId),
      )
      if (diaSinDeber) continue
      ocurrencias.push({
        id: siguienteOcurrenciaId++,
        fecha,
        cancelada: false,
        motivoCancelacion: null,
        configuracionDeberId: configuracion.id,
        configuracion: configuracion.nombre,
        tipoDeberId: configuracion.tipoDeberId,
        tipoDeber: configuracion.tipoDeber,
        horario: configuracion.horario,
        modalidad: configuracion.modalidad,
        cantPersonas: configuracion.cantPersonas,
        periodoPlanificacionId: periodoId,
        lugarNivel: null,
        lugarId: null,
        lugar: null,
        asignados: 0,
      })
      creadas += 1
    }
  }

  let asignacionesCreadas = 0
  const objetivo = ocurrencias.filter(
    (ocurrencia) =>
      ocurrencia.periodoPlanificacionId === periodoId &&
      !ocurrencia.cancelada &&
      ocurrencia.fecha >= desde &&
      ocurrencia.fecha <= hasta &&
      configuracionesAplicables.some(
        (configuracion) => configuracion.id === ocurrencia.configuracionDeberId,
      ),
  )
  for (const ocurrencia of objetivo) {
    const configuracion = configuracionesAplicables.find(
      (item) => item.id === ocurrencia.configuracionDeberId,
    )
    if (!configuracion || configuracion.modalidad === 'MANUAL') continue

    const actuales = asignaciones.filter(
      (item) => item.ocurrenciaDeberId === ocurrencia.id && !item.cancelada,
    )
    const disponibles = estudiantesElegibles(ocurrencia.tipoDeberId, ocurrencia.fecha)
      .filter(
        (estudianteId) =>
          !actuales.some((item) => item.estudianteId === estudianteId) &&
          !tieneDeberEseDia(estudianteId, ocurrencia.fecha, ocurrencia.id),
      )
      .sort(
        (a, b) =>
          cargaEstudiante(a, ocurrencia.tipoDeberId) -
            cargaEstudiante(b, ocurrencia.tipoDeberId) || a - b,
      )

    const faltan =
      configuracion.modalidad === 'TODOS_LOS_ELEGIBLES'
        ? disponibles.length
        : Math.max(
            0,
            (ocurrencia.cantPersonas ?? configuracion.cantPersonas ?? 0) - actuales.length,
          )
    for (const estudianteId of disponibles.slice(0, faltan)) {
      crearAsignacionGenerada(ocurrencia, configuracion, estudianteId)
      asignacionesCreadas += 1
    }
    sincronizarOcurrencia(ocurrencia.id)
  }
  sincronizarPeriodo(periodoId)
  const sinCubrir = ocurrencias
    .filter(
      (item) =>
        item.periodoPlanificacionId === periodoId &&
        !item.cancelada &&
        item.cantPersonas != null &&
        item.asignados < item.cantPersonas,
    )
    .map((item) => ({
      ocurrenciaId: item.id,
      fecha: item.fecha,
      configuracion: item.configuracion,
      lugar: item.lugar,
      faltan: (item.cantPersonas ?? 0) - item.asignados,
    }))
  return {
    desde,
    hasta,
    ocurrenciasCreadas: creadas,
    ocurrenciasExistentes: existentes,
    ocurrenciasRetiradas: 0,
    asignacionesCreadas,
    asignacionesConservadas: conservadas,
    asignacionesRetiradas: 0,
    recuperaciones: asignaciones.filter((item) => item.asignacionOrigenId != null).length,
    sinCubrir,
    algoritmo: input?.algoritmo ?? 'SECUENCIAL',
    estado: input?.algoritmo === 'SECUENCIAL' ? 'SECUENCIAL' : 'OPTIMO',
    tiempoSegundos: 0.42,
  }
}

export async function listarTiposDeber(activo?: boolean): Promise<TipoDeberLeer[]> {
  await delay(80)
  return TIPOS.filter((item) => activo === undefined || item.activo === activo).map(clonar)
}

export async function crearTipoDeber(input: TipoDeberCrearInput): Promise<TipoDeberLeer> {
  await delay()
  const tipo: TipoDeberLeer = {
    id: Math.max(0, ...TIPOS.map((item) => item.id)) + 1,
    nombre: input.nombre,
    activo: true,
  }
  TIPOS.push(tipo)
  return clonar(tipo)
}

export async function actualizarTipoDeber(
  id: number,
  input: TipoDeberActualizarInput,
): Promise<TipoDeberLeer> {
  await delay()
  const tipo = TIPOS.find((item) => item.id === id)
  if (!tipo) throw new Error('El tipo de deber no existe.')
  if (input.nombre != null) tipo.nombre = input.nombre
  if (input.activo != null) tipo.activo = input.activo
  return clonar(tipo)
}

export async function listarHorarios(activo?: boolean): Promise<HorarioLeer[]> {
  await delay(80)
  return HORARIOS.filter((item) => activo === undefined || item.activo === activo).map(clonar)
}

export async function crearHorario(input: HorarioCrearInput): Promise<HorarioLeer> {
  await delay()
  const horario: HorarioLeer = {
    id: Math.max(0, ...HORARIOS.map((item) => item.id)) + 1,
    inicio: input.inicio,
    fin: input.fin,
    activo: true,
  }
  HORARIOS.push(horario)
  return clonar(horario)
}

export async function actualizarHorario(
  id: number,
  input: HorarioActualizarInput,
): Promise<HorarioLeer> {
  await delay()
  const horario = HORARIOS.find((item) => item.id === id)
  if (!horario) throw new Error('El horario no existe.')
  if (input.inicio != null) horario.inicio = input.inicio
  if (input.fin != null) horario.fin = input.fin
  if (input.activo != null) horario.activo = input.activo
  return clonar(horario)
}

export async function listarUbicaciones(activo?: boolean): Promise<UbicacionLeer[]> {
  await delay(80)
  return UBICACIONES.filter((item) => activo === undefined || item.activo === activo).map(clonar)
}

export async function crearUbicacion(input: UbicacionCrearInput): Promise<UbicacionLeer> {
  await delay()
  const ubicacion: UbicacionLeer = {
    id: Math.max(0, ...UBICACIONES.map((item) => item.id)) + 1,
    nombre: input.nombre,
    activo: true,
  }
  UBICACIONES.push(ubicacion)
  return clonar(ubicacion)
}

export async function actualizarUbicacion(
  id: number,
  input: UbicacionActualizarInput,
): Promise<UbicacionLeer> {
  await delay()
  const ubicacion = UBICACIONES.find((item) => item.id === id)
  if (!ubicacion) throw new Error('La ubicación no existe.')
  if (input.nombre != null) ubicacion.nombre = input.nombre
  if (input.activo != null) ubicacion.activo = input.activo
  return clonar(ubicacion)
}

export async function listarConfiguraciones(
  filtros?: ConfiguracionFiltros,
): Promise<ConfiguracionLeer[]> {
  await delay(120)
  return configuraciones
    .filter((item) => filtros?.tipoDeberId == null || item.tipoDeberId === filtros.tipoDeberId)
    .filter((item) => filtros?.vigente == null || item.vigente === filtros.vigente)
    .filter((item) => !filtros?.soloUltimas || item.esUltima)
    .map((item) => {
      item.enUso = ocurrencias.some((ocurrencia) => ocurrencia.configuracionDeberId === item.id)
      return clonar(item)
    })
}

export async function crearConfiguracion(
  input: ConfiguracionCrearInput,
): Promise<ConfiguracionLeer> {
  await delay()
  if (!TIPOS.some((item) => item.id === input.tipoDeberId)) {
    throw new Error('El tipo de deber seleccionado no existe.')
  }
  if (input.modalidad === 'TURNADA' && input.cantPersonas == null) {
    throw new Error('Un turno TURNADA exige cantPersonas.')
  }
  if (input.frecuencia === 'UNICA' && input.fechaFin != null) {
    throw new Error('Un deber de frecuencia UNICA no lleva fecha fin.')
  }
  if (input.fechaFin != null && input.fechaFin < input.fechaInicio) {
    throw new Error('La fecha fin no puede ser anterior al inicio.')
  }
  if (!input.diasSemana?.length) throw new Error('Indique al menos un día de la semana.')
  const configuracion: ConfiguracionLeer = {
    id: siguienteConfiguracionId++,
    tipoDeberId: input.tipoDeberId,
    tipoDeber: nombreTipo(input.tipoDeberId),
    nombre: input.nombre,
    horarioId: input.horarioId ?? null,
    horario: nombreHorario(input.horarioId ?? null),
    conjuntoReglaId: input.conjuntoReglaId ?? null,
    conjunto: nombreConjunto(input.conjuntoReglaId ?? null),
    modalidad: input.modalidad,
    cantPersonas: input.cantPersonas ?? null,
    puntos: input.puntos ?? 1,
    frecuencia: input.frecuencia,
    intervalo: input.intervalo ?? 1,
    fechaInicio: input.fechaInicio,
    fechaFin: input.fechaFin ?? null,
    expandirPor: input.expandirPor ?? 'NINGUNO',
    diasSemana: input.diasSemana ?? [1, 2, 3, 4, 5, 6, 7],
    versionAnteriorId: null,
    vigente: true,
    esUltima: true,
    enUso: false,
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
  if (configuracion.enUso) {
    throw new Error('La configuración ya tiene ocurrencias: cree una versión nueva.')
  }
  Object.assign(configuracion, input)
  configuracion.tipoDeber = nombreTipo(configuracion.tipoDeberId)
  configuracion.horario = nombreHorario(configuracion.horarioId)
  configuracion.conjunto = nombreConjunto(configuracion.conjuntoReglaId)
  return clonar(configuracion)
}

export async function versionarConfiguracion(
  id: number,
  input?: ConfiguracionActualizarInput,
): Promise<ConfiguracionLeer> {
  await delay()
  const anterior = solicitarConfiguracion(id)
  if (!anterior.esUltima) throw new Error('Esa versión ya tiene una posterior.')
  if (anterior.frecuencia === 'UNICA') {
    throw new Error('Un deber de frecuencia UNICA no se versiona: cree otro.')
  }
  const minimo = maxFecha(
    sumarDias(hoyIso(), 1),
    sumarDias(anterior.fechaInicio, 1),
    anterior.fechaFin ? sumarDias(anterior.fechaFin, 1) : '',
  )
  const desde = input?.fechaInicio ?? minimo
  if (desde < minimo) throw new Error(`La versión nueva no puede empezar antes del ${minimo}.`)
  const nueva: ConfiguracionLeer = {
    ...clonar(anterior),
    ...input,
    id: siguienteConfiguracionId++,
    fechaInicio: desde,
    versionAnteriorId: id,
    vigente: true,
    esUltima: true,
    enUso: false,
  }
  nueva.tipoDeber = nombreTipo(nueva.tipoDeberId)
  nueva.horario = nombreHorario(nueva.horarioId)
  nueva.conjunto = nombreConjunto(nueva.conjuntoReglaId)
  anterior.esUltima = false
  anterior.vigente = false
  anterior.fechaFin = sumarDias(desde, -1)
  configuraciones.push(nueva)
  return clonar(nueva)
}

export async function eliminarConfiguracion(id: number): Promise<void> {
  await delay()
  const configuracion = solicitarConfiguracion(id)
  if (configuracion.enUso) {
    if (configuracion.frecuencia === 'UNICA') {
      throw new Error('Un deber UNICA con ocurrencias no se puede retirar: cancele su ocurrencia.')
    }
    configuracion.fechaFin = hoyIso()
    configuracion.vigente = false
    return
  }
  if (!configuracion.esUltima) throw new Error('Esa versión tiene una posterior.')
  const indice = configuraciones.findIndex((item) => item.id === id)
  configuraciones.splice(indice, 1)
}

export async function listarDiasSinDeberes(
  filtros?: DiaSinDeberesFiltros,
): Promise<DiaSinDeberesLeer[]> {
  await delay(100)
  return diasSinDeberes
    .filter((item) => !filtros?.desde || item.hasta >= filtros.desde)
    .filter((item) => !filtros?.hasta || item.desde <= filtros.hasta)
    .filter((item) => filtros?.tipoDeberId == null || item.tipoDeberId === filtros.tipoDeberId)
    .map(clonar)
}

export async function crearDiaSinDeberes(
  input: DiaSinDeberesCrearInput,
): Promise<DiaSinDeberesLeer> {
  await delay()
  if (input.hasta < input.desde) throw new Error('La fecha hasta no puede ser anterior a desde.')
  const dia: DiaSinDeberesLeer = {
    id: siguienteDiaId++,
    desde: input.desde,
    hasta: input.hasta,
    motivo: input.motivo,
    tipoDeberId: input.tipoDeberId ?? null,
    tipoDeber: input.tipoDeberId == null ? null : nombreTipo(input.tipoDeberId),
    ocurrenciasCanceladas: 0,
  }
  if (input.cancelarOcurrencias) {
    const inicio = maxFecha(input.desde, hoyIso())
    let canceladas = 0
    for (const ocurrencia of ocurrencias) {
      if (ocurrencia.fecha < inicio || ocurrencia.fecha > input.hasta) continue
      if (input.tipoDeberId != null && ocurrencia.tipoDeberId !== input.tipoDeberId) continue
      if (ocurrencia.cancelada) continue
      ocurrencia.cancelada = true
      ocurrencia.motivoCancelacion = `Día sin deberes: ${input.motivo}`
      for (let i = asignaciones.length - 1; i >= 0; i -= 1) {
        const asignacion = asignaciones[i]
        if (asignacion?.ocurrenciaDeberId === ocurrencia.id && asignacion.estado === 'PLANIFICADA') {
          asignaciones.splice(i, 1)
        }
      }
      sincronizarOcurrencia(ocurrencia.id)
      sincronizarPeriodo(ocurrencia.periodoPlanificacionId)
      canceladas += 1
    }
    dia.ocurrenciasCanceladas = canceladas
  }
  diasSinDeberes.push(dia)
  return clonar(dia)
}

export async function actualizarDiaSinDeberes(
  id: number,
  input: DiaSinDeberesActualizarInput,
): Promise<DiaSinDeberesLeer> {
  await delay()
  const dia = solicitarDia(id)
  if (input.desde != null) dia.desde = input.desde
  if (input.hasta != null) dia.hasta = input.hasta
  if (input.motivo != null) dia.motivo = input.motivo
  if (dia.hasta < dia.desde) throw new Error('La fecha hasta no puede ser anterior a desde.')
  return clonar(dia)
}

export async function eliminarDiaSinDeberes(id: number): Promise<void> {
  await delay()
  solicitarDia(id)
  const indice = diasSinDeberes.findIndex((item) => item.id === id)
  diasSinDeberes.splice(indice, 1)
}

export async function listarExenciones(filtros?: ExencionFiltros): Promise<ExencionLeer[]> {
  await delay(100)
  return exenciones
    .filter((item) => filtros?.estudianteId == null || item.estudianteId === filtros.estudianteId)
    .filter((item) => filtros?.tipoDeberId == null || item.tipoDeberId === filtros.tipoDeberId)
    .map((item) => ({ ...clonar(item), vigente: estaVigente(item.desde, item.hasta) }))
    .filter((item) => filtros?.vigente == null || item.vigente === filtros.vigente)
}

export async function crearExencion(input: ExencionCrearInput): Promise<ExencionLeer> {
  await delay()
  if (input.hasta != null && input.hasta < input.desde) {
    throw new Error('La fecha hasta no puede ser anterior a desde.')
  }
  const exencion: ExencionLeer = {
    id: siguienteExencionId++,
    estudianteId: input.estudianteId,
    estudiante: ESTUDIANTES[input.estudianteId] ?? `Estudiante ${input.estudianteId}`,
    tipoDeberId: input.tipoDeberId ?? null,
    tipoDeber: input.tipoDeberId == null ? null : nombreTipo(input.tipoDeberId),
    desde: input.desde,
    hasta: input.hasta ?? null,
    motivo: input.motivo ?? null,
    vigente: estaVigente(input.desde, input.hasta ?? null),
  }
  exenciones.push(exencion)
  return clonar(exencion)
}

export async function actualizarExencion(
  id: number,
  input: ExencionActualizarInput,
): Promise<ExencionLeer> {
  await delay()
  const exencion = solicitarExencion(id)
  if (input.hasta !== undefined) exencion.hasta = input.hasta
  if (input.motivo !== undefined) exencion.motivo = input.motivo
  if (exencion.hasta != null && exencion.hasta < exencion.desde) {
    throw new Error('La fecha hasta no puede ser anterior a desde.')
  }
  exencion.vigente = estaVigente(exencion.desde, exencion.hasta)
  return clonar(exencion)
}

export async function eliminarExencion(id: number): Promise<void> {
  await delay()
  const exencion = solicitarExencion(id)
  if (exencion.desde <= hoyIso()) {
    throw new Error('La exención ya empezó: ciérrela enviando hasta.')
  }
  const indice = exenciones.findIndex((item) => item.id === id)
  exenciones.splice(indice, 1)
}

export async function listarOcurrencias(
  filtros?: OcurrenciaFiltros,
): Promise<OcurrenciaLeer[]> {
  await delay(120)
  const limite = filtros?.limit ?? 100
  const salto = filtros?.offset ?? 0
  return ocurrencias
    .filter(
      (item) =>
        filtros?.periodoPlanificacionId == null ||
        item.periodoPlanificacionId === filtros.periodoPlanificacionId,
    )
    .filter((item) => !filtros?.desde || item.fecha >= filtros.desde)
    .filter((item) => !filtros?.hasta || item.fecha <= filtros.hasta)
    .filter((item) => filtros?.tipoDeberId == null || item.tipoDeberId === filtros.tipoDeberId)
    .filter(
      (item) =>
        filtros?.configuracionDeberId == null ||
        item.configuracionDeberId === filtros.configuracionDeberId,
    )
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id - b.id)
    .slice(salto, salto + limite)
    .map(clonar)
}

export async function leerOcurrencia(id: number): Promise<OcurrenciaLeer> {
  await delay(100)
  return clonar(solicitarOcurrencia(id))
}

export async function cancelarOcurrencia(
  id: number,
  input: CancelarInput,
): Promise<OcurrenciaLeer> {
  await delay()
  const ocurrencia = solicitarOcurrencia(id)
  const periodo = solicitarPeriodo(ocurrencia.periodoPlanificacionId)
  if (periodo.estado === 'CERRADO') throw new Error('El período está cerrado.')
  if (!input.motivo.trim()) throw new Error('Indique el motivo de la cancelación.')
  ocurrencia.cancelada = true
  ocurrencia.motivoCancelacion = input.motivo
  for (let i = asignaciones.length - 1; i >= 0; i -= 1) {
    const asignacion = asignaciones[i]
    if (asignacion?.ocurrenciaDeberId === id && asignacion.estado === 'PLANIFICADA') {
      asignaciones.splice(i, 1)
    }
  }
  sincronizarOcurrencia(id)
  sincronizarPeriodo(ocurrencia.periodoPlanificacionId)
  return clonar(ocurrencia)
}

export async function reactivarOcurrencia(id: number): Promise<OcurrenciaLeer> {
  await delay()
  const ocurrencia = solicitarOcurrencia(id)
  const periodo = solicitarPeriodo(ocurrencia.periodoPlanificacionId)
  if (periodo.estado === 'CERRADO') throw new Error('El período está cerrado.')
  ocurrencia.cancelada = false
  ocurrencia.motivoCancelacion = null
  return clonar(ocurrencia)
}

export async function asignarManual(
  ocurrenciaId: number,
  input: AsignacionCrearInput,
): Promise<AsignacionLeer> {
  await delay()
  const ocurrencia = solicitarOcurrencia(ocurrenciaId)
  const periodo = solicitarPeriodo(ocurrencia.periodoPlanificacionId)
  if (periodo.estado === 'CERRADO') throw new Error('El período está cerrado.')
  if (ocurrencia.cancelada) throw new Error('La ocurrencia está cancelada.')
  if (
    ocurrencia.cantPersonas != null &&
    ocurrencia.asignados >= ocurrencia.cantPersonas
  ) {
    throw new Error('La ocurrencia no tiene cupos disponibles.')
  }
  if (
    asignaciones.some(
      (item) => item.ocurrenciaDeberId === ocurrenciaId && item.estudianteId === input.estudianteId,
    )
  ) {
    throw new Error('Ese estudiante ya está asignado a la ocurrencia.')
  }
  const asignacion: AsignacionLeer = {
    id: siguienteAsignacionId++,
    estudianteId: input.estudianteId,
    estudiante: ESTUDIANTES[input.estudianteId] ?? `Estudiante ${input.estudianteId}`,
    ocurrenciaDeberId: ocurrenciaId,
    fecha: ocurrencia.fecha,
    configuracion: ocurrencia.configuracion,
    tipoDeberId: ocurrencia.tipoDeberId,
    tipoDeber: ocurrencia.tipoDeber,
    horario: ocurrencia.horario,
    lugar: ocurrencia.lugar,
    estado: 'PLANIFICADA',
    puntosCarga: 1,
    bloqueada: input.bloqueada ?? true,
    asignacionOrigenId: null,
    cancelada: false,
  }
  asignaciones.push(asignacion)
  sincronizarOcurrencia(ocurrenciaId)
  sincronizarPeriodo(ocurrencia.periodoPlanificacionId)
  return clonar(asignacion)
}

export async function listarAsignaciones(
  filtros?: AsignacionFiltros,
): Promise<AsignacionLeer[]> {
  await delay(120)
  const limite = filtros?.limit ?? 100
  const salto = filtros?.offset ?? 0
  const idsPeriodo = new Set(
    ocurrencias
      .filter(
        (item) =>
          filtros?.periodoPlanificacionId == null ||
          item.periodoPlanificacionId === filtros.periodoPlanificacionId,
      )
      .map((item) => item.id),
  )
  return asignaciones
    .filter((item) => idsPeriodo.has(item.ocurrenciaDeberId))
    .filter((item) => filtros?.estudianteId == null || item.estudianteId === filtros.estudianteId)
    .filter(
      (item) =>
        filtros?.ocurrenciaDeberId == null ||
        item.ocurrenciaDeberId === filtros.ocurrenciaDeberId,
    )
    .filter((item) => !filtros?.desde || item.fecha >= filtros.desde)
    .filter((item) => !filtros?.hasta || item.fecha <= filtros.hasta)
    .filter((item) => !filtros?.estado || item.estado === filtros.estado)
    .filter((item) => filtros?.tipoDeberId == null || item.tipoDeberId === filtros.tipoDeberId)
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id - b.id)
    .slice(salto, salto + limite)
    .map(clonar)
}

export async function actualizarAsignacion(
  id: number,
  input: AsignacionActualizarInput,
): Promise<AsignacionLeer> {
  await delay()
  const asignacion = solicitarAsignacion(id)
  const ocurrencia = solicitarOcurrencia(asignacion.ocurrenciaDeberId)
  const periodo = solicitarPeriodo(ocurrencia.periodoPlanificacionId)
  if (periodo.estado === 'CERRADO') throw new Error('El período está cerrado.')
  asignacion.bloqueada = input.bloqueada
  return clonar(asignacion)
}

export async function quitarAsignacion(id: number): Promise<void> {
  await delay()
  const asignacion = solicitarAsignacion(id)
  const ocurrencia = solicitarOcurrencia(asignacion.ocurrenciaDeberId)
  const periodo = solicitarPeriodo(ocurrencia.periodoPlanificacionId)
  if (periodo.estado === 'CERRADO') throw new Error('El período está cerrado.')
  if (asignacion.estado !== 'PLANIFICADA') {
    throw new Error('Solo se quita una asignación PLANIFICADA.')
  }
  const indice = asignaciones.findIndex((item) => item.id === id)
  asignaciones.splice(indice, 1)
  sincronizarOcurrencia(asignacion.ocurrenciaDeberId)
  sincronizarPeriodo(ocurrencia.periodoPlanificacionId)
}

export async function registrarCumplimiento(
  input: CumplimientoInput,
): Promise<ResultadoCumplimiento> {
  await delay()
  const hoy = hoyIso()
  for (const item of input.items) {
    const asignacion = solicitarAsignacion(item.asignacionId)
    if (asignacion.estado === 'PERMUTADA') {
      throw new Error(`La asignación ${asignacion.id} fue permutada: no se marca.`)
    }
    if (item.estado !== 'PLANIFICADA' && asignacion.fecha > hoy) {
      throw new Error(`La asignación ${asignacion.id} es futura: no se marca antes de su fecha.`)
    }
  }
  let actualizadas = 0
  for (const item of input.items) {
    const asignacion = solicitarAsignacion(item.asignacionId)
    if (asignacion.estado === item.estado) continue
    asignacion.estado = item.estado
    actualizadas += 1
  }
  return { actualizadas }
}

export async function recuperar(
  asignacionId: number,
  input: RecuperacionInput,
): Promise<AsignacionLeer> {
  await delay()
  const origen = solicitarAsignacion(asignacionId)
  if (origen.estado !== 'INCUMPLIDA' && origen.estado !== 'JUSTIFICADA') {
    throw new Error('Solo se recupera una asignación INCUMPLIDA o JUSTIFICADA.')
  }
  const ocurrencia = solicitarOcurrencia(input.ocurrenciaDeberId)
  const periodo = solicitarPeriodo(ocurrencia.periodoPlanificacionId)
  if (periodo.estado === 'CERRADO') throw new Error('El período está cerrado.')
  if (ocurrencia.cancelada) throw new Error('La ocurrencia está cancelada.')
  if (ocurrencia.fecha < hoyIso()) throw new Error('La recuperación debe ser en una fecha futura.')
  if (ocurrencia.tipoDeberId !== origen.tipoDeberId) {
    throw new Error('La recuperación debe ser del mismo tipo de deber.')
  }
  if (asignaciones.some((item) => item.asignacionOrigenId === origen.id)) {
    throw new Error('Esa asignación ya tiene una recuperación.')
  }
  if (
    asignaciones.some(
      (item) =>
        item.ocurrenciaDeberId === ocurrencia.id && item.estudianteId === origen.estudianteId,
    )
  ) {
    throw new Error('El estudiante ya está asignado a esa ocurrencia.')
  }
  const asignacion: AsignacionLeer = {
    id: siguienteAsignacionId++,
    estudianteId: origen.estudianteId,
    estudiante: origen.estudiante,
    ocurrenciaDeberId: ocurrencia.id,
    fecha: ocurrencia.fecha,
    configuracion: ocurrencia.configuracion,
    tipoDeberId: ocurrencia.tipoDeberId,
    tipoDeber: ocurrencia.tipoDeber,
    horario: ocurrencia.horario,
    lugar: ocurrencia.lugar,
    estado: 'PLANIFICADA',
    puntosCarga: 1,
    bloqueada: input.bloqueada ?? true,
    asignacionOrigenId: origen.id,
    cancelada: false,
  }
  asignaciones.push(asignacion)
  sincronizarOcurrencia(ocurrencia.id)
  sincronizarPeriodo(ocurrencia.periodoPlanificacionId)
  return clonar(asignacion)
}

export async function listarDeudas(filtros?: DeudaFiltros): Promise<AsignacionLeer[]> {
  await delay(100)
  const recuperadas = new Set(
    asignaciones
      .filter((item) => item.asignacionOrigenId != null)
      .map((item) => item.asignacionOrigenId),
  )
  return asignaciones
    .filter((item) => item.estado === 'INCUMPLIDA' || item.estado === 'JUSTIFICADA')
    .filter((item) => !recuperadas.has(item.id))
    .filter((item) => filtros?.estudianteId == null || item.estudianteId === filtros.estudianteId)
    .filter((item) => filtros?.tipoDeberId == null || item.tipoDeberId === filtros.tipoDeberId)
    .map(clonar)
}

export const demoPlanificacionRepository: PlanificacionRepository = {
  listarPeriodos,
  leerPeriodo,
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
  crearTipoDeber,
  actualizarTipoDeber,
  listarHorarios,
  crearHorario,
  actualizarHorario,
  listarUbicaciones,
  crearUbicacion,
  actualizarUbicacion,
  listarConfiguraciones,
  crearConfiguracion,
  actualizarConfiguracion,
  versionarConfiguracion,
  eliminarConfiguracion,
  listarDiasSinDeberes,
  crearDiaSinDeberes,
  actualizarDiaSinDeberes,
  eliminarDiaSinDeberes,
  listarExenciones,
  crearExencion,
  actualizarExencion,
  eliminarExencion,
  listarOcurrencias,
  leerOcurrencia,
  cancelarOcurrencia,
  reactivarOcurrencia,
  asignarManual,
  listarAsignaciones,
  actualizarAsignacion,
  quitarAsignacion,
  registrarCumplimiento,
  recuperar,
  listarDeudas,
}
