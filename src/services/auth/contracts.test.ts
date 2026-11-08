import { describe, expect, it } from 'vitest'
import type { Session } from '@/types/auth'
import { esSesion, sesionExpirada } from './contracts'

const sesionValida: Session = {
  user: {
    id: 'u-1',
    name: 'Ana',
    email: 'ana@cujae.edu.cu',
    roles: ['estudiante'],
    permissions: ['infraestructura:read'],
  },
  expiresAt: null,
}

describe('esSesion', () => {
  it('acepta una sesión válida', () => {
    expect(esSesion(sesionValida)).toBe(true)
  })

  it('rechaza roles y permisos desconocidos', () => {
    expect(esSesion({ ...sesionValida, user: { ...sesionValida.user, roles: ['root'] } })).toBe(
      false,
    )
    expect(
      esSesion({ ...sesionValida, user: { ...sesionValida.user, permissions: ['*'] } }),
    ).toBe(false)
  })

  it('rechaza valores con tipos incorrectos', () => {
    expect(esSesion({ ...sesionValida, user: { ...sesionValida.user, name: 2 } })).toBe(false)
  })
})

describe('sesionExpirada', () => {
  it('considera expiradas las fechas pasadas o inválidas', () => {
    expect(sesionExpirada({ ...sesionValida, expiresAt: '2000-01-01T00:00:00.000Z' })).toBe(
      true,
    )
    expect(sesionExpirada({ ...sesionValida, expiresAt: 'no-es-fecha' })).toBe(true)
  })

  it('no considera expirada una sesión sin caducidad', () => {
    expect(sesionExpirada(sesionValida)).toBe(false)
  })
})
