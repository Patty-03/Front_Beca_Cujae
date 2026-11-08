import type { AuthGateway, LoginCredentials, Role, Session } from '@/types/auth'
import { esRol, PERMISOS_POR_ROL } from '@/lib/auth'
import { validarEmail, validarPassword } from '@/lib/validation'

const demoRoleEnv: unknown = import.meta.env.VITE_DEMO_ROLE
const DEMO_ROLE: Role = esRol(demoRoleEnv) ? demoRoleEnv : 'estudiante'

function nombreDesdeEmail(email: string): string {
  const [parteLocal = ''] = email.split('@')
  const nombre = parteLocal
    .split(/[._-]/)
    .filter(Boolean)
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(' ')

  return nombre || 'Estudiante CUJAE'
}

export class DemoAuthGateway implements AuthGateway {
  private session: Session | null = null

  async login(credentials: LoginCredentials): Promise<Session> {
    const email = validarEmail(credentials.email)
    validarPassword(credentials.password)

    await new Promise((resolve) => setTimeout(resolve, 300))

    this.session = {
      user: {
        id: `demo-${DEMO_ROLE}`,
        name: nombreDesdeEmail(email),
        email,
        roles: [DEMO_ROLE],
        permissions: [...PERMISOS_POR_ROL[DEMO_ROLE]],
        estudianteId: DEMO_ROLE === 'estudiante' ? 1 : null,
      },
      expiresAt: null,
    }

    return this.session
  }

  async getSession(): Promise<Session | null> {
    return this.session
  }

  async logout(): Promise<void> {
    this.session = null
  }
}
