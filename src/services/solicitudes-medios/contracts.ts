import type {
  CrearSolicitudMedioInput,
  ResolverSolicitudMedioInput,
  SolicitudMedio,
  TipoMedioSolicitud,
} from '@/types/solicitud-medio'

export interface SolicitudesMediosRepository {
  obtenerTiposMedio(): Promise<TipoMedioSolicitud[]>
  crearSolicitud(input: CrearSolicitudMedioInput): Promise<SolicitudMedio>
  obtenerMisSolicitudes(): Promise<SolicitudMedio[]>
  obtenerSolicitudes(): Promise<SolicitudMedio[]>
  obtenerSolicitud(id: number): Promise<SolicitudMedio>
  aprobarSolicitud(id: number, input?: ResolverSolicitudMedioInput): Promise<SolicitudMedio>
  rechazarSolicitud(id: number, input?: ResolverSolicitudMedioInput): Promise<SolicitudMedio>
}
