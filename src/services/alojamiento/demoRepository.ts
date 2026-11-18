import type {
  BloquearInput,
  ConfirmarInput,
  EjecutarInput,
  NoAlojado,
  PeriodoRegistro,
  PreasignacionActualizarInput,
  PreasignacionCrearInput,
  PreasignacionLeer,
  ProcesoCrearInput,
  ProcesoLeer,
  ResultadoConfirmacion,
  ResultadoEjecucion,
  ResultadoRestricciones,
  RestriccionCrearInput,
  RestriccionLeer,
} from '@/types/alojamiento'
import type { AlojamientoRepository } from './contracts'

const delay = (ms = 200) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function clonar<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor)) as T
}

interface CuartoDemo {
  id: number
  nombre: string
  escaleraId: number
  edificioId: number
}

const CUARTOS: CuartoDemo[] = [
  { id: 1, nombre: '101', escaleraId: 1, edificioId: 1 },
  { id: 2, nombre: '102', escaleraId: 1, edificioId: 1 },
  { id: 3, nombre: '201', escaleraId: 2, edificioId: 1 },
  { id: 4, nombre: '202', escaleraId: 2, edificioId: 1 },
  { id: 5, nombre: '301', escaleraId: 3, edificioId: 2 },
  { id: 6, nombre: '302', escaleraId: 3, edificioId: 2 },
]

const ESTUDIANTES = [
  { id: 1, nombre: 'Ana Pérez' },
  { id: 2, nombre: 'Luis Gómez' },
  { id: 3, nombre: 'María Rodríguez' },
  { id: 4, nombre: 'Carlos Díaz' },
  { id: 5, nombre: 'Laura Fernández' },
  { id: 6, nombre: 'Pedro Martínez' },
]

const PERIODOS: PeriodoRegistro[] = [
  { id: 1, inicio: '2026-08-01', fin: '2026-09-15' },
  { id: 2, inicio: '2027-01-10', fin: '2027-02-20' },
]

const procesos: ProcesoLeer[] = [
  {
    id: 1,
    nombre: 'Alojamiento curso 2026',
    tipo: 'MASIVO',
    estado: 'BORRADOR',
    periodoRegistroId: 1,
    cursoId: 1,
    curso: '2026',
    conjuntoReglaId: 1,
    conjunto: 'Afín por provincia',
    conjuntoVersion: 1,
    procesoOrigenId: null,
    creadoPor: 1,
    creadoEn: '2026-09-02T10:00:00',
    confirmadoPor: null,
    confirmadoEn: null,
    preasignaciones: 0,
    restricciones: 2,
  },
  {
    id: 2,
    nombre: 'Reubicación individual',
    tipo: 'INDIVIDUAL',
    estado: 'CONFIRMADO',
    periodoRegistroId: 1,
    cursoId: 1,
    curso: '2026',
    conjuntoReglaId: 2,
    conjunto: 'Conservar ubicación previa',
    conjuntoVersion: 1,
    procesoOrigenId: 1,
    creadoPor: 1,
    creadoEn: '2026-09-05T09:30:00',
    confirmadoPor: 1,
    confirmadoEn: '2026-09-06T11:00:00',
    preasignaciones: 2,
    restricciones: 1,
  },
]

let siguienteProcesoId = 3
let siguienteRestriccionId = 4
let siguientePreasignacionId = 3

const restriccionesPorProceso: Record<number, RestriccionLeer[]> = {
  1: [
    {
      id: 1,
      cuartoId: 1,
      cuarto: '101',
      conjuntoReglaId: 1,
      conjunto: 'Afín por provincia',
      conjuntoVersion: 1,
      relajable: true,
      exclusiva: false,
    },
    {
      id: 2,
      cuartoId: 2,
      cuarto: '102',
      conjuntoReglaId: 1,
      conjunto: 'Afín por provincia',
      conjuntoVersion: 1,
      relajable: false,
      exclusiva: true,
    },
  ],
  2: [
    {
      id: 3,
      cuartoId: 3,
      cuarto: '201',
      conjuntoReglaId: 2,
      conjunto: 'Conservar ubicación previa',
      conjuntoVersion: 1,
      relajable: true,
      exclusiva: false,
    },
  ],
}

