import type { CrearMedioInput, MedioDeCuarto, ActualizarMedioInput } from '@/types/inventario'

export interface InventarioRepository {
  obtenerMediosCuarto(cuartoId: number): Promise<MedioDeCuarto[]>
  crearMedio(input: CrearMedioInput): Promise<MedioDeCuarto>
  actualizarMedio(id: number, input: ActualizarMedioInput): Promise<MedioDeCuarto>
  eliminarMedio(id: number): Promise<void>
}
