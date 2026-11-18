import writeXlsxFile from 'write-excel-file/browser'

export async function descargarPlantillaEstudiantes(): Promise<void> {
  const encabezados = [
    'Carrera', 'Vía de Ingreso', 'Modalidad', 'CI', 'Apellidos y Nombre(S)', 'Sexo',
    'Preuniversitario', 'Prov', 'Mun', 'IA', 'Preselec', 'ESC', 'Conv', 'Opc', 'SMA',
  ]
  const ejemplo = [
    'Ing. Informática', 'Institutos Preuniversitarios', 'Curso Diurno', '05010112345',
    'Rodríguez Pérez Ana', 'F', 'IPVCE Federico Engels', 'VC', 'Santa Clara',
    '', '', '', '', '', '',
  ]

  await writeXlsxFile([
    { data: [encabezados, ejemplo], sheet: 'Listado' },
    {
      data: [
        ['Indicaciones'],
        ['Formato institucional de prematrícula/nuevo ingreso.'],
        ['Columnas requeridas: CI, Apellidos y Nombre(S), Carrera, Sexo, Prov (sigla), Mun.'],
        ['La fecha de nacimiento se infiere del CI (YYMMDD).'],
        ['Si no se indica año académico se asume 1 (nuevo ingreso).'],
        ['Prov usa sigla de provincia (LH, MT, VC, etc.). Carnets duplicados/existentes se omiten; filas inválidas se rechazan.'],
      ],
      sheet: 'Instrucciones',
    },
  ]).toFile('plantilla-estudiantes.xlsx')
}