const preasignacionesPorProceso: Record<number, PreasignacionLeer[]> = {
  1: [],
  2: [
    {
      id: 1,
      estudianteId: 1,
      estudiante: 'Ana Pérez',
      cuartoId: 3,
      cuarto: '201',
      puntaje: 87,
      bloqueada: true,
      estado: 'CONFIRMADA',
    },
    {
      id: 2,
      estudianteId: 2,
      estudiante: 'Luis Gómez',
      cuartoId: 4,
      cuarto: '202',
      puntaje: 78,
      bloqueada: false,
      estado: 'CONFIRMADA',
    },
  ],
}

const noAlojadosPorProceso: Record<number, NoAlojado[]> = { 1: [], 2: [] }
const resultadosPorProceso: Record<number, ResultadoEjecucion> = {}

function solicitarProceso(id: number): ProcesoLeer {
  const proceso = procesos.find((item) => item.id === id)
  if (!proceso) throw new Error('El proceso de alojamiento solicitado no existe.')
  return proceso
}

function cuartosDe(input: RestriccionCrearInput): CuartoDemo[] {
  if (input.cuartoIds?.length) {
    return CUARTOS.filter((cuarto) => input.cuartoIds?.includes(cuarto.id))
  }
  if (input.escaleraId != null) {
    return CUARTOS.filter((cuarto) => cuarto.escaleraId === input.escaleraId)
  }
  if (input.edificioId != null) {
    return CUARTOS.filter((cuarto) => cuarto.edificioId === input.edificioId)
  }
  return CUARTOS
}

export async function listarProcesos(filtros?: {
  estado?: string
  periodoRegistroId?: number
}): Promise<ProcesoLeer[]> {
  await delay()
  return procesos
    .filter(
      (proceso) =>
        (!filtros?.estado || proceso.estado === filtros.estado) &&
        (filtros?.periodoRegistroId == null ||
          proceso.periodoRegistroId === filtros.periodoRegistroId),
    )
    .map((proceso) => clonar(proceso))
}

export async function obtenerProceso(id: number): Promise<ProcesoLeer> {
  await delay()
  return clonar(solicitarProceso(id))
}

export async function crearProceso(input: ProcesoCrearInput): Promise<ProcesoLeer> {
  await delay()
  const proceso: ProcesoLeer = {
    id: siguienteProcesoId++,
    nombre: input.nombre,
    tipo: input.tipo,
    estado: 'BORRADOR',
    periodoRegistroId: input.periodoRegistroId,
    cursoId: 1,
    curso: '2026',
    conjuntoReglaId: input.conjuntoReglaId,
    conjunto: 'Conjunto de reglas',
    conjuntoVersion: 1,
    procesoOrigenId: input.procesoOrigenId ?? null,
    creadoPor: 1,
    creadoEn: new Date().toISOString(),
    confirmadoPor: null,
    confirmadoEn: null,
    preasignaciones: 0,
    restricciones: 0,
  }
  procesos.push(proceso)
  restriccionesPorProceso[proceso.id] = []
  preasignacionesPorProceso[proceso.id] = []
  noAlojadosPorProceso[proceso.id] = []
  return clonar(proceso)
}

export async function listarRestricciones(procesoId: number): Promise<RestriccionLeer[]> {
  await delay(120)
  solicitarProceso(procesoId)
  return clonar(restriccionesPorProceso[procesoId] ?? [])
}

export async function agregarRestricciones(
  procesoId: number,
  input: RestriccionCrearInput,
): Promise<ResultadoRestricciones> {
  await delay()
  const proceso = solicitarProceso(procesoId)
  const actuales = restriccionesPorProceso[procesoId] ?? []
  const cuartos = cuartosDe(input)
  let creadas = 0
  let yaExistian = 0

  for (const cuarto of cuartos) {
    const existente = actuales.some(
      (restriccion) =>
        restriccion.cuartoId === cuarto.id &&
        restriccion.conjuntoReglaId === input.conjuntoReglaId,
    )
    if (existente) {
      yaExistian++
      continue
    }

    actuales.push({
      id: siguienteRestriccionId++,
      cuartoId: cuarto.id,
      cuarto: cuarto.nombre,
      conjuntoReglaId: input.conjuntoReglaId,
      conjunto: 'Conjunto de reglas',
      conjuntoVersion: 1,
      relajable: Boolean(input.relajable),
      exclusiva: Boolean(input.exclusiva),
    })
    creadas++
  }

  restriccionesPorProceso[procesoId] = actuales
  proceso.restricciones = actuales.length
  return { creadas, yaExistian }
}

