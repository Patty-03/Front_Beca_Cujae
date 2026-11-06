import {
  alojamientos,
  cuartos,
  edificios,
  escaleras,
  estadosConstructivos,
  eventosAuditoria,
} from '@/data/mockInfraestructura'
import type {
  ActualizarCuartoInput,
  ActualizarEdificioInput,
  ActualizarEscaleraInput,
  CrearCuartoInput,
  CrearEdificioInput,
  CrearEscaleraInput,
  CuartoResumen,
  EdificioDetalle,
  EdificioResumen,
  EscaleraResumen,
  EstadoConstructivo,
  EventoAuditoria,
  InfraestructuraResumen,
} from '@/types/infraestructura'
import type {
  CuartoRecord,
  EdificioRecord,
  EscaleraRecord,
  EventoAuditoriaRecord,
} from '@/data/mockInfraestructura'
import { serializarCsv, type CsvCell } from '@/lib/csv'
import {
  LIMITES,
  normalizarParaComparar,
  validarCapacidad,
  validarNombre,
} from '@/lib/validation'
import { calcularEstadoEdificio } from '@/lib/estadoConstructivoEdificio'
import { useUmbralesEdificiosStore } from '@/stores/umbralesEdificios'
import { useAuthStore } from '@/stores/auth'
import type { InfraestructuraRepository } from './contracts'

const delay = (ms = 240) => new Promise<void>((resolve) => setTimeout(resolve, ms))
const hoy = () => new Date().toISOString().slice(0, 10)

const siguienteId = (registros: Array<{ id: number }>) =>
  registros.reduce((maximo, registro) => Math.max(maximo, registro.id), 0) + 1

const porcentaje = (ocupados: number, capacidad: number) =>
  capacidad > 0 ? Math.round((ocupados / capacidad) * 100) : 0

const obtenerEstado = (estadoConstructivoId: number): EstadoConstructivo => {
  const estado = estadosConstructivos.find((item) => item.id === estadoConstructivoId)
  if (!estado) throw new Error('El estado constructivo seleccionado no existe.')
  return { ...estado }
}

const esAlojamientoActivo = (alojamiento: (typeof alojamientos)[number]) =>
  !alojamiento.hasta || alojamiento.hasta >= hoy()

const cuartosDeEscalera = (escaleraId: number) =>
  cuartos.filter((cuarto) => cuarto.escaleraId === escaleraId)

const cuartosDeEdificio = (edificioId: number) => {
  const idsEscaleras = new Set(
    escaleras.filter((escalera) => escalera.edificioId === edificioId).map((escalera) => escalera.id),
  )
  return cuartos.filter((cuarto) => idsEscaleras.has(cuarto.escaleraId))
}

const ocupadosDeCuarto = (cuartoId: number) =>
  alojamientos.filter(
    (alojamiento) => alojamiento.cuartoId === cuartoId && esAlojamientoActivo(alojamiento),
  ).length

const resumenCuarto = (cuarto: CuartoRecord): CuartoResumen => {
  const ocupados = ocupadosDeCuarto(cuarto.id)
  return {
    id: cuarto.id,
    nombre: cuarto.nombre,
    capacidadMaxima: cuarto.capacidadMaxima,
    escaleraId: cuarto.escaleraId,
    estado: obtenerEstado(cuarto.estadoConstructivoId),
    ocupados,
    ocupacionPct: porcentaje(ocupados, cuarto.capacidadMaxima),
    tieneAlojamientos: alojamientos.some((alojamiento) => alojamiento.cuartoId === cuarto.id),
  }
}

const resumenEscalera = (escalera: EscaleraRecord): EscaleraResumen => {
  const propios = cuartosDeEscalera(escalera.id)
  const capacidad = propios.reduce((total, cuarto) => total + cuarto.capacidadMaxima, 0)
  const ocupados = propios.reduce((total, cuarto) => total + ocupadosDeCuarto(cuarto.id), 0)
  return {
    id: escalera.id,
    nombre: escalera.nombre,
    cuartos: propios.length,
    capacidad,
    ocupados,
    ocupacionPct: porcentaje(ocupados, capacidad),
  }
}

