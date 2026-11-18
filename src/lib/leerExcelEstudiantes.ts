import readXlsxFile from 'read-excel-file/browser'
import { parsearFilasEstudiantes, seleccionarHojaDatos } from '@/lib/importarEstudiantes'

export async function leerArchivoEstudiantes(
  archivo: File,
  carnetsExistentes: Iterable<string> = [],
) {
  const resultado = await readXlsxFile(archivo)
  let filas: readonly (readonly unknown[])[] = []
  if (Array.isArray(resultado) && resultado.length && resultado[0] && Array.isArray((resultado[0] as any).data)) {
    filas = seleccionarHojaDatos(resultado as { sheet?: string; data?: unknown[][] }[])
  } else if (Array.isArray(resultado)) {
    filas = resultado as unknown[][]
  }
  return parsearFilasEstudiantes(filas, carnetsExistentes)
}
