import { describe, expect, it } from 'vitest'
import {
  LIMITES,
  normalizarParaComparar,
  normalizarTexto,
  validarCapacidad,
  validarCantidadMedio,
  validarEmail,
  validarNombre,
  validarPassword,
} from './validation'

describe('validarNombre', () => {
  it('normaliza espacios y rechaza nombres demasiado cortos', () => {
    expect(validarNombre('  Edificio   A  ', 'edificio', 80)).toBe('Edificio A')
    expect(() => validarNombre('A', 'edificio', 80)).toThrow('al menos 3')
  })

  it('rechaza nombres por encima del límite', () => {
    expect(() => validarNombre('a'.repeat(81), 'edificio', 80)).toThrow('80 caracteres')
  })

  it('rechaza caracteres de control', () => {
    expect(() => validarNombre('Edificio\u0000A', 'edificio', 80)).toThrow('no permitidos')
  })
})

describe('validarCapacidad', () => {
  it('acepta el rango permitido', () => {
    expect(validarCapacidad(1)).toBe(1)
    expect(validarCapacidad(LIMITES.capacidadMaxima)).toBe(LIMITES.capacidadMaxima)
  })

  it('rechaza decimales y valores fuera de rango', () => {
    expect(() => validarCapacidad(1.5)).toThrow('entero')
    expect(() => validarCapacidad(0)).toThrow('entre 1 y 20')
    expect(() => validarCapacidad(21)).toThrow('entre 1 y 20')
  })
})

describe('validarEmail y validarPassword', () => {
  it('normaliza el correo', () => {
    expect(validarEmail('  Usuario@CUJAE.edu.cu ')).toBe('usuario@cujae.edu.cu')
    expect(() => validarEmail('usuario')).toThrow('válido')
  })

  it('exige la longitud mínima de contraseña', () => {
    expect(() => validarPassword('1234567')).toThrow('8 caracteres')
    expect(validarPassword('12345678')).toBe('12345678')
  })
})

describe('validarCantidadMedio', () => {
  it('acepta el rango permitido 1-999', () => {
    expect(validarCantidadMedio(1)).toBe(1)
    expect(validarCantidadMedio(500)).toBe(500)
    expect(validarCantidadMedio(LIMITES.cantidadMedioMaxima)).toBe(LIMITES.cantidadMedioMaxima)
  })

  it('rechaza decimales y valores fuera de rango', () => {
    expect(() => validarCantidadMedio(0)).toThrow('entre 1 y 999')
    expect(() => validarCantidadMedio(1000)).toThrow('entre 1 y 999')
    expect(() => validarCantidadMedio(1.5)).toThrow('entero')
    expect(() => validarCantidadMedio(-1)).toThrow('entre 1 y 999')
  })
})

describe('normalizarTexto', () => {
  it('elimina espacios sobrantes y normaliza', () => {
    expect(normalizarTexto('  Hola   mundo  ')).toBe('Hola mundo')
    expect(normalizarTexto('')).toBe('')
    expect(normalizarTexto('   ')).toBe('')
  })
})

describe('normalizarParaComparar', () => {
  it('ignora mayúsculas, acentos y espacios repetidos', () => {
    expect(normalizarParaComparar('  Audit   Á  ')).toBe('audit a')
  })
})