const resumenEdificio = (edificio: EdificioRecord): EdificioResumen => {
  const propios = cuartosDeEdificio(edificio.id)
  const capacidad = propios.reduce((total, cuarto) => total + cuarto.capacidadMaxima, 0)
  const ocupados = propios.reduce((total, cuarto) => total + ocupadosDeCuarto(cuarto.id), 0)
  const cuartosResumen = propios.map(resumenCuarto)
  
  let estadoCalculado = obtenerEstado(edificio.estadoConstructivoId)
  try {
    const umbralesStore = useUmbralesEdificiosStore()
    estadoCalculado = calcularEstadoEdificio(
      cuartosResumen,
      estadosConstructivos,
      umbralesStore.umbrales.pctBueno,
      umbralesStore.umbrales.pctRegular,
    )
  } catch {
    // Si pinia no está activo en algún contexto aislado
  }

  return {
    id: edificio.id,
    nombre: edificio.nombre,
    estado: estadoCalculado,
    escaleras: escaleras.filter((escalera) => escalera.edificioId === edificio.id).length,
    cuartos: propios.length,
    capacidad,
    ocupados,
    ocupacionPct: porcentaje(ocupados, capacidad),
  }
}

const registrarEvento = (funcionalidad: string): EventoAuditoriaRecord => {
  const auth = useAuthStore()
  const evento: EventoAuditoriaRecord = {
    id: siguienteId(eventosAuditoria),
    usuario: auth.user?.name ?? 'Sistema',
    servicio: 'Infraestructura',
    funcionalidad,
    fecha: new Date().toISOString(),
  }
  eventosAuditoria.push(evento)
  return evento
}

const obtenerEventos = (limite?: number): EventoAuditoria[] =>
  [...eventosAuditoria]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, limite)
    .map(({ id, usuario, servicio, funcionalidad, fecha }) => ({
      id,
      usuario,
      servicio,
      funcionalidad,
      fecha,
    }))


const solicitarEdificio = (id: number): EdificioRecord => {
  const edificio = edificios.find((item) => item.id === id)
  if (!edificio) throw new Error('El edificio solicitado no existe.')
  return edificio
}

const solicitarEscalera = (id: number): EscaleraRecord => {
  const escalera = escaleras.find((item) => item.id === id)
  if (!escalera) throw new Error('La escalera solicitada no existe.')
  return escalera
}

const solicitarCuarto = (id: number): CuartoRecord => {
  const cuarto = cuartos.find((item) => item.id === id)
  if (!cuarto) throw new Error('El cuarto solicitado no existe.')
  return cuarto
}

export async function obtenerEstadosConstructivos(): Promise<EstadoConstructivo[]> {
  await delay(120)
  return estadosConstructivos.map((estado) => ({ ...estado }))
}

export async function obtenerResumen(): Promise<InfraestructuraResumen> {
  await delay()
  const resumenes = edificios.map(resumenEdificio)
  const capacidadTotal = cuartos.reduce((total, cuarto) => total + cuarto.capacidadMaxima, 0)
  const ocupados = cuartos.reduce((total, cuarto) => total + ocupadosDeCuarto(cuarto.id), 0)

  return {
    totalEdificios: edificios.length,
    totalEscaleras: escaleras.length,
    totalCuartos: cuartos.length,
    capacidadTotal,
    ocupados,
    ocupacionPct: porcentaje(ocupados, capacidadTotal),
    estados: estadosConstructivos
      .map((estado) => ({
        estado: { ...estado },
        cuartos: cuartos.filter((cuarto) => cuarto.estadoConstructivoId === estado.id).length,
      }))
      .filter((item) => item.cuartos > 0),
    edificios: resumenes,
    eventos: obtenerEventos(5),
  }
}

export async function obtenerEdificios(): Promise<EdificioResumen[]> {
  await delay()
  return edificios.map(resumenEdificio)
}

export async function obtenerEdificio(id: number): Promise<EdificioDetalle> {
  await delay()
  const edificio = solicitarEdificio(id)
  return {
    ...resumenEdificio(edificio),
    escalerasDetalle: escaleras
      .filter((escalera) => escalera.edificioId === id)
      .map(resumenEscalera),
    cuartosDetalle: cuartosDeEdificio(id).map(resumenCuarto),
  }
}

