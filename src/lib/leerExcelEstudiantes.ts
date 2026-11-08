import { readSheet } from 'read-excel-file/browser'
import { parsearFilasEstudiantes } from '@/lib/importarEstudiantes'

export async function leerArchivoEstudiantes(
  archivo: File,
  carnetsExistentes: Iterable<string> = [],
) {
  const filas = await readSheet(archivo)
  return parsearFilasEstudiantes(filas, carnetsExistentes)
}
