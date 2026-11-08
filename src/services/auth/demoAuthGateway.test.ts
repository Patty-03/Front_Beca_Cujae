import { describe, expect, it } from 'vitest'
import type { Role } from '@/types/auth'
import { esRol, PERMISOS_POR_ROL } from '@/lib/auth'
import { DemoAuthGateway } from './demoAuthGateway'

const demoRoleEnv: unknown = import.meta.env.VITE_DEMO_ROLE
const rolEsperado: Role = esRol(demoRoleEnv) ? demoRoleEnv : 'estudiante'

describe('DemoAuthGateway', () => {
  it('crea una sesión en memoria sin persistencia', async () => {
    const gateway = new DemoAuthGateway()
    expect(await gateway.getSession()).toBeNull()

    const session = await gateway.login({
      email: 'ana.perez@cujae.edu.cu',
      password: '12345678',
      remember: true,
    })

    expect(session.user.name).toBe('Ana Perez')
    expect(session.user.roles).toEqual([rolEsperado])
    expect(session.user.permissions).toEqual(PERMISOS_POR_ROL[rolEsperado])
    expect(await gateway.getSession()).toBe(session)
  })

  it('rechaza contraseñas cortas y correos inválidos', async () => {
    const gateway = new DemoAuthGateway()

    await expect(
      gateway.login({ email: 'ana@cujae.edu.cu', password: '1234', remember: false }),
    ).rejects.toThrow('8 caracteres')
    await expect(
      gateway.login({ email: 'no-es-correo', password: '12345678', remember: false }),
    ).rejects.toThrow('válido')
  })

  it('limpia la sesión al cerrar sesión', async () => {
    const gateway = new DemoAuthGateway()
    await gateway.login({
      email: 'ana@cujae.edu.cu',
      password: '12345678',
      remember: false,
    })

    await gateway.logout()

    expect(await gateway.getSession()).toBeNull()
  })
})
