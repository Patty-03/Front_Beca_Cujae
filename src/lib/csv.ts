export type CsvCell = string | number | null | undefined

export interface CsvOptions {
  neutralizarFormulas?: boolean
  eol?: '\r\n' | '\n'
}

const INICIO_DE_FORMULA = /^[\s]*[=+\-@\t\r]/

function serializarCelda(value: CsvCell, neutralizarFormulas: boolean): string {
  if (value === null || value === undefined) return '""'

  let texto = String(value)

  if (neutralizarFormulas && typeof value === 'string' && INICIO_DE_FORMULA.test(texto)) {
    texto = `'${texto}`
  }

  return `"${texto.replace(/"/g, '""')}"`
}

export function serializarCsv(filas: CsvCell[][], options: CsvOptions = {}): string {
  const neutralizarFormulas = options.neutralizarFormulas ?? true
  const eol = options.eol ?? '\r\n'

  return filas
    .map((fila) => fila.map((celda) => serializarCelda(celda, neutralizarFormulas)).join(','))
    .join(eol)
}
