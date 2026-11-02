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
  InfraestructuraResumen,
} from '@/types/infraestructura'

export interface InfraestructuraRepository {
  obtenerEstadosConstructivos(): Promise<EstadoConstructivo[]>
  obtenerResumen(): Promise<InfraestructuraResumen>
  obtenerEdificios(): Promise<EdificioResumen[]>
  obtenerEdificio(id: number): Promise<EdificioDetalle>
  crearEdificio(input: CrearEdificioInput): Promise<EdificioResumen>
  actualizarEdificio(id: number, input: ActualizarEdificioInput): Promise<EdificioResumen>
  eliminarEdificio(id: number): Promise<void>
  crearEscalera(edificioId: number, input: CrearEscaleraInput): Promise<EscaleraResumen>
  actualizarEscalera(id: number, input: ActualizarEscaleraInput): Promise<EscaleraResumen>
  eliminarEscalera(id: number): Promise<void>
  crearCuarto(escaleraId: number, input: CrearCuartoInput): Promise<CuartoResumen>
  actualizarCuarto(id: number, input: ActualizarCuartoInput): Promise<CuartoResumen>
  eliminarCuarto(id: number): Promise<void>
  exportarReporteGeneral(): Promise<string>
  exportarCenso(edificioId: number): Promise<string>
}