export async function quitarRestriccion(
  procesoId: number,
  restriccionId: number,
): Promise<void> {
  await delay(120)
  const proceso = solicitarProceso(procesoId)
  const actuales = restriccionesPorProceso[procesoId] ?? []
  const indice = actuales.findIndex((restriccion) => restriccion.id === restriccionId)
  if (indice < 0) throw new Error('La restricción solicitada no existe.')
  actuales.splice(indice, 1)
  proceso.restricciones = actuales.length
}

export async function ejecutarProceso(
  procesoId: number,
  input?: EjecutarInput,
): Promise<ResultadoEjecucion> {
  await delay(600)
  const proceso = solicitarProceso(procesoId)
  const candidatos = input?.estudianteIds?.length
    ? ESTUDIANTES.filter((estudiante) => input.estudianteIds?.includes(estudiante.id))
    : ESTUDIANTES
  const cuartos = CUARTOS.slice(0, 4)
  const asignables = candidatos.slice(0, cuartos.length)

  const preasignaciones: PreasignacionLeer[] = asignables.map((estudiante, indice) => {
    const cuarto = cuartos[indice]
    if (!cuarto) throw new Error('No hay cuarto disponible para la preasignación.')
    return {
      id: siguientePreasignacionId++,
      estudianteId: estudiante.id,
      estudiante: estudiante.nombre,
      cuartoId: cuarto.id,
      cuarto: cuarto.nombre,
      puntaje: 95 - indice * 4,
      bloqueada: false,
      estado: 'PROPUESTA',
    }
  })

  const noAlojados: NoAlojado[] = candidatos.slice(asignables.length).map((estudiante) => ({
    estudianteId: estudiante.id,
    estudiante: estudiante.nombre,
    motivo: 'SIN_CAPACIDAD',
    detalle: 'No quedan plazas compatibles con sus condiciones.',
    seResolveriaRelajando: true,
  }))

  const resultado: ResultadoEjecucion = {
    estadoSolver: input?.algoritmo === 'VORAZ' ? 'HEURISTICO' : 'OPTIMO',
    tiempoSegundos: 0.62,
    candidatos: candidatos.length,
    alojados: asignables.length,
    fijadas: preasignaciones.filter((preasignacion) => preasignacion.bloqueada).length,
    noAlojados,
    omitidos: [],
    metricas: [
      { preferencia: 'Afinidad de reglas', valor: 0.91 },
      { preferencia: 'Conservación de ubicación', valor: 0.74 },
    ],
    restriccionesRelajadas: input?.relajarRestricciones ?? [],
  }

  preasignacionesPorProceso[procesoId] = preasignaciones
  noAlojadosPorProceso[procesoId] = noAlojados
  resultadosPorProceso[procesoId] = resultado
  proceso.preasignaciones = preasignaciones.length

  return clonar(resultado)
}

export async function listarPreasignaciones(procesoId: number): Promise<PreasignacionLeer[]> {
  await delay(120)
  solicitarProceso(procesoId)
  return clonar(preasignacionesPorProceso[procesoId] ?? [])
}

export async function listarNoAlojados(procesoId: number): Promise<NoAlojado[]> {
  await delay(120)
  solicitarProceso(procesoId)
  return clonar(noAlojadosPorProceso[procesoId] ?? [])
}

export async function descartarProceso(procesoId: number): Promise<ProcesoLeer> {
  await delay()
  const proceso = solicitarProceso(procesoId)
  proceso.estado = 'DESCARTADO'
  preasignacionesPorProceso[procesoId] = []
  noAlojadosPorProceso[procesoId] = []
  proceso.preasignaciones = 0
  return clonar(proceso)
}

