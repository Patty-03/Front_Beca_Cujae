export const LIMITES = {
  nombreEdificio: 80,
  nombreEscalera: 80,
  nombreCuarto: 40,
  capacidadMinima: 1,
  capacidadMaxima: 20,
  email: 254,
  passwordMinima: 8,
  passwordMaxima: 128,
} as const

function tieneCaracteresDeControl(value: string): boolean {
  for (const caracter of value) {
    const codigo = caracter.codePointAt(0) ?? 0
    if (codigo <= 0x1f || codigo === 0x7f) return true
  }

  return false
}

export function normalizarTexto(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function normalizarParaComparar(value: string): string {
  return normalizarTexto(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function validarNombre(value: unknown, entidad: string, maximo: number): string {
  if (typeof value !== 'string') {
    throw new Error(`El nombre del ${entidad} es obligatorio.`)
  }

  const nombre = normalizarTexto(value)

  if (nombre.length < 3) {
    throw new Error(`El nombre del ${entidad} debe tener al menos 3 caracteres.`)
  }

  if (nombre.length > maximo) {
    throw new Error(`El nombre del ${entidad} no puede superar los ${maximo} caracteres.`)
  }

  if (tieneCaracteresDeControl(nombre)) {
    throw new Error(`El nombre del ${entidad} contiene caracteres no permitidos.`)
  }

  return nombre
}

export function validarCapacidad(value: unknown): number {
  const capacidad = typeof value === 'number' ? value : Number(value)

  if (!Number.isInteger(capacidad)) {
    throw new Error('La capacidad del cuarto debe ser un número entero.')
  }

  if (capacidad < LIMITES.capacidadMinima || capacidad > LIMITES.capacidadMaxima) {
    throw new Error(
      `La capacidad del cuarto debe estar entre ${LIMITES.capacidadMinima} y ${LIMITES.capacidadMaxima}.`,
    )
  }

  return capacidad
}

export function validarEmail(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Introduce un correo electrónico válido.')
  }

  const email = value.trim().toLowerCase()

  if (email.length > LIMITES.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Introduce un correo electrónico válido.')
  }

  return email
}

export function validarPassword(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('La contraseña es obligatoria.')
  }

  if (value.length < LIMITES.passwordMinima) {
    throw new Error(`La contraseña debe tener al menos ${LIMITES.passwordMinima} caracteres.`)
  }

  if (value.length > LIMITES.passwordMaxima) {
    throw new Error(`La contraseña no puede superar los ${LIMITES.passwordMaxima} caracteres.`)
  }

  return value
}