export async function crearEdificio(input: CrearEdificioInput): Promise<EdificioResumen> {
  await delay()
  const nombre = validarNombre(input.nombre, 'edificio', LIMITES.nombreEdificio)
  const nombreNormalizado = normalizarParaComparar(nombre)
  obtenerEstado(input.estadoConstructivoId)

  if (
    edificios.some(
      (edificio) => normalizarParaComparar(edificio.nombre) === nombreNormalizado,
    )
  ) {
    throw new Error('Ya existe un edificio con ese nombre.')
  }

  const edificio: EdificioRecord = {
    id: siguienteId(edificios),
    nombre,
    estadoConstructivoId: input.estadoConstructivoId,
  }
  edificios.push(edificio)
  registrarEvento(`Alta del ${nombre}`)
  return resumenEdificio(edificio)
}

export async function actualizarEdificio(
  id: number,
  input: ActualizarEdificioInput,
): Promise<EdificioResumen> {
  await delay()
  const edificio = solicitarEdificio(id)
  const nombre = validarNombre(input.nombre, 'edificio', LIMITES.nombreEdificio)
  const nombreNormalizado = normalizarParaComparar(nombre)
  obtenerEstado(input.estadoConstructivoId)

  if (
    edificios.some(
      (item) =>
        item.id !== id && normalizarParaComparar(item.nombre) === nombreNormalizado,
    )
  ) {
    throw new Error('Ya existe un edificio con ese nombre.')
  }

  edificio.nombre = nombre
  edificio.estadoConstructivoId = input.estadoConstructivoId
  registrarEvento(`Actualización del ${nombre}`)
  return resumenEdificio(edificio)
}

export async function eliminarEdificio(id: number): Promise<void> {
  await delay()
  const edificio = solicitarEdificio(id)

  if (escaleras.some((escalera) => escalera.edificioId === id)) {
    throw new Error('No se puede eliminar el edificio porque tiene escaleras registradas.')
  }

  edificios.splice(edificios.indexOf(edificio), 1)
  registrarEvento(`Eliminación del ${edificio.nombre}`)
}

export async function crearEscalera(
  edificioId: number,
  input: CrearEscaleraInput,
): Promise<EscaleraResumen> {
  await delay()
  const edificio = solicitarEdificio(edificioId)
  const nombre = validarNombre(input.nombre, 'escalera', LIMITES.nombreEscalera)
  const nombreNormalizado = normalizarParaComparar(nombre)

  if (
    escaleras.some(
      (escalera) =>
        escalera.edificioId === edificioId &&
        normalizarParaComparar(escalera.nombre) === nombreNormalizado,
    )
  ) {
    throw new Error('Ya existe una escalera con ese nombre en el edificio.')
  }

  const escalera: EscaleraRecord = {
    id: siguienteId(escaleras),
    nombre,
    edificioId,
  }
  escaleras.push(escalera)
  registrarEvento(`Registro de ${nombre} en ${edificio.nombre}`)
  return resumenEscalera(escalera)
}

export async function actualizarEscalera(
  id: number,
  input: ActualizarEscaleraInput,
): Promise<EscaleraResumen> {
  await delay()
  const escalera = solicitarEscalera(id)
  const nombre = validarNombre(input.nombre, 'escalera', LIMITES.nombreEscalera)
  const nombreNormalizado = normalizarParaComparar(nombre)

  if (
    escaleras.some(
      (item) =>
        item.id !== id &&
        item.edificioId === escalera.edificioId &&
        normalizarParaComparar(item.nombre) === nombreNormalizado,
    )
  ) {
    throw new Error('Ya existe una escalera con ese nombre en el edificio.')
  }

  escalera.nombre = nombre
  registrarEvento(`Actualización de ${nombre}`)
  return resumenEscalera(escalera)
}

export async function eliminarEscalera(id: number): Promise<void> {
  await delay()
  const escalera = solicitarEscalera(id)

  if (cuartos.some((cuarto) => cuarto.escaleraId === id)) {
    throw new Error('No se puede eliminar la escalera porque tiene cuartos registrados.')
  }

  escaleras.splice(escaleras.indexOf(escalera), 1)
  registrarEvento(`Eliminación de ${escalera.nombre}`)
}

