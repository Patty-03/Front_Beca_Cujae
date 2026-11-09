import type {
  CrearSolicitudMedioInput,
  EstadoSolicitudMedio,
  ResolverSolicitudMedioInput,
  SolicitudMedio,
  TipoMedioSolicitud,
} from '@/types/solicitud-medio'
import { normalizarTexto, validarCantidadMedio } from '@/lib/validation'
import { useAuthStore } from '@/stores/auth'
import type { SolicitudesMediosRepository } from './contracts'

const delay = (ms = 240) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const siguienteId = (registros: Array<{ id: number }>) =>
  registros.reduce((maximo, registro) => Math.max(maximo, registro.id), 0) + 1

const TIPOS_MEDIO_DEMO: TipoMedioSolicitud[] = [
  { id: 1, codigo: 'cama', nombre: 'Cama', activo: true },
  { id: 2, codigo: 'colchon', nombre: 'Colchón', activo: true },
  { id: 3, codigo: 'almohada', nombre: 'Almohada', activo: true },
  { id: 4, codigo: 'ventilador', nombre: 'Ventilador', activo: true },
  { id: 5, codigo: 'lampara', nombre: 'Lámpara', activo: true },
  { id: 6, codigo: 'mesilla', nombre: 'Mesilla', activo: true },
  { id: 7, codigo: 'ropero', nombre: 'Ropero', activo: true },
  { id: 8, codigo: 'silla', nombre: 'Silla', activo: true },
  { id: 9, codigo: 'escritorio', nombre: 'Escritorio', activo: true },
  { id: 10, codigo: 'taquilla', nombre: 'Taquilla', activo: true },
  { id: 11, codigo: 'llave', nombre: 'Llave', activo: true },
  { id: 12, codigo: 'otro', nombre: 'Otro', activo: true },
]

const solicitudes: SolicitudMedio[] = [
  {
    id: 1,
    estudianteId: 1,
    estudianteNombre: 'Ana Pérez Gómez',
    tipoMedioId: 4,
    tipoMedioNombre: 'Ventilador',
    cantidad: 1,
    motivo: 'El ventilador del cuarto no funciona y hace mucho calor.',
    estado: 'pendiente',
    fechaSolicitud: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    fechaResolucion: null,
    resueltoPor: null,
    observacionesResolucion: null,
  },
  {
    id: 2,
    estudianteId: 2,
    estudianteNombre: 'Bruno Díaz López',
    tipoMedioId: 2,
    tipoMedioNombre: 'Colchón',
    cantidad: 1,
    motivo: 'El colchón está roto y no permite descansar.',
    estado: 'aprobada',
    fechaSolicitud: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    fechaResolucion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    resueltoPor: 1,
    observacionesResolucion: 'Se entregará en el almacén de la residencia.',
  },
  {
    id: 3,
    estudianteId: 1,
    estudianteNombre: 'Ana Pérez Gómez',
    tipoMedioId: 7,
    tipoMedioNombre: 'Ropero',
    cantidad: 1,
    motivo: 'Necesito un ropero para guardar mis pertenencias.',
    estado: 'rechazada',
    fechaSolicitud: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    fechaResolucion: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    resueltoPor: 1,
    observacionesResolucion: 'El cuarto ya cuenta con un ropero asignado.',
  },
]

const ordenar = (registros: SolicitudMedio[]) =>
  [...registros].sort(
    (a, b) => Date.parse(b.fechaSolicitud) - Date.parse(a.fechaSolicitud) || b.id - a.id,
  )

function solicitarTipo(id: number): TipoMedioSolicitud {
  const tipo = TIPOS_MEDIO_DEMO.find((item) => item.id === id)
  if (!tipo || !tipo.activo) {
    throw new Error('El tipo de medio seleccionado no existe o está desactivado.')
  }
  return tipo
}

function resolverDemo(
  id: number,
  estado: EstadoSolicitudMedio,
  input?: ResolverSolicitudMedioInput,
): SolicitudMedio {
  const solicitud = solicitudes.find((item) => item.id === id)
  if (!solicitud) throw new Error('La solicitud indicada no existe.')
  if (solicitud.estado !== 'pendiente') {
    throw new Error('La solicitud ya fue resuelta.')
  }

  solicitud.estado = estado
  solicitud.fechaResolucion = new Date().toISOString()
  solicitud.resueltoPor = 1
  solicitud.observacionesResolucion = input?.observacionesResolucion
    ? normalizarTexto(input.observacionesResolucion)
    : null

  return { ...solicitud }
}

export const demoSolicitudesMediosRepository: SolicitudesMediosRepository = {
  async obtenerTiposMedio() {
    await delay(120)
    return TIPOS_MEDIO_DEMO.filter((tipo) => tipo.activo).map((tipo) => ({ ...tipo }))
  },

  async crearSolicitud(input: CrearSolicitudMedioInput) {
    await delay()
    const tipo = solicitarTipo(input.tipoMedioId)
    const cantidad = validarCantidadMedio(input.cantidad)
    const motivo = normalizarTexto(input.motivo)

    if (!motivo) throw new Error('El motivo de la solicitud es obligatorio.')
    if (motivo.length > 255) {
      throw new Error('El motivo no puede superar los 255 caracteres.')
    }

    const auth = useAuthStore()
    const solicitud: SolicitudMedio = {
      id: siguienteId(solicitudes),
      estudianteId: auth.user?.estudianteId ?? 1,
      estudianteNombre: auth.user?.name ?? 'Estudiante CUJAE',
      tipoMedioId: tipo.id,
      tipoMedioNombre: tipo.nombre,
      cantidad,
      motivo,
      estado: 'pendiente',
      fechaSolicitud: new Date().toISOString(),
      fechaResolucion: null,
      resueltoPor: null,
      observacionesResolucion: null,
    }

    solicitudes.push(solicitud)
    return { ...solicitud }
  },

  async obtenerMisSolicitudes() {
    await delay(120)
    const auth = useAuthStore()
    const estudianteId = auth.user?.estudianteId ?? 1
    return ordenar(solicitudes.filter((item) => item.estudianteId === estudianteId)).map(
      (item) => ({ ...item }),
    )
  },

  async obtenerSolicitudes() {
    await delay(160)
    return ordenar(solicitudes).map((item) => ({ ...item }))
  },

  async obtenerSolicitud(id: number) {
    await delay(120)
    const solicitud = solicitudes.find((item) => item.id === id)
    if (!solicitud) throw new Error('La solicitud indicada no existe.')
    return { ...solicitud }
  },

  async aprobarSolicitud(id: number, input?: ResolverSolicitudMedioInput) {
    await delay()
    return resolverDemo(id, 'aprobada', input)
  },

  async rechazarSolicitud(id: number, input?: ResolverSolicitudMedioInput) {
    await delay()
    return resolverDemo(id, 'rechazada', input)
  },
}
