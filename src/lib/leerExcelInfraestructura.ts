import { readSheet } from 'read-excel-file/browser'
import type { EstadoConstructivo } from '@/types/infraestructura'
import { parsearFilasInfraestructura } from './importarInfraestructura'

export async function leerArchivoInfraestructura(
  archivo: File,
  estados: EstadoConstructivo[],
) {
  const filas = await readSheet(archivo)
  return parsearFilasInfraestructura(filas, estados)
}
