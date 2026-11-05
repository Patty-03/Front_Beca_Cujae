import writeXlsxFile from 'write-excel-file/browser'
import type { EstadoConstructivo } from '@/types/infraestructura'
import { COLUMNAS_INFRAESTRUCTURA } from '@/lib/importarInfraestructura'

export async function descargarPlantillaInfraestructura(estados: EstadoConstructivo[]): Promise<void> {
  const encabezados = COLUMNAS_INFRAESTRUCTURA.map((columna) => columna.encabezado)

  const ejemplo = [
    'Edificio 1',
    'Bueno',
    'Escalera A',
    '101',
    4,
    'Bueno',
  ]

  const catalogoEstados = [['Estados constructivos disponibles']]
  for (const estado of estados) {
    catalogoEstados.push([estado.nombre])
  }

  await writeXlsxFile([
    {
      data: [encabezados, ejemplo],
      sheet: 'Infraestructura',
    },
    {
      data: catalogoEstados,
      sheet: 'Catálogos',
    },
    {
      data: [
        ['Indicaciones'],
        ['Registra cada cuarto indicando su edificio, escalera asociada, capacidad y estados constructivos.'],
        ['Si el edificio o escalera ya existen, los cuartos se añadirán a los mismos.'],
        ['Las columnas marcadas son obligatorias.'],
      ],
      sheet: 'Instrucciones',
    },
  ]).toFile('plantilla-infraestructura.xlsx')
}