export async function crearCuarto(
  escaleraId: number,
  input: CrearCuartoInput,
): Promise<CuartoResumen> {
  await delay()
  const escalera = solicitarEscalera(escaleraId)
  const nombre = validarNombre(input.nombre, 'cuarto', LIMITES.nombreCuarto)
  const nombreNormalizado = normalizarParaComparar(nombre)
  const capacidad = validarCapacidad(input.capacidadMaxima)

  obtenerEstado(input.estadoConstructivoId)

  if (
    cuartos.some(
      (cuarto) =>
        cuarto.escaleraId === escaleraId &&
        normalizarParaComparar(cuarto.nombre) === nombreNormalizado,
    )
  ) {
    throw new Error('Ya existe un cuarto con ese nombre en la escalera.')
  }

  const cuarto: CuartoRecord = {
    id: siguienteId(cuartos),
    nombre,
    capacidadMaxima: capacidad,
    escaleraId,
    estadoConstructivoId: input.estadoConstructivoId,
  }
  cuartos.push(cuarto)
  registrarEvento(`Alta del cuarto ${nombre} en ${escalera.nombre}`)
  return resumenCuarto(cuarto)
}

export async function actualizarCuarto(
  id: number,
  input: ActualizarCuartoInput,
): Promise<CuartoResumen> {
  await delay()
  const cuarto = solicitarCuarto(id)
  const nombre = validarNombre(input.nombre, 'cuarto', LIMITES.nombreCuarto)
  const nombreNormalizado = normalizarParaComparar(nombre)
  const capacidad = validarCapacidad(input.capacidadMaxima)

  const ocupados = ocupadosDeCuarto(id)
  if (capacidad < ocupados) {
    throw new Error('La capacidad no puede ser menor que las plazas ocupadas.')
  }

  obtenerEstado(input.estadoConstructivoId)

  if (
    cuartos.some(
      (item) =>
        item.id !== id &&
        item.escaleraId === cuarto.escaleraId &&
        normalizarParaComparar(item.nombre) === nombreNormalizado,
    )
  ) {
    throw new Error('Ya existe un cuarto con ese nombre en la escalera.')
  }

  cuarto.nombre = nombre
  cuarto.capacidadMaxima = capacidad
  cuarto.estadoConstructivoId = input.estadoConstructivoId
  registrarEvento(`Actualización del cuarto ${nombre}`)
  return resumenCuarto(cuarto)
}

export async function eliminarCuarto(id: number): Promise<void> {
  await delay()
  const cuarto = solicitarCuarto(id)

  if (alojamientos.some((alojamiento) => alojamiento.cuartoId === id)) {
    throw new Error('No se puede eliminar el cuarto porque tiene alojamientos asociados.')
  }

  cuartos.splice(cuartos.indexOf(cuarto), 1)
  registrarEvento(`Eliminación del cuarto ${cuarto.nombre}`)
}

export async function exportarReporteGeneral(): Promise<string> {
  await delay(100)
  const resumen = await obtenerResumen()
  const filas: CsvCell[][] = [
    ['Edificio', 'Escaleras', 'Cuartos', 'Capacidad', 'Ocupados', 'Ocupación (%)'],
    ...resumen.edificios.map((edificio) => [
      edificio.nombre,
      edificio.escaleras,
      edificio.cuartos,
      edificio.capacidad,
      edificio.ocupados,
      edificio.ocupacionPct,
    ]),
    [
      'Total',
      resumen.totalEscaleras,
      resumen.totalCuartos,
      resumen.capacidadTotal,
      resumen.ocupados,
      resumen.ocupacionPct,
    ],
  ]

  return serializarCsv(filas)
}

export async function exportarCenso(edificioId: number): Promise<string> {
  await delay(100)
  const edificio = solicitarEdificio(edificioId)
  const filas: CsvCell[][] = [
    ['Edificio', 'Escalera', 'Cuarto', 'Capacidad', 'Ocupados', 'Estado'],
  ]

  for (const cuarto of cuartosDeEdificio(edificioId)) {
    const escalera = escaleras.find((item) => item.id === cuarto.escaleraId)
    const estado = obtenerEstado(cuarto.estadoConstructivoId)
    filas.push([
      edificio.nombre,
      escalera?.nombre ?? 'Sin escalera',
      cuarto.nombre,
      cuarto.capacidadMaxima,
      ocupadosDeCuarto(cuarto.id),
      estado.nombre,
    ])
  }

  return serializarCsv(filas)
}

export const demoInfraestructuraRepository: InfraestructuraRepository = {
  obtenerEstadosConstructivos,
  obtenerResumen,
  obtenerEdificios,
  obtenerEdificio,
  crearEdificio,
  actualizarEdificio,
  eliminarEdificio,
  crearEscalera,
  actualizarEscalera,
  eliminarEscalera,
  crearCuarto,
  actualizarCuarto,
  eliminarCuarto,
  exportarReporteGeneral,
  exportarCenso,
}