export async function confirmarProceso(
  procesoId: number,
  input?: ConfirmarInput,
): Promise<ResultadoConfirmacion> {
  await delay(400)
  const proceso = solicitarProceso(procesoId)
  const excluidos = new Set(input?.excluirEstudianteIds ?? [])
  const preasignaciones = preasignacionesPorProceso[procesoId] ?? []
  let reservas = 0

  for (const preasignacion of preasignaciones) {
    if (excluidos.has(preasignacion.estudianteId)) continue
    preasignacion.estado = 'CONFIRMADA'
    preasignacion.bloqueada = true
    reservas++
  }

  proceso.estado = 'CONFIRMADO'
  proceso.confirmadoPor = 1
  proceso.confirmadoEn = new Date().toISOString()
  proceso.preasignaciones = preasignaciones.length

  return { reservas, excluidos: excluidos.size }
}

export async function listarPeriodosRegistro(): Promise<PeriodoRegistro[]> {
  await delay(80)
  return clonar(PERIODOS)
}

export const demoAlojamientoRepository: AlojamientoRepository = {
  listarProcesos,
  obtenerProceso,
  crearProceso,
  listarRestricciones,
  agregarRestricciones,
  quitarRestriccion,
  ejecutarProceso,
  listarPreasignaciones,
  listarNoAlojados,
  agregarPreasignacion,
  actualizarPreasignacion,
  quitarPreasignacion,
  bloquearPreasignaciones,
  descartarProceso,
  confirmarProceso,
  listarPeriodosRegistro,
}

export async function agregarPreasignacion(
  procesoId: number,
  input: PreasignacionCrearInput,
): Promise<PreasignacionLeer> {
  await delay(120)
  solicitarProceso(procesoId)
  const actuales = preasignacionesPorProceso[procesoId] ?? []
  if (actuales.some((p) => p.estudianteId === input.estudianteId))
    throw new Error('El estudiante ya tiene preasignación en este proceso.')
  const est = ESTUDIANTES.find((e) => e.id === input.estudianteId)
  const cuarto = CUARTOS.find((c) => c.id === input.cuartoId)
  const p: PreasignacionLeer = {
    id: siguientePreasignacionId++,
    estudianteId: input.estudianteId,
    estudiante: est?.nombre ?? `Estudiante ${input.estudianteId}`,
    cuartoId: input.cuartoId,
    cuarto: cuarto?.nombre ?? String(input.cuartoId),
    puntaje: null,
    bloqueada: input.bloqueada ?? true,
    estado: 'BORRADOR',
  }
  actuales.push(p)
  preasignacionesPorProceso[procesoId] = actuales
  noAlojadosPorProceso[procesoId] = (noAlojadosPorProceso[procesoId] ?? []).filter(
    (n) => n.estudianteId !== input.estudianteId,
  )
  return clonar(p)
}

export async function actualizarPreasignacion(
  procesoId: number,
  estudianteId: number,
  input: PreasignacionActualizarInput,
): Promise<PreasignacionLeer> {
  await delay(120)
  solicitarProceso(procesoId)
  const actuales = preasignacionesPorProceso[procesoId] ?? []
  const p = actuales.find((x) => x.estudianteId === estudianteId)
  if (!p) throw new Error('El estudiante no tiene preasignación en este proceso.')
  if (input.cuartoId != null) {
    const cuarto = CUARTOS.find((c) => c.id === input.cuartoId)
    p.cuartoId = input.cuartoId
    p.cuarto = cuarto?.nombre ?? String(input.cuartoId)
  }
  if (input.bloqueada != null) p.bloqueada = input.bloqueada
  return clonar(p)
}

export async function quitarPreasignacion(
  procesoId: number,
  estudianteId: number,
): Promise<void> {
  await delay(120)
  solicitarProceso(procesoId)
  const actuales = preasignacionesPorProceso[procesoId] ?? []
  const i = actuales.findIndex((x) => x.estudianteId === estudianteId)
  if (i < 0) throw new Error('El estudiante no tiene preasignación en este proceso.')
  actuales.splice(i, 1)
  preasignacionesPorProceso[procesoId] = actuales
}

export async function bloquearPreasignaciones(
  procesoId: number,
  input: BloquearInput,
): Promise<{ cambiadas: number }> {
  await delay(120)
  solicitarProceso(procesoId)
  const ids = input.estudianteIds ? new Set(input.estudianteIds) : null
  let cambiadas = 0
  for (const p of preasignacionesPorProceso[procesoId] ?? []) {
    if (ids && !ids.has(p.estudianteId)) continue
    p.bloqueada = input.bloqueada ?? true
    cambiadas++
  }
  return { cambiadas }
}
