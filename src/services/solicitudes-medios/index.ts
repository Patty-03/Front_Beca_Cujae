import type {
  CrearSolicitudMedioInput,
  ResolverSolicitudMedioInput,
} from '@/types/solicitud-medio'
import { modoDemo } from '@/services/auth'
import { demoSolicitudesMediosRepository } from './demoRepository'
import { HttpSolicitudesMediosRepository } from './httpRepository'

const repositorio = modoDemo
  ? demoSolicitudesMediosRepository
  : new HttpSolicitudesMediosRepository()

export const obtenerTiposMedio = () => repositorio.obtenerTiposMedio()

export const crearSolicitud = (input: CrearSolicitudMedioInput) =>
  repositorio.crearSolicitud(input)

export const obtenerMisSolicitudes = () => repositorio.obtenerMisSolicitudes()

export const obtenerSolicitudes = () => repositorio.obtenerSolicitudes()

export const obtenerSolicitud = (id: number) => repositorio.obtenerSolicitud(id)

export const aprobarSolicitud = (id: number, input?: ResolverSolicitudMedioInput) =>
  repositorio.aprobarSolicitud(id, input)

export const rechazarSolicitud = (id: number, input?: ResolverSolicitudMedioInput) =>
  repositorio.rechazarSolicitud(id, input)
