import { describe, expect, it } from 'vitest'
import { serializarCsv } from './csv'

describe('serializarCsv', () => {
  it('entrecomilla todos los campos y duplica comillas internas', () => {
    const csv = serializarCsv([['Nombre', 'Valor'], ['Audit, "X"', 'linea 1\nlinea 2']])

    expect(csv).toBe(
      '"Nombre","Valor"\r\n"Audit, ""X""","linea 1\nlinea 2"',
    )
  })

  it('neutraliza fórmulas en textos', () => {
    const csv = serializarCsv([['=HYPERLINK("http://example.com")'], ['+1'], ['-2'], ['@cmd']])

    expect(csv).toBe(
      '"\'=HYPERLINK(""http://example.com"")"\r\n"\'+1"\r\n"\'-2"\r\n"\'@cmd"',
    )
  })

  it('no altera números negativos', () => {
    expect(serializarCsv([[-5]])).toBe('"-5"')
  })

  it('permite desactivar la neutralización', () => {
    expect(serializarCsv([['=1+1']], { neutralizarFormulas: false })).toBe('"=1+1"')
  })
})
