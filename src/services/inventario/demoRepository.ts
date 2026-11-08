import { cuartos, escaleras } from '@/data/mockInfraestructura'
import { medios, type MedioRecord } from '@/data/mockInventario'
import type {
  ActualizarMedioInput,
  CrearMedioInput,
  MedioDeCuarto,
} from '@/types/inventario'
import { esEstadoMedio, esTipoMedio, TIPOS_MEDIO } from '@/lib/inventario'
import {
  validarCantidadMedio,
  validarObservacionesMedio,
} from '@/lib/validation'
import { useAuthStore } from '@/stores/auth'
import type { EventoAuditoriaRecord } from '@/data/mockInfraestructura'
import { eventosAuditoria } from '@/data/mockInfraestructura'
import type { InventarioRepository } from './contracts'

const delay = (ms = 240) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const siguienteId = (registros: Array<{ id: number }>) =>
  registros.reduce((maximo, registro) => Math.max(maximo, registro.id), 0) + 1

const aMedio = (registro: MedioRecord): MedioDeCuarto => ({
  id: registro.id,
  cuartoId: registro.cuartoId,
  tipo: registro.tipo,
  cantidad: registro.cantidad,
  estado: registro.estado,
  observaciones: registro.observaciones,
})

const solicitarCuarto = (cuartoId: number) => {
  const cuarto = cuartos.find((item) => item.id === cuartoId)
  if (!cuarto) throw new Error('El cuarto solicitado no existe.')
  return cuarto
}

const solicitarMedio = (id: number): MedioRecord => {
  const medio = medios.find((item) => item.id === id)
  if (!medio) throw new Error('El medio solicitado no existe.')
  return medio
}

const validarTipo = (tipo: unknown) => {
  if (!esTipoMedio(tipo)) throw new Error('El tipo de medio seleccionado no es válido.')
}

const validarEstado = (estado: unknown) => {
  if (!esEstadoMedio(estado)) throw new Error('El estado del medio seleccionado no es válido.')
}

const registrarEvento = (funcionalidad: string): EventoAuditoriaRecord => {
  const auth = useAuthStore()
  const evento: EventoAuditoriaRecord = {
    id: siguienteId(eventosAuditoria),
    usuario: auth.user?.name ?? 'Sistema',
    servicio: 'Inventario',
    funcionalidad,
    fecha: new Date().toISOString(),
  }
  eventosAuditoria.push(evento)
  return evento
}

const ordenarMedios = (registros: MedioRecord[]) =>
  [...registros].sort((a, b) => {
    const ordenTipo = TIPOS_MEDIO.indexOf(a.tipo) - TIPOS_MEDIO.indexOf(b.tipo)
    if (ordenTipo !== 0) return ordenTipo
    return a.id - b.id
  })

export async function obtenerMediosCuarto(cuartoId: number): Promise<MedioDeCuarto[]> {
  await delay(120)
  solicitarCuarto(cuartoId)
  return ordenarMedios(medios.filter((medio) => medio.cuartoId === cuartoId)).map(aMedio)
}

export async function crearMedio(input: CrearMedioInput): Promise<MedioDeCuarto> {
  await delay()
  const cuarto = solicitarCuarto(input.cuartoId)
  validarTipo(input.tipo)
  validarEstado(input.estado)
  const cantidad = validarCantidadMedio(input.cantidad)
  const observaciones = input.observaciones
    ? validarObservacionesMedio(input.observaciones)
    : undefined

  const existente = medios.find(
    (medio) =>
      medio.cuartoId === cuarto.id && medio.tipo === input.tipo && medio.estado === input.estado,
  )

  if (existente) {
    existente.cantidad += cantidad
    if (observaciones) existente.observaciones = observaciones
    registrarEvento(`Actualización de medios del cuarto ${cuarto.nombre}`)
    return aMedio(existente)
  }

  const medio: MedioRecord = {
    id: siguienteId(medios),
    cuartoId: cuarto.id,
    tipo: input.tipo,
    cantidad,
    estado: input.estado,
    observaciones,
  }
  medios.push(medio)
  registrarEvento(`Alta de medio en el cuarto ${cuarto.nombre}`)
  return aMedio(medio)
}

export async function actualizarMedio(
  id: number,
  input: ActualizarMedioInput,
): Promise<MedioDeCuarto> {
  await delay()
  const medio = solicitarMedio(id)
  const cuarto = solicitarCuarto(medio.cuartoId)
  validarTipo(input.tipo)
  validarEstado(input.estado)
  const cantidad = validarCantidadMedio(input.cantidad)
  const observaciones = input.observaciones
    ? validarObservacionesMedio(input.observaciones)
    : undefined

  medio.tipo = input.tipo
  medio.cantidad = cantidad
  medio.estado = input.estado
  medio.observaciones = observaciones
  registrarEvento(`Actualización de medios del cuarto ${cuarto.nombre}`)
  return aMedio(medio)
}

export async function eliminarMedio(id: number): Promise<void> {
  await delay()
  const medio = solicitarMedio(id)
  const cuarto = solicitarCuarto(medio.cuartoId)
  medios.splice(medios.indexOf(medio), 1)
  registrarEvento(`Eliminación de medio en el cuarto ${cuarto.nombre}`)
}

export async function contarMediosEdificio(edificioId: number): Promise<number> {
  await delay(120)
  const idsEscaleras = new Set(
    escaleras.filter((escalera) => escalera.edificioId === edificioId).map((escalera) => escalera.id),
  )
  const cuartosEdificio = cuartos.filter((cuarto) => idsEscaleras.has(cuarto.escaleraId))
  const idsCuartos = new Set(cuartosEdificio.map((cuarto) => cuarto.id))
  return medios.filter((medio) => idsCuartos.has(medio.cuartoId)).length
}

export const demoInventarioRepository: InventarioRepository = {
  obtenerMediosCuarto,
  crearMedio,
  actualizarMedio,
  eliminarMedio,
}
